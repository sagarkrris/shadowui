import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  INTERVIEW_MISSION_CONTROL_STORAGE_KEY,
  buildInterviewMissionControl,
  createMissionControlState,
  recordMissionCompletion,
} from "../lib/interviewMissionControl.mjs";

test("builds three interview missions across java database and system design", () => {
  const missionControl = buildInterviewMissionControl({
    profile: {
      name: "Sagar",
      targetRole: "Java Backend Engineer",
      stack: "Java, Spring Boot, PostgreSQL, Redis",
    },
    weakSpots: ["concurrency", "indexes"],
    systemDesignCanvas: {
      problem: "Design ticket booking",
      sections: {
        requirements: "Seat hold and payment flow",
      },
    },
  });

  assert.equal(missionControl.title, "Interview Mission Control");
  assert.equal(missionControl.missions.length, 3);
  assert.deepEqual(missionControl.missions.map((mission) => mission.lane), ["java", "database", "systemDesign"]);
  assert.equal(missionControl.missions[0].workspaceId, "scenarioBank");
  assert.equal(missionControl.missions[1].workspaceId, "scenarioBank");
  assert.equal(missionControl.missions[2].workspaceId, "canvas");
  assert.match(missionControl.missions[0].prompt, /mock interview/i);
  assert.match(missionControl.missions[1].title, /PostgreSQL|Redis/);
  assert.match(missionControl.missions[2].prompt, /system design canvas/i);
});

test("mission control chooses database engine from the user stack", () => {
  const missionControl = buildInterviewMissionControl({
    profile: {
      targetRole: "Backend Engineer",
      stack: "Java, MongoDB",
    },
  });

  const databaseMission = missionControl.missions.find((mission) => mission.lane === "database");

  assert.ok(databaseMission);
  assert.match(databaseMission.title, /MongoDB/);
  assert.match(databaseMission.prompt, /MongoDB/i);
});

test("mission completion state records completed mission ids by day", () => {
  const initial = createMissionControlState({
    completedByDay: {
      "2026-06-02": ["old-mission"],
    },
  });

  const next = recordMissionCompletion(initial, "java:java-thread-pool-saturation", {
    today: "2026-06-03",
  });
  const duplicate = recordMissionCompletion(next, "java:java-thread-pool-saturation", {
    today: "2026-06-03",
  });

  assert.equal(INTERVIEW_MISSION_CONTROL_STORAGE_KEY, "interviewiq:mission-control:v1");
  assert.deepEqual(duplicate.completedByDay["2026-06-02"], ["old-mission"]);
  assert.deepEqual(duplicate.completedByDay["2026-06-03"], ["java:java-thread-pool-saturation"]);
});

test("mission control marks today's completed missions", () => {
  const missionControl = buildInterviewMissionControl({
    profile: { stack: "Java, MySQL" },
    missionState: {
      completedByDay: {
        "2026-06-03": ["database:mysql-deadlock-inconsistent-update-order"],
      },
    },
    today: "2026-06-03",
  });

  const databaseMission = missionControl.missions.find((mission) => mission.lane === "database");

  assert.equal(databaseMission.completed, true);
  assert.equal(missionControl.summary.completedToday, 1);
});

test("prep home renders Interview Mission Control and wires workspace navigation", () => {
  const welcomeSource = readFileSync(new URL("../components/welcome/Welcome.js", import.meta.url), "utf8");
  const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");

  assert.match(welcomeSource, /InterviewMissionControl/);
  assert.match(welcomeSource, /onOpenWorkspace/);
  assert.match(indexSource, /onOpenWorkspace/);
  assert.match(indexSource, /normalizeWorkspaceTab\(workspaceId\)/);
});
