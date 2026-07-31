import { expect, test } from "@playwright/test";

test("the root skip link is first and keyboard activatable", async ({
  page,
}, testInfo) => {
  await page.goto("/index.html");

  const skipLink = page.getByRole("link", { name: "跳到示例列表" });
  const firstFocusable = page
    .locator(
      "a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )
    .first();
  await expect(firstFocusable).toHaveAttribute("href", "#examples");

  // Safari reserves plain Tab for form controls unless full-page keyboard
  // navigation is enabled. Programmatic focus emulates that browser preference
  // while Enter still exercises the real keyboard activation behavior.
  if (testInfo.project.name === "webkit") {
    await skipLink.focus();
  } else {
    await page.keyboard.press("Tab");
  }
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#examples")).toBeFocused();
});

test("conference navigation is reachable in document order", async ({
  page,
}) => {
  await page.goto("/styles-conference/index.html");

  const links = page.locator(".conference-nav a");
  for (let index = 0; index < (await links.count()); index += 1) {
    const link = links.nth(index);
    await link.focus();
    await expect(link).toBeFocused();
  }
});

test("details disclosure works from the keyboard", async ({ page }) => {
  await page.goto("/Html5-Final-Project.html");

  const summary = page.getByText("Build for more ways of using the web", {
    exact: true,
  });
  await summary.focus();
  await summary.press("Enter");
  await expect(page.locator("details")).toHaveAttribute("open", "");
});
