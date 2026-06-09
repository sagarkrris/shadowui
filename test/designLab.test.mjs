import assert from "node:assert/strict";
import test from "node:test";

import {
  DESIGN_LAB_CATALOG,
  buildDesignLabPracticePrompt,
  getDesignLabPattern,
  listDesignLabPracticeSystems,
} from "../lib/designLab.mjs";

test("catalog separates design patterns HLD LLD and practice tracks", () => {
  assert.equal(DESIGN_LAB_CATALOG.patterns.label, "Design Patterns");
  assert.equal(DESIGN_LAB_CATALOG.hld.label, "HLD");
  assert.equal(DESIGN_LAB_CATALOG.lld.label, "LLD");
  assert.equal(DESIGN_LAB_CATALOG.practice.label, "Practice Studio");
  assert.ok(DESIGN_LAB_CATALOG.patterns.groups.creational.length > 0);
  assert.ok(DESIGN_LAB_CATALOG.patterns.groups.structural.length > 0);
  assert.ok(DESIGN_LAB_CATALOG.patterns.groups.behavioral.length > 0);
  assert.ok(DESIGN_LAB_CATALOG.hld.questionBreakdowns.some((item) => /clarify|estimate|trade/i.test(item)));
  assert.ok(DESIGN_LAB_CATALOG.lld.practiceTasks.some((item) => /class|interface|sequence/i.test(item)));
  assert.equal(DESIGN_LAB_CATALOG.hld.workflowDiagram.title, "High-Level Request Workflow");
  assert.equal(DESIGN_LAB_CATALOG.lld.workflowDiagram.title, "Low-Level Collaboration Workflow");
  assert.ok(DESIGN_LAB_CATALOG.hld.workflowDiagram.stages.some((stage) => stage.title === "Core Services"));
  assert.ok(DESIGN_LAB_CATALOG.lld.workflowDiagram.stages.some((stage) => stage.title === "Domain Layer"));
});

test("patterns expose intent Java examples Spring Boot examples and interview traps", () => {
  const strategy = getDesignLabPattern("strategy");

  assert.equal(strategy.name, "Strategy");
  assert.match(strategy.intent, /algorithm|policy|runtime/i);
  assert.match(strategy.javaExample, /interface/);
  assert.match(strategy.springBootExample, /@Service|@Component/);
  assert.ok(strategy.interviewTraps.some((trap) => /overuse|if|switch|simple/i.test(trap)));
  assert.ok(strategy.practicePrompt.includes("Strategy"));
});

test("practice systems build interview-ready HLD and LLD prompts", () => {
  const systems = listDesignLabPracticeSystems();
  const ticketBooking = systems.find((system) => system.id === "ticket-booking");
  const prompt = buildDesignLabPracticePrompt("ticket-booking");

  assert.ok(ticketBooking);
  assert.equal(ticketBooking.title, "Ticket Booking System");
  assert.match(prompt, /HLD/);
  assert.match(prompt, /LLD/);
  assert.match(prompt, /Ticket Booking System/);
  assert.match(prompt, /patterns/i);
  assert.match(prompt, /follow-up/i);
});

test("practice prompt falls back to the first system for unknown ids", () => {
  const [first] = listDesignLabPracticeSystems();
  const prompt = buildDesignLabPracticePrompt("unknown-system");

  assert.match(prompt, new RegExp(first.title));
});
