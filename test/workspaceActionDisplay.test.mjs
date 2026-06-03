import assert from "node:assert/strict";
import test from "node:test";

import { buildWorkspaceActionDisplayText } from "../lib/workspaceActionDisplay.mjs";

test("scenario bank answer actions display the actual scenario question", () => {
  const displayText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "scenarioAnswer",
    scenario: {
      title: "Broken Cache Key After Refactor",
      prompt: "A Java service uses a custom CustomerKey as a HashMap key. What would you inspect?",
    },
  });

  assert.match(displayText, /Explain Answer: Broken Cache Key After Refactor/);
  assert.match(displayText, /HashMap key/);
  assert.doesNotMatch(displayText, /^Scenario Bank practice$/);
});

test("scenario bank mock actions display the selected scenario instead of a generic label", () => {
  const displayText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "scenarioMock",
    scenario: {
      title: "Thread Pool Saturation During Checkout",
      prompt: "Your Spring Boot checkout API times out during a flash sale.",
    },
  });

  assert.match(displayText, /Practice Mock: Thread Pool Saturation During Checkout/);
  assert.match(displayText, /checkout API/);
});

test("system design studio actions display the current design problem", () => {
  const displayText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "studio",
    canvasState: {
      problem: "Implement Ticket Booking System",
    },
  });

  assert.match(displayText, /System Design Studio: Implement Ticket Booking System/);
});

test("design lab practice displays the selected model system", () => {
  const displayText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "designLabPractice",
    system: {
      title: "Ticket Booking System",
      focus: "Seat inventory, holds, and payment workflow.",
    },
  });

  assert.match(displayText, /Design Lab Practice: Ticket Booking System/);
  assert.match(displayText, /Seat inventory/);
});
