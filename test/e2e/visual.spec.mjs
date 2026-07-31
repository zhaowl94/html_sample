import { expect, test } from "@playwright/test";

test("root gallery light theme", async ({ page }) => {
  await page.goto("/index.html");
  await expect(page).toHaveScreenshot("gallery-light.png", {
    fullPage: true,
  });
});

test("root gallery dark theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/index.html");
  await expect(page).toHaveScreenshot("gallery-dark.png", {
    fullPage: true,
  });
});

test("ultimate home desktop", async ({ page }) => {
  await page.goto("/assignment-1%202/index.html");
  await expect(page).toHaveScreenshot("ultimate-home.png", {
    fullPage: true,
  });
});

test("conference home desktop", async ({ page }) => {
  await page.goto("/styles-conference/index.html");
  await expect(page).toHaveScreenshot("conference-home.png", {
    fullPage: true,
  });
});

test("registration mobile layout", async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 390 });
  await page.goto("/styles-conference/register.html");
  await expect(page).toHaveScreenshot("registration-mobile.png", {
    fullPage: true,
  });
});
