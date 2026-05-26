import assert from "node:assert/strict";
import test from "node:test";

import { getAppShellHeight, isCompactViewport } from "../lib/viewportMode.mjs";

test("treats phone and tablet widths as compact workflow layouts", () => {
  assert.equal(isCompactViewport(390), true);
  assert.equal(isCompactViewport(820), true);
  assert.equal(isCompactViewport(1023), true);
});

test("keeps desktop workflow layout for wide screens", () => {
  assert.equal(isCompactViewport(1024), false);
  assert.equal(isCompactViewport(1440), false);
});

test("keeps iOS keyboard visual viewport changes from shrinking the app shell", async () => {
  const viewport = await import("../lib/viewportMode.mjs");

  assert.equal(typeof viewport.getStableViewportHeight, "function");
  assert.equal(
    viewport.getStableViewportHeight({
      innerHeight: 844,
      visualViewportHeight: 512,
    }),
    844,
  );
});

test("sizes compact app shell to the visible viewport to avoid stale iOS keyboard gaps", () => {
  assert.equal(
    getAppShellHeight({
      isCompact: true,
      keyboardOpen: false,
      hasVisualViewport: true,
    }),
    "calc(var(--vvh, var(--vh, 1vh)) * 100)",
  );
  assert.equal(
    getAppShellHeight({
      isCompact: true,
      keyboardOpen: true,
      hasVisualViewport: true,
    }),
    "calc(var(--vvh, var(--vh, 1vh)) * 100)",
  );
});

test("keeps desktop app shell on the stable layout viewport", () => {
  assert.equal(
    getAppShellHeight({
      isCompact: false,
      keyboardOpen: false,
      hasVisualViewport: true,
    }),
    "calc(var(--vh, 1vh) * 100)",
  );
});

test("uses the visible viewport while a compact text entry control has the keyboard open", async () => {
  const viewport = await import("../lib/viewportMode.mjs");

  assert.equal(
    viewport.getVisibleViewportHeight({
      innerHeight: 844,
      visualViewportHeight: 512,
    }),
    512,
  );
  assert.equal(
    viewport.isVirtualKeyboardOpen({
      viewportWidth: 390,
      innerHeight: 844,
      visualViewportHeight: 512,
      activeElementTagName: "TEXTAREA",
    }),
    true,
  );
});

test("does not treat ordinary compact resize changes as keyboard state", async () => {
  const viewport = await import("../lib/viewportMode.mjs");

  assert.equal(
    viewport.isVirtualKeyboardOpen({
      viewportWidth: 390,
      innerHeight: 844,
      visualViewportHeight: 780,
      activeElementTagName: "TEXTAREA",
    }),
    false,
  );
  assert.equal(
    viewport.isVirtualKeyboardOpen({
      viewportWidth: 390,
      innerHeight: 844,
      visualViewportHeight: 512,
      activeElementTagName: "BUTTON",
    }),
    false,
  );
  assert.equal(
    viewport.isVirtualKeyboardOpen({
      viewportWidth: 1200,
      innerHeight: 844,
      visualViewportHeight: 512,
      activeElementTagName: "TEXTAREA",
    }),
    false,
  );
});
