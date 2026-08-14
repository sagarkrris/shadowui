import assert from "node:assert/strict";
import test from "node:test";
import { INCIDENT_SIMULATION, getIncidentStage } from "../lib/incidentSimulator.mjs";

test("incident simulator exposes staged artifacts and operational decisions", () => {
  assert.equal(INCIDENT_SIMULATION.stages.length, 3);
  assert.match(getIncidentStage(1).trace, /payment/i);
  assert.equal(getIncidentStage(99).time, "09:15");
  assert.ok(INCIDENT_SIMULATION.decisions.some((item) => /Rollback/.test(item.question)));
});
