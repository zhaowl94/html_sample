import { expect, test } from "@playwright/test";

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

async function getAccessibilityNodes(context, page) {
  const session = await context.newCDPSession(page);
  await session.send("Accessibility.enable");
  const { nodes } = await session.send("Accessibility.getFullAXTree");
  await session.detach();
  return nodes;
}

function hasRole(nodes, role) {
  return nodes.some((node) => node.role?.value === role);
}

function hasRoleAndName(nodes, role, name) {
  return nodes.some(
    (node) =>
      node.role?.value === role &&
      (typeof name === "string"
        ? node.name?.value === name
        : name.test(node.name?.value ?? "")),
  );
}

for (const pagePath of pages) {
  test(`${pagePath} reflows at the 200% zoom equivalent width`, async ({
    page,
  }) => {
    await page.setViewportSize({ height: 720, width: 640 });
    await page.goto(pagePath);

    const layout = await page.evaluate(() => {
      const root = document.documentElement;
      const textElements = [
        ...document.querySelectorAll(
          "h1, h2, h3, p, a, button, label, summary, dt, dd, th, td",
        ),
      ];
      const clippedText = textElements
        .filter((element) => {
          const style = getComputedStyle(element);
          const clipsX = ["clip", "hidden"].includes(style.overflowX);
          const clipsY = ["clip", "hidden"].includes(style.overflowY);
          return (
            (clipsX && element.scrollWidth > element.clientWidth + 1) ||
            (clipsY && element.scrollHeight > element.clientHeight + 1)
          );
        })
        .map((element) => element.textContent.trim().slice(0, 80));

      return {
        clientWidth: root.clientWidth,
        clippedText,
        scrollWidth: root.scrollWidth,
      };
    });

    expect(
      layout.scrollWidth,
      `${pagePath} creates document-level horizontal scrolling`,
    ).toBeLessThanOrEqual(layout.clientWidth + 1);
    expect(layout.clippedText).toEqual([]);
  });

  test(`${pagePath} remains operable in Windows forced colors`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto(pagePath);

    expect(
      await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    ).toBe(true);
    await expect(page.locator("h1")).toBeVisible();

    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    const focusStyle = await focused.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(focusStyle.outlineWidth).toBeGreaterThan(0);
  });
}

test("the team table exposes a labeled keyboard-scrollable region", async ({
  page,
}) => {
  await page.setViewportSize({ height: 720, width: 640 });
  await page.goto("/assignment-1%202/teams.html");

  const region = page.locator(".table-scroll");
  await expect(region).toHaveAttribute("tabindex", "0");
  await expect(region).toHaveAccessibleName(
    "Fictional ultimate team directory",
  );
  await region.focus();
  await expect(region).toBeFocused();
  expect(
    await region.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await expect(page.locator("caption")).toHaveText(
    "Fictional community teams and their weekly sessions",
  );
});

test("forced colors preserve textual form errors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/styles-conference/register.html");
  await page.getByRole("button", { name: "Complete local demo" }).click();

  const name = page.locator("#display-name");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#display-name-error")).toHaveText(
    "Complete this required field.",
  );
  await expect(page.locator("#form-status")).toHaveText(
    "Review the highlighted fields and try again.",
  );
});

test("light and dark system themes produce distinct page palettes", async ({
  page,
}) => {
  for (const pagePath of [
    "/index.html",
    "/assignment-1%202/index.html",
    "/styles-conference/index.html",
  ]) {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(pagePath);
    const lightBackground = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.reload();
    const darkBackground = await page
      .locator("body")
      .evaluate((element) => getComputedStyle(element).backgroundColor);

    expect(darkBackground, `${pagePath} has no dark-theme palette`).not.toBe(
      lightBackground,
    );
  }
});

test("Edge exposes useful landmark, heading, and page-title semantics", async ({
  context,
  page,
}) => {
  await page.goto("/styles-conference/index.html");
  const nodes = await getAccessibilityNodes(context, page);

  expect(hasRoleAndName(nodes, "RootWebArea", /Signal Conference/)).toBe(true);
  expect(hasRoleAndName(nodes, "heading", "Ideas for a more human web.")).toBe(
    true,
  );
  for (const role of ["banner", "navigation", "main", "contentinfo"]) {
    expect(hasRole(nodes, role), `Missing ${role} landmark`).toBe(true);
  }
});

test("Edge exposes the table caption and header relationships", async ({
  context,
  page,
}) => {
  await page.goto("/assignment-1%202/teams.html");
  const nodes = await getAccessibilityNodes(context, page);

  expect(
    hasRoleAndName(
      nodes,
      "table",
      "Fictional community teams and their weekly sessions",
    ),
  ).toBe(true);
  expect(
    nodes.filter((node) => node.role?.value === "columnheader"),
  ).toHaveLength(4);
  expect(nodes.filter((node) => node.role?.value === "rowheader")).toHaveLength(
    5,
  );
});

test("Edge exposes form labels, errors, state, and local completion text", async ({
  context,
  page,
}) => {
  await page.goto("/styles-conference/register.html");
  let nodes = await getAccessibilityNodes(context, page);

  expect(hasRoleAndName(nodes, "textbox", "Sample display name")).toBe(true);
  expect(hasRoleAndName(nodes, "textbox", "Sample email")).toBe(true);
  expect(hasRoleAndName(nodes, "combobox", "Demo pass")).toBe(true);
  expect(
    hasRoleAndName(
      nodes,
      "checkbox",
      "I understand this is a local demonstration, not a real booking.",
    ),
  ).toBe(true);

  await page.getByRole("button", { name: "Complete local demo" }).click();
  nodes = await getAccessibilityNodes(context, page);
  const invalidName = nodes.find(
    (node) =>
      node.role?.value === "textbox" &&
      node.name?.value === "Sample display name",
  );
  expect(
    invalidName?.properties?.some(
      (property) =>
        property.name === "invalid" && property.value?.value === "true",
    ),
  ).toBe(true);
  expect(
    nodes.some((node) => node.name?.value === "Complete this required field."),
  ).toBe(true);

  await page.locator("#display-name").fill("Demo Learner");
  await page.locator("#sample-email").fill("learner@example.com");
  await page.locator("#pass-type").selectOption("studios");
  await page.locator("#demo-confirmation").check();
  await page.getByRole("button", { name: "Complete local demo" }).click();
  nodes = await getAccessibilityNodes(context, page);

  expect(
    nodes.some((node) =>
      (node.name?.value ?? "").includes(
        "Demo complete for Demo Learner: Studio sessions.",
      ),
    ),
  ).toBe(true);
});
