import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInterviewPanelPrompt,
  buildPanelScoreRubric,
  INTERVIEW_PANELISTS,
  normalizeInterviewPanel,
} from "../lib/interviewPanel.mjs";

test("defines the expected deterministic interview panelists", () => {
  const labels = INTERVIEW_PANELISTS.map((panelist) => panelist.label);

  assert.deepEqual(labels, [
    "Recruiter",
    "Senior Engineer",
    "Engineering Manager",
    "System Design Architect",
    "Bar Raiser",
  ]);

  for (const panelist of INTERVIEW_PANELISTS) {
    assert.ok(panelist.key);
    assert.ok(panelist.icon);
    assert.ok(panelist.followUpStyle);
    assert.ok(panelist.scoringEmphasis);
    assert.ok(panelist.openingInstruction);
    assert.ok(panelist.rubricCategories.length >= 4);
  }
});

test("normalizes panel values and safely defaults to Senior Engineer", () => {
  assert.equal(normalizeInterviewPanel("recruiter").key, "recruiter");
  assert.equal(normalizeInterviewPanel("Senior Engineer").key, "seniorEngineer");
  assert.equal(normalizeInterviewPanel("system-design-architect").key, "systemDesignArchitect");
  assert.equal(normalizeInterviewPanel("bar raiser").key, "barRaiser");
  assert.equal(normalizeInterviewPanel(null).key, "seniorEngineer");
  assert.equal(normalizeInterviewPanel("unknown panel").key, "seniorEngineer");
});

test("builds panel prompts with follow-up style, scoring emphasis, profile, and round strategy", () => {
  const prompt = buildInterviewPanelPrompt({
    panel: "engineering-manager",
    profile: {
      name: "Sagar",
      position: "Engineering Lead",
      experience: "8 years",
      stack: "Java, Spring Boot, React",
    },
    roundStrategy: "final leadership round",
  });

  assert.match(prompt, /Engineering Manager/);
  assert.match(prompt, /Sagar/);
  assert.match(prompt, /Engineering Lead/);
  assert.match(prompt, /8 years/);
  assert.match(prompt, /Java, Spring Boot, React/);
  assert.match(prompt, /final leadership round/);
  assert.match(prompt, /Follow-up style:/);
  assert.match(prompt, /Scoring emphasis:/);
  assert.match(prompt, /Opening instruction:/);
  assert.match(prompt, /one question at a time/i);
});

test("returns scoring rubrics appropriate to each panel", () => {
  const recruiter = buildPanelScoreRubric("recruiter");
  const seniorEngineer = buildPanelScoreRubric("seniorEngineer");
  const engineeringManager = buildPanelScoreRubric("engineeringManager");
  const architect = buildPanelScoreRubric("systemDesignArchitect");
  const barRaiser = buildPanelScoreRubric("barRaiser");

  assert.equal(recruiter.panel.key, "recruiter");
  assert.ok(recruiter.categories.some((category) => /motivation/i.test(category.label)));
  assert.ok(seniorEngineer.categories.some((category) => /technical depth/i.test(category.label)));
  assert.ok(engineeringManager.categories.some((category) => /leadership/i.test(category.label)));
  assert.ok(architect.categories.some((category) => /architecture/i.test(category.label)));
  assert.ok(barRaiser.categories.some((category) => /bar/i.test(category.label)));

  for (const rubric of [recruiter, seniorEngineer, engineeringManager, architect, barRaiser]) {
    assert.ok(rubric.instructions.includes("Score each category from 1-5"));
    assert.ok(rubric.categories.every((category) => category.weight > 0));
  }
});
