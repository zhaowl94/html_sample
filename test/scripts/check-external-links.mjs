import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  collectFiles,
  extractTags,
  getAttribute,
  isExternalReference,
} from "./static-checker.mjs";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const htmlFiles = await collectFiles(projectRoot, new Set([".html"]));
const links = new Set();

for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  for (const { attributes, tag } of extractTags(html)) {
    const reference = tag === "a" ? getAttribute(attributes, "href") : null;
    if (
      reference &&
      isExternalReference(reference) &&
      reference.startsWith("https:")
    ) {
      links.add(reference);
    }
  }
}

let warnings = 0;
for (const link of [...links].sort()) {
  try {
    const response = await fetch(link, {
      headers: { "user-agent": "html-sample-link-check/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      console.log(`OK   ${response.status} ${link}`);
    } else {
      warnings += 1;
      console.warn(`WARN ${response.status} ${link}`);
    }
  } catch (error) {
    warnings += 1;
    console.warn(`WARN network error ${link}: ${error.message}`);
  }
}

console.log(
  `Checked ${links.size} external links with ${warnings} non-blocking warning(s).`,
);
