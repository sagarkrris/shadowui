import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("../components/mock-collab/CollaborativeMockRoom.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../lib/workspaces.mjs", import.meta.url), "utf8");

test("collaborative mock room is wired into the app shell and calls the room APIs", () => {
  assert.match(componentSource, /Collaborative Mock/);
  assert.match(componentSource, /Create room/);
  assert.match(componentSource, /Join room/);
  assert.match(componentSource, /Score answer/);
  assert.match(componentSource, /\/api\/mock-sessions/);
  assert.match(componentSource, /\/summary/);
  assert.match(indexSource, /CollaborativeMockRoom/);
  assert.match(indexSource, /activeTab==="collabMock"/);
  assert.match(workspaceSource, /Collaborative Mock/);
});
