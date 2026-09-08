import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const navUrl = new URL("../components/app/WorkspaceNav.js", import.meta.url);
const navSource = existsSync(navUrl) ? readFileSync(navUrl, "utf8") : "";
const commandPaletteSource = readFileSync(new URL("../components/app/CommandPalette.js", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const watermarkSource = readFileSync(new URL("../components/BrandWatermark.js", import.meta.url), "utf8");
const globalsSource = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");

test("workspace navigation chrome is extracted from the page shell", () => {
  assert.match(navSource, /DesktopWorkspaceNav/);
  assert.match(navSource, /TabletWorkspaceMenu/);
  assert.match(navSource, /WORKSPACE_MENU_DETAILS/);
  assert.match(navSource, /appearance = "dark"/);
  assert.match(navSource, /workspace-menu-surface/);
  assert.match(navSource, /workspace-menu-item-description/);
  assert.match(navSource, /MobileBottomNav/);
  assert.match(navSource, /workspaces\.map/);
  assert.match(navSource, /items\.map/);
  assert.match(navSource, /aria-current/);
  assert.match(navSource, /Workspace Menu/);
  assert.match(navSource, /Choose a focused prep room/);
  assert.match(navSource, /Offer-focused prep dashboard, company lanes, loops, stories, and weak-spot drills/);
  assert.match(navSource, /Most-asked questions with polished answers and follow-up drills/);
  assert.match(navSource, /Visual algorithms, beginner flow, and guided practice/);
  assert.match(navSource, /width: "min\(420px, calc\(100vw - 24px\)\)"/);
  assert.match(navSource, /left: 0/);
  assert.match(navSource, /maxHeight: "min\(72vh, 540px\)"/);
  assert.match(navSource, /overflowY: "auto"/);
  assert.match(navSource, /pointerEvents: "auto"/);
  assert.match(navSource, /zIndex: 120/);
  assert.match(navSource, /aria-haspopup/);
  assert.match(navSource, /compactLabel/);
  assert.match(navSource, /quickItems/);
  assert.match(indexSource, /CommandPalette/);
  assert.match(indexSource, /Command Palette/);
  assert.match(commandPaletteSource, /Ctrl\/Cmd \+ Shift \+ P/);
  assert.match(indexSource, /DesktopWorkspaceNav/);
  assert.match(indexSource, /TabletWorkspaceMenu/);
  assert.match(indexSource, /desktop-workspace-nav/);
  assert.match(indexSource, /tablet-workspace-menu/);
  assert.match(indexSource, /compact-controls-menu/);
  assert.match(indexSource, /position:"relative", zIndex:130/);
  assert.match(indexSource, /Prep controls/);
  assert.match(indexSource, /phone-bottom-nav/);
  assert.match(indexSource, /min-width: 761px\) and \(max-width: 1439px\)/);
  assert.match(indexSource, /MobileBottomNav/);
});

test("desktop workspace icons expose a visible hover tooltip", () => {
  const source = readFileSync(new URL("../components/app/WorkspaceNav.js", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");

  assert.match(source, /data-tooltip=\{workspace\.label\}/);
  assert.match(styles, /\.icon-btn\[data-tooltip\]::after/);
});

test("phone header actions wrap and the watermark stays visible", () => {
  assert.match(globalsSource, /@media \(max-width: 760px\) \{[\s\S]*?\.app-topbar \{[\s\S]*?flex-wrap: wrap !important/);
  assert.match(globalsSource, /\.app-topbar \.header-title \{[\s\S]*?flex: 1 1 calc\(100% - 116px\) !important/);
  assert.match(watermarkSource, /className="brand-watermark"/);
  assert.match(globalsSource, /\.brand-watermark \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(118px, 1fr\)\) !important[\s\S]*?opacity: 0\.13 !important/);
});
