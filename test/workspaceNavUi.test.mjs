import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const navUrl = new URL("../components/app/WorkspaceNav.js", import.meta.url);
const navSource = existsSync(navUrl) ? readFileSync(navUrl, "utf8") : "";
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");

test("workspace navigation chrome is extracted from the page shell", () => {
  assert.match(navSource, /DesktopWorkspaceNav/);
  assert.match(navSource, /MobileBottomNav/);
  assert.match(navSource, /workspaces\.map/);
  assert.match(navSource, /items\.map/);
  assert.match(indexSource, /DesktopWorkspaceNav/);
  assert.match(indexSource, /MobileBottomNav/);
});
