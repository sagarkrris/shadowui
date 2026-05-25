import assert from "node:assert/strict";
import test from "node:test";

import { isModalCloseKey } from "../lib/modalKeyboard.mjs";

test("detects Escape as the modal close key", () => {
  assert.equal(isModalCloseKey({ key: "Escape" }), true);
  assert.equal(isModalCloseKey({ key: "Enter" }), false);
});
