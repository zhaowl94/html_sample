import assert from "node:assert/strict";
import test from "node:test";

await import("../../styles-conference/assets/scripts/register.js");

const { buildConfirmation, normalizeName, passLabels } =
  globalThis.RegistrationDemo;

test("normalizeName trims and collapses whitespace", () => {
  assert.equal(normalizeName("  Demo   Learner  "), "Demo Learner");
});

test("buildConfirmation uses a known pass label", () => {
  assert.equal(
    buildConfirmation("Demo Learner", "studios"),
    "Demo complete for Demo Learner: Studio sessions. Nothing was sent or saved.",
  );
});

test("buildConfirmation falls back for an unknown pass", () => {
  assert.match(buildConfirmation("Learner", "unknown"), /Demo pass/);
});

test("pass labels are immutable", () => {
  assert.equal(Object.isFrozen(passLabels), true);
});
