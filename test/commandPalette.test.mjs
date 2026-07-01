import assert from "node:assert/strict";
import test from "node:test";

import { buildCommandPaletteActions, filterCommandPaletteActions } from "../lib/commandPalette.mjs";

test("command palette exposes workspace, voice, retry, export, and import actions", () => {
  const actions = buildCommandPaletteActions({
    workspaces: [{ id: "javaDigest", label: "Java Digest" }],
    hasCandidateProfile: true,
    canRetryLastAi: true,
  });

  assert.ok(actions.some((action) => action.id === "voice"));
  assert.ok(actions.some((action) => action.id === "retry-ai"));
  assert.ok(actions.some((action) => action.id === "export-session"));
  assert.ok(actions.some((action) => action.id === "import-session"));
  assert.ok(actions.some((action) => action.workspaceId === "javaDigest"));
});

test("command palette filters actions by query text", () => {
  const filtered = filterCommandPaletteActions([
    { id: "voice", label: "Toggle Voice Live Mode", keywords: "voice microphone" },
    { id: "export", label: "Export Session", keywords: "backup session" },
  ], "voice");

  assert.deepEqual(filtered.map((action) => action.id), ["voice"]);
});
