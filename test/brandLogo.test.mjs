import assert from "node:assert/strict";
import test from "node:test";

import {
  BRAND_LOGO_ARIA_LABEL,
  BRAND_LOGO_INITIALS,
} from "../lib/brandLogo.mjs";

test("defines an accessible InterviewIQ logo mark", () => {
  assert.equal(BRAND_LOGO_INITIALS, "IQ");
  assert.match(BRAND_LOGO_ARIA_LABEL, /InterviewIQ logo/i);
});
