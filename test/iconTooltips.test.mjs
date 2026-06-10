import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { tablerIconClassToLabel } from "../lib/iconTooltips.mjs";

const appSource = readFileSync(new URL("../pages/_app.js", import.meta.url), "utf8");

test("converts Tabler icon classes into readable tooltip labels", () => {
  assert.equal(tablerIconClassToLabel("ti ti-home"), "Home");
  assert.equal(tablerIconClassToLabel("ti ti-player-play-filled"), "Player Play Filled");
  assert.equal(tablerIconClassToLabel("ti ti-api"), "API");
  assert.equal(tablerIconClassToLabel("ti ti-brand-openai"), "Brand OpenAI");
});

test("app shell installs icon tooltip observer globally", () => {
  assert.match(appSource, /installIconTooltips/);
  assert.match(appSource, /useEffect\(\(\) => installIconTooltips\(\), \[\]\)/);
});
