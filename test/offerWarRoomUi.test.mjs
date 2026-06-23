import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("../components/offer-war-room/OfferWarRoom.js", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../lib/workspaces.mjs", import.meta.url), "utf8");
const navSource = readFileSync(new URL("../components/app/WorkspaceNav.js", import.meta.url), "utf8");

test("offer war room workspace renders serious offer-focused prep sections", () => {
  assert.match(componentSource, /Offer War Room/);
  assert.match(componentSource, /Company War Lanes/);
  assert.match(componentSource, /Mock Interview Loops/);
  assert.match(componentSource, /interview day simulator/i);
  assert.match(componentSource, /Run full day/);
  assert.match(componentSource, /Final day report/);
  assert.match(componentSource, /Run round live/);
  assert.match(componentSource, /Story Vault/);
  assert.match(componentSource, /Weak-Spot Revenge Mode/);
  assert.match(componentSource, /Speech-First Rehearsal/);
  assert.match(componentSource, /Final-Day Mode/);
  assert.match(componentSource, /Mission Control/);
  assert.match(componentSource, /Speech score/);
  assert.match(componentSource, /Target companies/);
  assert.match(componentSource, /Run this round/);
  assert.match(componentSource, /Pressure test/);
});

test("offer war room is wired as a first-class workspace", () => {
  assert.match(pageSource, /OfferWarRoom/);
  assert.match(pageSource, /activeTab==="offerWarRoom"/);
  assert.match(pageSource, /startOfferWarRoomAction/);
  assert.match(workspaceSource, /id: "offerWarRoom"/);
  assert.match(workspaceSource, /label: "Offer War Room"/);
  assert.match(navSource, /Offer-focused prep dashboard, company lanes, loops, stories, and weak-spot drills/);
});
