import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRolePack,
  getRolePack,
  listRolePacks,
} from "../lib/rolePacks.mjs";

test("lists the deterministic role pack catalog", () => {
  const packs = listRolePacks();

  assert.deepEqual(
    packs.map((pack) => pack.id),
    [
      "java-backend-sde-ii",
      "react-frontend-senior",
      "full-stack-lead",
      "python-backend",
      "sap-consultant",
      "rust-systems",
    ],
  );
  assert.ok(packs.every((pack) => pack.focusTopics.length >= 5));
  assert.ok(packs.every((pack) => pack.rounds.length >= 3));
  assert.ok(packs.every((pack) => pack.priorityDrills.length >= 4));
  assert.ok(packs.every((pack) => pack.scoringEmphasis.length >= 4));
  assert.ok(packs.every((pack) => pack.actionPrompts.length >= 3));
});

test("detects a Java Backend SDE II role pack from profile text", () => {
  const pack = buildRolePack({
    profile: {
      position: "SDE II Backend Engineer",
      stack: "Java, Spring Boot, Kafka, PostgreSQL",
    },
  });

  assert.equal(pack.id, "java-backend-sde-ii");
  assert.equal(pack.title, "Java Backend SDE II");
  assert.ok(pack.focusTopics.includes("Spring Boot REST APIs"));
  assert.ok(pack.rounds.some((round) => /system design/i.test(round.name)));
  assert.ok(pack.priorityDrills.some((drill) => /n\+1/i.test(drill)));
  assert.ok(pack.scoringEmphasis.some((item) => /production/i.test(item)));
  assert.ok(pack.actionPrompts.some((prompt) => /incident/i.test(prompt)));
});

test("supports explicit role pack selection for all curated roles", () => {
  const cases = [
    ["React Frontend Senior", "react-frontend-senior", /rendering performance/i],
    ["Full Stack Lead", "full-stack-lead", /architecture/i],
    ["Python Backend", "python-backend", /FastAPI|Django/i],
    ["SAP Consultant", "sap-consultant", /S\/4HANA/i],
    ["Rust Systems", "rust-systems", /ownership/i],
  ];

  for (const [role, id, topicPattern] of cases) {
    const pack = getRolePack({ role });

    assert.equal(pack.id, id);
    assert.ok(pack.focusTopics.some((topic) => topicPattern.test(topic)), role);
    assert.ok(pack.rounds.every((round) => round.name && round.signals.length >= 2), role);
    assert.ok(pack.priorityDrills.every(Boolean), role);
    assert.ok(pack.scoringEmphasis.every(Boolean), role);
    assert.ok(pack.actionPrompts.every(Boolean), role);
  }
});

test("returns cloned packs so callers cannot mutate the catalog", () => {
  const first = getRolePack({ role: "Rust Systems" });
  first.focusTopics.push("Mutated topic");
  first.rounds[0].signals.push("Mutated signal");

  const second = getRolePack({ role: "Rust Systems" });

  assert.equal(second.id, "rust-systems");
  assert.ok(!second.focusTopics.includes("Mutated topic"));
  assert.ok(!second.rounds[0].signals.includes("Mutated signal"));
});
