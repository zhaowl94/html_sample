import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Axe can exceed the default timeout during a cold Firefox start on Windows CI.
test.describe.configure({ timeout: 60_000 });

const pages = [
  "/index.html",
  "/Html5-Final-Project.html",
  "/assignment-1%202/index.html",
  "/assignment-1%202/teams.html",
  "/assignment-1%202/history.html",
  "/styles-conference/index.html",
  "/styles-conference/speakers.html",
  "/styles-conference/schedule.html",
  "/styles-conference/venue.html",
  "/styles-conference/register.html",
];

for (const path of pages) {
  test(`${path} has no automated accessibility violations`, async ({
    page,
  }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
