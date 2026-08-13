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

test("design lab search displays the searched system name", () => {
  const displayText = buildWorkspaceActionDisplayText("Create a polished interview-ready system design answer.", {
    type: "designSystemSearch",
    query: "Food delivery marketplace",
  });

  assert.match(displayText, /Design Lab Search: Food delivery marketplace/);
  assert.match(displayText, /polished interview-ready/);
});

test("java digest actions display selected article and roadmap context", () => {
  const coachText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "javaDigestCoach",
    article: {
      title: "HashMap Internals Before an Interview",
      summary: "Review hashing, buckets, collisions, resizing, and equals/hashCode contracts.",
    },
  });
  const roadmapText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "javaDigestRoadmap",
    roadmap: {
      title: "14-Day Java Backend Interview Sprint",
      days: ["Core Java collections", "Spring Boot REST"],
    },
  });

  assert.match(coachText, /Java Digest Coach: HashMap Internals/);
  assert.match(coachText, /equals\/hashCode/);
  assert.match(roadmapText, /Java Digest Roadmap: 14-Day Java Backend Interview Sprint/);
  assert.match(roadmapText, /Core Java collections/);
});

test("senior refresher scoring displays the selected practice question", () => {
  const displayText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "javaSeniorRefresherScore",
    refresherQuestion: { question: "How do you make cancellation reliable?" },
  });

  assert.match(displayText, /Java Senior Refresher Score/);
  assert.match(displayText, /cancellation reliable/);
});

test("cses java practice displays the selected track context", () => {
  const displayText = buildWorkspaceActionDisplayText("full model prompt", {
    type: "csesJavaTrack",
    csesTrack: {
      title: "Shortest Paths",
      focus: "Graph Algorithms: Bellman-Ford, Dijkstra, Floyd-Warshall.",
    },
  });

  assert.match(displayText, /Handbook Java Study: Shortest Paths/);
  assert.match(displayText, /Dijkstra/);
});
