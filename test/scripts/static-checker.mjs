import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";

const ignoredDirectories = new Set([
  ".git",
  ".lighthouseci",
  "_site",
  "node_modules",
  "playwright-report",
  "test-results",
]);

const localSchemes = new Set(["", "file:"]);
const externalSchemes = new Set(["http:", "https:", "mailto:", "tel:"]);

export function splitReference(reference) {
  const hashIndex = reference.indexOf("#");
  const beforeHash =
    hashIndex === -1 ? reference : reference.slice(0, hashIndex);
  const fragment =
    hashIndex === -1 ? "" : decodeURIComponent(reference.slice(hashIndex + 1));
  const queryIndex = beforeHash.indexOf("?");
  const pathname =
    queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);

  return { fragment, pathname };
}

export function isExternalReference(reference) {
  try {
    const parsed = new URL(reference, "file:///placeholder/");
    return externalSchemes.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function getAttribute(attributes, name) {
  const expression = new RegExp(
    `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    "i",
  );
  const match = attributes.match(expression);
  return match ? (match[1] ?? match[2] ?? "") : null;
}

export function extractTags(html) {
  return Array.from(
    html.matchAll(/<(a|img|link|script|source)\b([^>]*)>/gi),
    ([, tag, attributes]) => ({
      attributes,
      tag: tag.toLowerCase(),
    }),
  );
}

export async function collectFiles(rootDirectory, extensions) {
  const files = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
        files.push(absolutePath);
      }
    }
  }

  await visit(rootDirectory);
  return files.sort();
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function exactCaseExists(rootDirectory, target) {
  const relative = path.relative(rootDirectory, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return relative === "";
  }

  let current = rootDirectory;
  for (const segment of relative.split(path.sep)) {
    const entries = await readdir(current);
    if (!entries.includes(segment)) {
      return false;
    }
    current = path.join(current, segment);
  }
  return true;
}

async function resolveLocalReference(rootDirectory, sourceFile, reference) {
  const { fragment, pathname } = splitReference(reference);
  const decodedPath = decodeURIComponent(pathname);
  let target = decodedPath
    ? path.resolve(path.dirname(sourceFile), decodedPath)
    : sourceFile;

  const relative = path.relative(rootDirectory, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`escapes the repository: ${reference}`);
  }

  if (await exists(target)) {
    const targetStats = await stat(target);
    if (targetStats.isDirectory()) {
      target = path.join(target, "index.html");
    }
  }

  return { fragment, target };
}

function collectIds(html) {
  return Array.from(html.matchAll(/\sid\s*=\s*(?:"([^"]+)"|'([^']+)')/gi))
    .map((match) => match[1] ?? match[2])
    .filter(Boolean);
}

function collectCssReferences(css) {
  return Array.from(css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^'")]+))/gi))
    .map((match) => (match[1] ?? match[2] ?? match[3]).trim())
    .filter(Boolean);
}

function fail(errors, sourceFile, rootDirectory, message) {
  errors.push(`${path.relative(rootDirectory, sourceFile)}: ${message}`);
}

async function validateHtmlFiles(rootDirectory, htmlFiles, errors) {
  const htmlCache = new Map();
  const idCache = new Map();
  let largestPage = { bytes: 0, file: "" };

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    htmlCache.set(htmlFile, html);
    const ids = collectIds(html);
    idCache.set(htmlFile, new Set(ids));

    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      fail(
        errors,
        htmlFile,
        rootDirectory,
        `duplicate ids: ${[...new Set(duplicateIds)].join(", ")}`,
      );
    }

    const requiredPatterns = [
      [/<html\b[^>]*\blang=/i, "missing document language"],
      [/<meta\b[^>]*\bname=["']viewport["']/i, "missing viewport metadata"],
      [/<meta\b[^>]*\bname=["']referrer["']/i, "missing referrer policy"],
      [
        /<meta\b[^>]*\bhttp-equiv=["']Content-Security-Policy["']/i,
        "missing Content Security Policy",
      ],
    ];

    for (const [pattern, message] of requiredPatterns) {
      if (!pattern.test(html)) {
        fail(errors, htmlFile, rootDirectory, message);
      }
    }

    const forbiddenPatterns = [
      [/\bhttp:\/\//i, "contains an insecure HTTP URL"],
      [/\sstyle\s*=/i, "contains an inline style"],
      [/\son[a-z]+\s*=/i, "contains an inline event handler"],
      [/<style\b/i, "contains an inline style block"],
      [/<script\b(?![^>]*\bsrc=)/i, "contains an inline script"],
    ];

    for (const [pattern, message] of forbiddenPatterns) {
      if (pattern.test(html)) {
        fail(errors, htmlFile, rootDirectory, message);
      }
    }

    for (const attributeName of ["aria-describedby", "aria-labelledby"]) {
      const expression = new RegExp(
        `\\s${attributeName}\\s*=\\s*(?:"([^"]+)"|'([^']+)')`,
        "gi",
      );
      for (const match of html.matchAll(expression)) {
        const references = (match[1] ?? match[2]).split(/\s+/);
        for (const reference of references) {
          if (!idCache.get(htmlFile).has(reference)) {
            fail(
              errors,
              htmlFile,
              rootDirectory,
              `${attributeName} references missing id "${reference}"`,
            );
          }
        }
      }
    }

    let pageBytes = Buffer.byteLength(html);
    const visitedAssets = new Set();

    for (const { attributes, tag } of extractTags(html)) {
      const attributeName = tag === "a" || tag === "link" ? "href" : "src";
      const reference = getAttribute(attributes, attributeName);
      if (!reference || reference.startsWith("#")) {
        continue;
      }

      if (isExternalReference(reference)) {
        if (tag !== "a") {
          fail(
            errors,
            htmlFile,
            rootDirectory,
            `runtime resource must be local: ${reference}`,
          );
        } else {
          const rel = getAttribute(attributes, "rel") ?? "";
          if (!rel.split(/\s+/).includes("external")) {
            fail(
              errors,
              htmlFile,
              rootDirectory,
              `external link lacks rel="external": ${reference}`,
            );
          }
        }
        continue;
      }

      let parsed;
      try {
        parsed = new URL(reference, "file:///placeholder/");
      } catch {
        fail(errors, htmlFile, rootDirectory, `invalid URL: ${reference}`);
        continue;
      }

      if (!localSchemes.has(parsed.protocol)) {
        continue;
      }

      try {
        const { fragment, target } = await resolveLocalReference(
          rootDirectory,
          htmlFile,
          reference,
        );
        if (!(await exists(target))) {
          fail(
            errors,
            htmlFile,
            rootDirectory,
            `missing local target: ${reference}`,
          );
          continue;
        }
        if (!(await exactCaseExists(rootDirectory, target))) {
          fail(
            errors,
            htmlFile,
            rootDirectory,
            `path case does not match the filesystem: ${reference}`,
          );
        }

        if (
          fragment &&
          path.extname(target).toLowerCase() === ".html" &&
          !(
            idCache.get(target) ??
            new Set(collectIds(await readFile(target, "utf8")))
          ).has(fragment)
        ) {
          fail(
            errors,
            htmlFile,
            rootDirectory,
            `missing fragment "${fragment}" in ${reference}`,
          );
        }

        if (tag !== "a" && !visitedAssets.has(target)) {
          visitedAssets.add(target);
          pageBytes += (await stat(target)).size;

          if (path.extname(target).toLowerCase() === ".css") {
            const css = await readFile(target, "utf8");
            for (const cssReference of collectCssReferences(css)) {
              if (
                cssReference.startsWith("data:") ||
                isExternalReference(cssReference)
              ) {
                continue;
              }
              const resolvedCssAsset = await resolveLocalReference(
                rootDirectory,
                target,
                cssReference,
              );
              if (
                (await exists(resolvedCssAsset.target)) &&
                !visitedAssets.has(resolvedCssAsset.target)
              ) {
                visitedAssets.add(resolvedCssAsset.target);
                pageBytes += (await stat(resolvedCssAsset.target)).size;
              }
            }
          }
        }
      } catch (error) {
        fail(errors, htmlFile, rootDirectory, error.message);
      }
    }

    if (pageBytes > 500 * 1024) {
      fail(
        errors,
        htmlFile,
        rootDirectory,
        `initial local resources exceed 500 KB (${Math.ceil(pageBytes / 1024)} KB)`,
      );
    }
    if (pageBytes > largestPage.bytes) {
      largestPage = {
        bytes: pageBytes,
        file: path.relative(rootDirectory, htmlFile),
      };
    }
  }

  return largestPage;
}

async function validateCssFiles(rootDirectory, cssFiles, errors) {
  for (const cssFile of cssFiles) {
    const css = await readFile(cssFile, "utf8");
    try {
      postcss.parse(css, { from: cssFile });
    } catch (error) {
      fail(errors, cssFile, rootDirectory, `CSS parse error: ${error.reason}`);
    }

    if (/\bhttp:\/\//i.test(css)) {
      fail(errors, cssFile, rootDirectory, "contains an insecure HTTP URL");
    }

    for (const reference of collectCssReferences(css)) {
      if (reference.startsWith("data:")) {
        continue;
      }
      if (isExternalReference(reference)) {
        fail(
          errors,
          cssFile,
          rootDirectory,
          `runtime resource must be local: ${reference}`,
        );
        continue;
      }

      try {
        const { target } = await resolveLocalReference(
          rootDirectory,
          cssFile,
          reference,
        );
        if (!(await exists(target))) {
          fail(
            errors,
            cssFile,
            rootDirectory,
            `missing local target: ${reference}`,
          );
        } else if (!(await exactCaseExists(rootDirectory, target))) {
          fail(
            errors,
            cssFile,
            rootDirectory,
            `path case does not match the filesystem: ${reference}`,
          );
        }
      } catch (error) {
        fail(errors, cssFile, rootDirectory, error.message);
      }
    }
  }
}

export async function runStaticChecks(rootDirectory) {
  const errors = [];
  const htmlFiles = await collectFiles(rootDirectory, new Set([".html"]));
  const cssFiles = await collectFiles(rootDirectory, new Set([".css"]));

  const expectedLegacyPaths = [
    "Html5-Final-Project.html",
    "assignment-1 2/index.html",
    "assignment-1 2/history.html",
    "assignment-1 2/teams.html",
    "assignment-1 2/css/hw1.css",
    "assignment-1 2/css/Mutual evaluation.css",
    "assignment-1 2/css/hw1 - old.css",
    "assignment-1 2/css/hw1 - old2.css",
    "assignment-1 2/images/flywheel.jpg",
    "styles-conference/index.html",
    "styles-conference/speakers.html",
    "styles-conference/schedule.html",
    "styles-conference/venue.html",
    "styles-conference/register.html",
    "styles-conference/assets/stylesheets/main.css",
  ];

  for (const legacyPath of expectedLegacyPaths) {
    if (!(await exists(path.join(rootDirectory, legacyPath)))) {
      errors.push(`compatibility path is missing: ${legacyPath}`);
    }
  }

  const largestPage = await validateHtmlFiles(rootDirectory, htmlFiles, errors);
  await validateCssFiles(rootDirectory, cssFiles, errors);

  return {
    cssCount: cssFiles.length,
    errors,
    htmlCount: htmlFiles.length,
    largestPage,
  };
}
