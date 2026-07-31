import { expect, test } from "@playwright/test";

test("registration reports field errors without submitting", async ({
  page,
}) => {
  await page.goto("/styles-conference/register.html");
  await page.getByRole("button", { name: "Complete local demo" }).click();

  await expect(page.locator("#display-name")).toBeFocused();
  await expect(page.locator("#display-name-error")).toHaveText(
    "Complete this required field.",
  );
  await expect(page.locator("#form-status")).toHaveText(
    "Review the highlighted fields and try again.",
  );
});

test("registration completes locally and stores nothing", async ({
  context,
  page,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto("/styles-conference/register.html", {
    waitUntil: "networkidle",
  });
  requests.length = 0;

  await page.locator("#display-name").fill("Demo Learner");
  await page.locator("#sample-email").fill("learner@example.com");
  await page.locator("#pass-type").selectOption("studios");
  await page.locator("#access-notes").fill("Large-print schedule, please.");
  await page.locator("#demo-confirmation").check();
  await page.getByRole("button", { name: "Complete local demo" }).click();

  const status = page.locator("#form-status");
  await expect(status).toBeFocused();
  await expect(status).toHaveText(
    "Demo complete for Demo Learner: Studio sessions. Nothing was sent or saved.",
  );
  expect(requests).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("registration shows a specific email error", async ({ page }) => {
  await page.goto("/styles-conference/register.html");
  const email = page.locator("#sample-email");

  await email.fill("not-an-email");
  await email.blur();

  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#sample-email-error")).toHaveText(
    "Enter an email in the format name@example.com.",
  );
});
