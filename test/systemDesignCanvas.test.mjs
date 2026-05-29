import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildCanvasMockPrompt,
  buildCanvasReviewPrompt,
  buildSystemDesignMockPrompt,
  buildSystemDesignReviewPrompt,
  createSystemDesignCanvasState,
  exportSystemDesignCanvasMarkdown,
  SYSTEM_DESIGN_CANVAS_SECTIONS,
} from "../lib/systemDesignCanvas.mjs";

test("creates a normalized system design canvas state with stable editable sections", () => {
  const state = createSystemDesignCanvasState({
    problem: "  Design Instagram  ",
    sections: {
      requirements: "Feed, follows, likes",
      scaling: 42,
      unknown: "ignored",
    },
  });

  assert.equal(state.problem, "Design Instagram");
  assert.deepEqual(Object.keys(state.sections), SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => section.key));
  assert.equal(state.sections.requirements, "Feed, follows, likes");
  assert.equal(state.sections.scaling, "42");
  assert.equal(state.sections.api, "");
  assert.equal(state.sections.unknown, undefined);
});

test("builds review and mock prompts from the normalized canvas", () => {
  const state = createSystemDesignCanvasState({
    problem: "Design a ride matching service",
    sections: {
      requirements: "Riders request nearby drivers",
      architecture: "API gateway, matching service, location stream",
      risks: "Hot cities and driver fraud",
    },
  });

  const reviewPrompt = buildSystemDesignReviewPrompt(state);
  const mockPrompt = buildSystemDesignMockPrompt(state);

  assert.match(reviewPrompt, /system design canvas/i);
  assert.match(reviewPrompt, /Design a ride matching service/);
  assert.match(reviewPrompt, /Riders request nearby drivers/);
  assert.match(reviewPrompt, /score/i);
  assert.match(mockPrompt, /mock interview/i);
  assert.match(mockPrompt, /one question at a time/i);
  assert.match(mockPrompt, /location stream/i);
});

test("exposes canvas prompt aliases for workspace integration", () => {
  const state = createSystemDesignCanvasState({
    problem: "Design search autocomplete",
    sections: { requirements: "Low-latency suggestions" },
  });

  assert.equal(buildCanvasReviewPrompt(state), buildSystemDesignReviewPrompt(state));
  assert.equal(buildCanvasMockPrompt(state), buildSystemDesignMockPrompt(state));
});

test("exports canvas state as interview-ready markdown", () => {
  const markdown = exportSystemDesignCanvasMarkdown({
    problem: "Design notifications",
    sections: {
      requirements: "Email, push, in-app",
      api: "POST /notifications",
    },
  });

  assert.match(markdown, /^# System Design Canvas: Design notifications/);
  assert.match(markdown, /## Requirements/);
  assert.match(markdown, /Email, push, in-app/);
  assert.match(markdown, /## API \/ Interfaces/);
  assert.match(markdown, /POST \/notifications/);
  assert.match(markdown, /_Not captured yet\._/);
});

test("system design canvas component renders editable glass sections and action buttons", () => {
  const source = readFileSync(new URL("../components/system-design/SystemDesignCanvas.js", import.meta.url), "utf8");

  assert.match(source, /createSystemDesignCanvasState/);
  assert.match(source, /SYSTEM_DESIGN_CANVAS_SECTIONS/);
  assert.match(source, /buildCanvasReviewPrompt/);
  assert.match(source, /buildCanvasMockPrompt/);
  assert.match(source, /onAction/);
  assert.match(source, /exportSystemDesignCanvasMarkdown/);
  assert.match(source, /textarea/);
  assert.match(source, /Review/);
  assert.match(source, /Mock/);
  assert.match(source, /Export/);
  assert.match(source, /gridTemplateColumns/);
  assert.match(source, /backdropFilter/);
});
