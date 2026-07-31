import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const outputDirectory = path.join(projectRoot, "_site");

if (
  path.dirname(outputDirectory) !== projectRoot ||
  path.basename(outputDirectory) !== "_site"
) {
  throw new Error(`Refusing to clean unexpected path: ${outputDirectory}`);
}

const publishEntries = [
  "index.html",
  "Html5-Final-Project.html",
  "assets",
  "assignment-1 2",
  "styles-conference",
  "robots.txt",
  "sitemap.xml",
];

await rm(outputDirectory, { force: true, recursive: true });
await mkdir(outputDirectory, { recursive: true });

for (const entry of publishEntries) {
  await cp(path.join(projectRoot, entry), path.join(outputDirectory, entry), {
    recursive: true,
  });
}

await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");

console.log(
  `Built ${publishEntries.length} publish entries in ${path.relative(projectRoot, outputDirectory)}.`,
);
