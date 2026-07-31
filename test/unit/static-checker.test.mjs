import assert from "node:assert/strict";
import test from "node:test";
import {
  getAttribute,
  isExternalReference,
  splitReference,
} from "../scripts/static-checker.mjs";

test("splitReference separates paths, queries, and fragments", () => {
  assert.deepEqual(splitReference("page.html?view=full#details"), {
    fragment: "details",
    pathname: "page.html",
  });
});

test("external reference detection covers web and mail links", () => {
  assert.equal(isExternalReference("https://example.com"), true);
  assert.equal(isExternalReference("mailto:demo@example.com"), true);
  assert.equal(isExternalReference("../index.html"), false);
});

test("getAttribute reads single and double quoted values", () => {
  assert.equal(
    getAttribute(' href="index.html" class="home"', "href"),
    "index.html",
  );
  assert.equal(getAttribute(" src='app.js' defer", "src"), "app.js");
});
