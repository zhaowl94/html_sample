import { expect, test } from "@playwright/test";

const pages = [
  { heading: /从语义开始/, path: "/index.html", title: /HTML Sample/ },
  {
    heading: /Learning the web/,
    path: "/Html5-Final-Project.html",
    title: /Learning Profile/,
  },
  {
    heading: /Ultimate\s+Field Notes/i,
    path: "/assignment-1%202/index.html",
    title: /Ultimate Field Notes/,
  },
  {
    heading: /Ultimate\s+Field Notes/i,
    path: "/assignment-1%202/teams.html",
    title: /Teams/,
  },
  {
    heading: /Ultimate\s+Field Notes/i,
    path: "/assignment-1%202/history.html",
    title: /History/,
  },
  {
    heading: /Ideas for a more human web/,
    path: "/styles-conference/index.html",
    title: /Signal Conference/,
  },
  {
    heading: /Practitioners who turn principles/,
    path: "/styles-conference/speakers.html",
    title: /Speakers/,
  },
  {
    heading: /Time to listen/,
    path: "/styles-conference/schedule.html",
    title: /Schedule/,
  },
  {
    heading: /A quiet harbor/,
    path: "/styles-conference/venue.html",
    title: /Venue/,
  },
  {
    heading: /Practice a respectful form flow/,
    path: "/styles-conference/register.html",
    title: /Register/,
  },
];

for (const pageDefinition of pages) {
  test(`${pageDefinition.path} loads without runtime errors`, async ({
    page,
  }) => {
    const runtimeErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        runtimeErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));

    const response = await page.goto(pageDefinition.path);

    expect(response?.ok()).toBe(true);
    await expect(page).toHaveTitle(pageDefinition.title);
    await expect(
      page.getByRole("heading", { level: 1, name: pageDefinition.heading }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1,
      ),
    ).toBe(true);
    expect(runtimeErrors).toEqual([]);
  });
}

test("conference navigation exposes the current page", async ({ page }) => {
  await page.goto("/styles-conference/schedule.html");

  const current = page.locator(".conference-nav [aria-current='page']");
  await expect(current).toHaveText("Schedule");
  await expect(current).toHaveAttribute("href", "schedule.html");
});

test("ultimate navigation exposes the current page", async ({ page }) => {
  await page.goto("/assignment-1%202/teams.html");

  const current = page.locator(".sport-nav [aria-current='page']");
  await expect(current).toHaveText("Teams");
  await expect(current).toHaveAttribute("href", "teams.html");
});
