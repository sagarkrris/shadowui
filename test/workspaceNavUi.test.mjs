import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const navUrl = new URL("../components/app/WorkspaceNav.js", import.meta.url);
const navSource = existsSync(navUrl) ? readFileSync(navUrl, "utf8") : "";
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");

test("workspace navigation chrome is extracted from the page shell", () => {
  assert.match(navSource, /DesktopWorkspaceNav/);
  assert.match(navSource, /TabletWorkspaceMenu/);
  assert.match(navSource, /WORKSPACE_MENU_DETAILS/);
  assert.match(navSource, /MobileBottomNav/);
  assert.match(navSource, /workspaces\.map/);
  assert.match(navSource, /items\.map/);
  assert.match(navSource, /aria-current/);
  assert.match(navSource, /Workspace Menu/);
  assert.match(navSource, /Choose a focused prep room/);
  assert.match(navSource, /Visual algorithms, beginner flow, and guided practice/);
  assert.match(navSource, /width: "min\(420px, calc\(100vw - 24px\)\)"/);
  assert.match(navSource, /left: 0/);
  assert.match(navSource, /maxHeight: "min\(72vh, 540px\)"/);
  assert.match(navSource, /overflowY: "auto"/);
  assert.match(navSource, /aria-haspopup/);
  assert.match(navSource, /compactLabel/);
  assert.match(navSource, /quickItems/);
  assert.match(indexSource, /DesktopWorkspaceNav/);
  assert.match(indexSource, /TabletWorkspaceMenu/);
  assert.match(indexSource, /desktop-workspace-nav/);
  assert.match(indexSource, /tablet-workspace-menu/);
  assert.match(indexSource, /compact-controls-menu/);
  assert.match(indexSource, /Prep controls/);
  assert.match(indexSource, /phone-bottom-nav/);
  assert.match(indexSource, /min-width: 761px\) and \(max-width: 1439px\)/);
  assert.match(indexSource, /MobileBottomNav/);
});
