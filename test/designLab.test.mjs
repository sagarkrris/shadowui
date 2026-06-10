import assert from "node:assert/strict";
import test from "node:test";

import {
  DESIGN_LAB_CATALOG,
  buildAgenticAiDesignPrompt,
  buildDesignLabPracticePrompt,
  buildDesignSystemSearchPrompt,
  buildReferencePlaybookPrompt,
  buildReferenceTopicImportPrompt,
  buildUmlClassDesignPrompt,
  getDesignLabPattern,
  listBuildYourOwnTracks,
  listAgenticAiDesignProblems,
  listDesignLabPracticeSystems,
  listInterviewHandbookCheckpoints,
  listReferencePlaybooks,
  listReferenceTopicCatalog,
  listUmlClassPracticeSystems,
  normalizeDesignSystemSearchQuery,
} from "../lib/designLab.mjs";

test("catalog separates design patterns HLD LLD and practice tracks", () => {
  assert.equal(DESIGN_LAB_CATALOG.patterns.label, "Design Patterns");
  assert.equal(DESIGN_LAB_CATALOG.hld.label, "HLD");
  assert.equal(DESIGN_LAB_CATALOG.lld.label, "LLD");
  assert.equal(DESIGN_LAB_CATALOG.practice.label, "Practice Studio");
  assert.equal(DESIGN_LAB_CATALOG.ood.label, "OOD / UML");
  assert.equal(DESIGN_LAB_CATALOG.agenticAi.label, "Agentic AI");
  assert.equal(DESIGN_LAB_CATALOG.references.label, "Reference Playbooks");
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

test("reference playbooks capture system design primer build-your-own-x and handbook drills", () => {
  const playbooks = listReferencePlaybooks();
  const prompt = buildReferencePlaybookPrompt("build-your-own-x");
  const buildTracks = listBuildYourOwnTracks();
  const handbook = listInterviewHandbookCheckpoints();
  const topics = listReferenceTopicCatalog();
  const topicPrompt = buildReferenceTopicImportPrompt();

  assert.ok(playbooks.some((item) => item.source === "donnemartin/system-design-primer"));
  assert.ok(playbooks.some((item) => item.source === "codecrafters-io/build-your-own-x"));
  assert.ok(playbooks.some((item) => item.source === "yangshun/tech-interview-handbook"));
  assert.ok(playbooks.every((item) => item.url.startsWith("https://github.com/")));
  assert.ok(buildTracks.some((track) => track.title === "Search Engine"));
  assert.ok(buildTracks.some((track) => track.title === "Docker-like Runtime"));
  assert.ok(buildTracks.some((track) => track.title === "Web Server"));
  assert.ok(handbook.some((checkpoint) => checkpoint.title === "Coding Interview Patterns"));
  assert.ok(handbook.some((checkpoint) => checkpoint.title === "Behavioral Story Bank"));
  assert.ok(handbook.some((checkpoint) => checkpoint.title === "Resume and Recruiter Screen"));
  assert.match(prompt, /Build Your Own X Lab/);
  assert.match(prompt, /build-from-scratch/i);
  assert.match(prompt, /Search Engine/);
  assert.match(prompt, /Web Server/);
  assert.match(prompt, /Behavioral Story Bank/);
  assert.match(prompt, /diagrammatic coaching session/i);
  assert.ok(topics.some((group) => group.source === "System Design Primer" && group.topics.includes("CAP theorem")));
  assert.ok(topics.some((group) => group.source === "System Design Primer" && group.topics.includes("Message queues")));
  assert.ok(topics.some((group) => group.source === "Build Your Own X" && group.topics.includes("3D Renderer")));
  assert.ok(topics.some((group) => group.source === "Build Your Own X" && group.topics.includes("Web Browser")));
  assert.ok(topics.some((group) => group.source === "Tech Interview Handbook" && group.topics.includes("Grind 75")));
  assert.ok(topics.some((group) => group.source === "Tech Interview Handbook" && group.topics.includes("Behavioral questions")));
  assert.match(topicPrompt, /Imported main topic catalog/i);
  assert.match(topicPrompt, /CAP theorem/);
  assert.match(topicPrompt, /Docker/);
  assert.match(topicPrompt, /Resume guide/);
});

test("OOD UML practice exposes class diagrams relationships and sequence prompts", () => {
  const [system] = listUmlClassPracticeSystems();
  const prompt = buildUmlClassDesignPrompt(system.id);

  assert.equal(system.title, "Reservation Domain UML");
  assert.ok(system.classes.some((item) => item.name === "Reservation"));
  assert.ok(system.relationships.some((item) => /StateMachine|PaymentGateway|Reservation/.test(item)));
  assert.ok(system.sequence.some((item) => /Controller|Gateway|StateMachine/i.test(item)));
  assert.match(prompt, /Object-Oriented Design and UML/i);
  assert.match(prompt, /Mermaid class diagram/i);
  assert.match(prompt, /SOLID/i);
});

test("Agentic AI design problems expose architecture guardrails and evaluation prompts", () => {
  const problems = listAgenticAiDesignProblems();
  const supportAgent = problems.find((problem) => problem.id === "enterprise-support-agent");
  const prompt = buildAgenticAiDesignPrompt("enterprise-support-agent");

  assert.ok(supportAgent);
  assert.ok(supportAgent.architecture.some((node) => /Planner|Retrieval|Risk|Audit|Reply/i.test(node)));
  assert.ok(supportAgent.guardrails.some((guardrail) => /approval|secrets|confidence/i.test(guardrail)));
  assert.ok(supportAgent.evaluation.some((dimension) => /Risk|Source|Resolution/i.test(dimension)));
  assert.match(prompt, /Agentic AI system design interview/i);
  assert.match(prompt, /guardrails/i);
  assert.match(prompt, /agent loop/i);
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

test("builds polished HLD LLD search prompts for custom systems", () => {
  assert.equal(normalizeDesignSystemSearchQuery("  URL   shortener  "), "URL shortener");
  assert.equal(normalizeDesignSystemSearchQuery("x".repeat(140)).length, 120);

  const prompt = buildDesignSystemSearchPrompt("Food delivery marketplace");

  assert.match(prompt, /Food delivery marketplace/);
  assert.match(prompt, /HLD \+ LLD/i);
  assert.match(prompt, /Architecture diagram/i);
  assert.match(prompt, /API contracts/i);
  assert.match(prompt, /Data model/i);
  assert.match(prompt, /Low-level design/i);
  assert.match(prompt, /90-second summary/i);
});
