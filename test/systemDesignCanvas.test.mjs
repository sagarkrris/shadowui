import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildCanvasMockPrompt,
  buildCanvasReviewPrompt,
  buildSystemDesignDiagramBoard,
  buildSystemDesignDiagramEvaluationPrompt,
  buildSystemDesignReferenceRoadmap,
  buildSystemDesignStudioBlueprint,
  buildSystemDesignStudioPrompt,
  buildSystemDesignMockPrompt,
  buildSystemDesignReviewPrompt,
  createSystemDesignCanvasState,
  exportSystemDesignCanvasMarkdown,
  SYSTEM_DESIGN_PRIMER_EXERCISES,
  SYSTEM_DESIGN_PRIMER_TOPIC_GROUPS,
  SYSTEM_DESIGN_REFERENCE_PLAYBOOK,
  SYSTEM_DESIGN_LEARNING_CATALOG,
  SYSTEM_DESIGN_PATTERN_LIBRARY,
  SYSTEM_DESIGN_CANVAS_SECTIONS,
} from "../lib/systemDesignCanvas.mjs";

test("creates a system design canvas state with stable editable sections", () => {
  const state = createSystemDesignCanvasState({
    problem: "  Design Instagram  ",
    sections: {
      requirements: "Feed, follows, likes",
      scaling: 42,
      unknown: "ignored",
    },
  });

  assert.equal(state.problem, "  Design Instagram  ");
  assert.deepEqual(Object.keys(state.sections), SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => section.key));
  assert.equal(state.sections.requirements, "Feed, follows, likes");
  assert.equal(state.sections.scaling, "42");
  assert.equal(state.sections.api, "");
  assert.equal(state.sections.unknown, undefined);
});

test("preserves editable spacing while users type in canvas text boxes", () => {
  const state = createSystemDesignCanvasState({
    problem: "Design ticket booking ",
    sections: {
      requirements: "Users can reserve seats ",
      api: "POST /reservations creates a hold",
    },
  });

  assert.equal(state.problem, "Design ticket booking ");
  assert.equal(state.sections.requirements, "Users can reserve seats ");
  assert.equal(state.sections.api, "POST /reservations creates a hold");
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

test("builds a System Design Studio blueprint with HLD and LLD for ticket booking", () => {
  const blueprint = buildSystemDesignStudioBlueprint("Implement Ticket Booking System");

  assert.equal(blueprint.problem, "Implement Ticket Booking System");
  assert.ok(blueprint.hld.requirements.some((item) => /booking/i.test(item)));
  assert.ok(blueprint.hld.services.some((service) => /inventory/i.test(service.name)));
  assert.ok(blueprint.hld.apis.some((api) => /reservations/i.test(api.path)));
  assert.ok(blueprint.lld.classes.some((item) => /Reservation/i.test(item.name)));
  assert.ok(blueprint.lld.patterns.some((item) => /Strategy|State|Observer/.test(item.pattern)));
  assert.ok(blueprint.interviewBreakdown.questions.some((question) => /race|concurrency|payment/i.test(question)));
});

test("builds an AI prompt that asks for both HLD and LLD from the studio blueprint", () => {
  const prompt = buildSystemDesignStudioPrompt("Implement Ticket Booking System");

  assert.match(prompt, /HLD/i);
  assert.match(prompt, /LLD/i);
  assert.match(prompt, /Ticket Booking System/);
  assert.match(prompt, /API/i);
  assert.match(prompt, /classes/i);
  assert.match(prompt, /trade-offs/i);
});

test("builds a diagram board and AI evaluation prompt for visual system design", () => {
  const board = buildSystemDesignDiagramBoard("Implement Ticket Booking System");
  const prompt = buildSystemDesignDiagramEvaluationPrompt({
    problem: "Implement Ticket Booking System",
    sections: { requirements: "Users reserve seats", architecture: "Gateway, inventory, reservations" },
  });

  assert.equal(board.title, "Ticket Booking System Diagram Board");
  assert.ok(board.lanes.some((lane) => lane.title === "Core Services"));
  assert.ok(board.edges.some((edge) => /Gateway|Queue/.test(edge)));
  assert.ok(board.evaluationRubric.some((item) => item.label === "Consistency"));
  assert.ok(board.whiteboardPrompts.some((item) => /source of truth/i.test(item)));
  assert.ok(board.referenceMoves.some((item) => item.source === "System Design Primer"));
  assert.ok(SYSTEM_DESIGN_REFERENCE_PLAYBOOK.some((item) => /build-your-own-x/.test(item.url)));
  assert.match(prompt, /Evaluate this system design diagram board/i);
  assert.match(prompt, /Reference-inspired checks/i);
  assert.match(prompt, /Tech Interview Handbook/i);
  assert.match(prompt, /Mermaid/i);
  assert.match(prompt, /missing boxes/i);
});

test("builds a primer-style roadmap with topic groups and sample design boards", () => {
  const roadmap = buildSystemDesignReferenceRoadmap("Design a social feed");

  assert.ok(SYSTEM_DESIGN_PRIMER_TOPIC_GROUPS.some((group) => group.title === "Scalability Foundations"));
  assert.ok(SYSTEM_DESIGN_PRIMER_TOPIC_GROUPS.some((group) => group.concepts.includes("Availability vs consistency")));
  assert.ok(SYSTEM_DESIGN_PRIMER_TOPIC_GROUPS.some((group) => group.concepts.includes("Cache-aside")));
  assert.ok(SYSTEM_DESIGN_PRIMER_EXERCISES.some((exercise) => /Pastebin|Bitly|URL/i.test(exercise.title)));
  assert.ok(SYSTEM_DESIGN_PRIMER_EXERCISES.some((exercise) => /Twitter|feed|search/i.test(exercise.title)));
  assert.ok(roadmap.topicGroups.length >= 5);
  assert.ok(roadmap.sampleBoards.some((board) => board.diagramFocus.some((item) => /cache|queue|sharding|crawler|feed/i.test(item))));
  assert.match(roadmap.practicePrompt, /clarify.*draw.*deep dive.*scale/i);
});

test("exposes a pattern library grouped by design intent with examples", () => {
  assert.ok(SYSTEM_DESIGN_PATTERN_LIBRARY.creational.some((pattern) => pattern.name === "Factory Method"));
  assert.ok(SYSTEM_DESIGN_PATTERN_LIBRARY.structural.some((pattern) => pattern.name === "Adapter"));
  assert.ok(SYSTEM_DESIGN_PATTERN_LIBRARY.behavioral.some((pattern) => pattern.name === "Strategy"));
  assert.ok(SYSTEM_DESIGN_PATTERN_LIBRARY.behavioral.every((pattern) => pattern.useCase && pattern.example));
});

test("exposes a system design learning catalog with separated HLD and LLD tracks", () => {
  assert.equal(SYSTEM_DESIGN_LEARNING_CATALOG.systemDesign.label, "System Design");
  assert.equal(SYSTEM_DESIGN_LEARNING_CATALOG.lowLevelDesign.label, "Low-Level Design");
  assert.ok(SYSTEM_DESIGN_LEARNING_CATALOG.systemDesign.coreConcepts.some((item) => /scale|capacity|latency/i.test(item)));
  assert.ok(SYSTEM_DESIGN_LEARNING_CATALOG.systemDesign.keyTechnologies.some((item) => /cache|queue|database/i.test(item)));
  assert.ok(SYSTEM_DESIGN_LEARNING_CATALOG.systemDesign.questionBreakdowns.some((item) => /clarify|estimate|trade/i.test(item)));
  assert.ok(SYSTEM_DESIGN_LEARNING_CATALOG.lowLevelDesign.commonPatterns.some((item) => /Strategy|State|Adapter/.test(item)));
  assert.ok(SYSTEM_DESIGN_LEARNING_CATALOG.lowLevelDesign.practiceTasks.some((item) => /class|interface|sequence/i.test(item)));
});

test("system design canvas component renders editable glass sections and action buttons", () => {
  const source = readFileSync(new URL("../components/system-design/SystemDesignCanvas.js", import.meta.url), "utf8");

  assert.match(source, /createSystemDesignCanvasState/);
  assert.match(source, /buildSystemDesignStudioBlueprint/);
  assert.match(source, /buildSystemDesignStudioPrompt/);
  assert.match(source, /buildSystemDesignDiagramBoard/);
  assert.match(source, /buildSystemDesignDiagramEvaluationPrompt/);
  assert.match(source, /SYSTEM_DESIGN_LEARNING_CATALOG/);
  assert.match(source, /SYSTEM_DESIGN_CANVAS_SECTIONS/);
  assert.match(source, /buildCanvasReviewPrompt/);
  assert.match(source, /buildCanvasMockPrompt/);
  assert.match(source, /onAction/);
  assert.match(source, /exportSystemDesignCanvasMarkdown/);
  assert.match(source, /textarea/);
  assert.match(source, /Review/);
  assert.match(source, /Mock/);
  assert.match(source, /Export/);
  assert.match(source, /Generate HLD \+ LLD/);
  assert.match(source, /Interactive Whiteboard/);
  assert.match(source, /Evaluate Diagram/);
  assert.match(source, /AI Evaluation Rubric/);
  assert.match(source, /Whiteboard Prompts/);
  assert.match(source, /Primer Topic Map/);
  assert.match(source, /Sample Design Boards/);
  assert.match(source, /Reference Moves/);
  assert.match(source, /Diagram/);
  assert.match(source, /HLD/);
  assert.match(source, /LLD/);
  assert.match(source, /Patterns/);
  assert.match(source, /Interview/);
  assert.match(source, /Guide/);
  assert.match(source, /Core Concepts/);
  assert.match(source, /Key Technologies/);
  assert.match(source, /Common Patterns/);
  assert.match(source, /Question Breakdowns/);
  assert.match(source, /overflowWrap/);
  assert.match(source, /wordBreak/);
  assert.match(source, /minWidth:\s*0/);
  assert.match(source, /gridTemplateColumns/);
  assert.match(source, /backdropFilter/);
});

test("system design canvas preserves its full height inside the workspace scroller", () => {
  const source = readFileSync(new URL("../components/system-design/SystemDesignCanvas.js", import.meta.url), "utf8");

  assert.match(source, /flexShrink:\s*0/);
});
