import { fileURLToPath } from "node:url";
import { runStaticChecks } from "./static-checker.mjs";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const result = await runStaticChecks(projectRoot);

if (result.errors.length > 0) {
  console.error("Static checks failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Static checks passed for ${result.htmlCount} HTML files and ${result.cssCount} CSS files.`,
  );
  console.log(
    `Largest initial page payload: ${result.largestPage.file} (${Math.ceil(result.largestPage.bytes / 1024)} KB).`,
  );
}
