import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const files = [
  "index.html",
  "Html5-Final-Project.html",
  "assignment-1 2/index.html",
  "styles-conference/index.html",
  "styles-conference/register.html",
];

for (const file of files) {
  test(`${file} works when opened directly`, async ({ page }) => {
    const runtimeErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        runtimeErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    await page.goto(pathToFileURL(path.join(projectRoot, file)).href);

    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(() => getComputedStyle(document.body).display),
    ).not.toBe("");
    expect(runtimeErrors).toEqual([]);
  });
}
