import { expect, test } from "@playwright/test";

const pages = [
  "/index.html",
  "/Html5-Final-Project.html",
  "/assignment-1%202/index.html",
  "/styles-conference/index.html",
  "/styles-conference/register.html",
];

for (const path of pages) {
  test(`${path} loads runtime resources only from the site`, async ({
    page,
  }) => {
    const outsideRequests = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.origin !== "http://127.0.0.1:4173") {
        outsideRequests.push(request.url());
      }
    });

    await page.goto(path);

    expect(outsideRequests).toEqual([]);
    await expect(
      page.locator('meta[http-equiv="Content-Security-Policy"]'),
    ).toHaveCount(1);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute(
      "content",
      "no-referrer",
    );
  });
}
