import assert from "node:assert/strict";
import test from "node:test";

import { isCompactViewport } from "../lib/viewportMode.mjs";

test("treats phone and tablet widths as compact workflow layouts", () => {
  assert.equal(isCompactViewport(390), true);
  assert.equal(isCompactViewport(820), true);
  assert.equal(isCompactViewport(1023), true);
});

test("keeps desktop workflow layout for wide screens", () => {
  assert.equal(isCompactViewport(1024), false);
  assert.equal(isCompactViewport(1440), false);
});

