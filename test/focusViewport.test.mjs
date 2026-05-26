import assert from "node:assert/strict";
import test from "node:test";

import { scrollFocusedControlIntoView } from "../lib/focusViewport.mjs";

test("schedules focused setup controls into the visible viewport", () => {
  let calls = 0;
  const element = {
    scrollIntoView(options) {
      calls += 1;
      assert.deepEqual(options, {
        block: "nearest",
        inline: "nearest",
        behavior: "auto",
      });
    },
  };

  const didSchedule = scrollFocusedControlIntoView(element, (callback) => callback());

  assert.equal(didSchedule, true);
  assert.equal(calls, 1);
});

test("can use a custom delay for iOS keyboard viewport settling", () => {
  let scheduledDelay = null;
  const element = {
    scrollIntoView() {},
  };

  scrollFocusedControlIntoView(element, (callback, delay) => {
    scheduledDelay = delay;
    callback();
  }, { delay: 140 });

  assert.equal(scheduledDelay, 140);
});

test("does nothing when a focused target cannot be scrolled", () => {
  const didSchedule = scrollFocusedControlIntoView({}, (callback) => callback());

  assert.equal(didSchedule, false);
});
