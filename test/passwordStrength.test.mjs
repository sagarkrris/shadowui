import assert from "node:assert/strict";
import test from "node:test";

import { getPasswordStrength } from "../lib/passwordStrength.mjs";

test("password strength distinguishes weak, fair, and strong passwords", () => {
  assert.equal(getPasswordStrength("short").label, "Weak");
  assert.equal(getPasswordStrength("longerpassword1").label, "Fair");
  assert.equal(getPasswordStrength("LongerPassword42!").label, "Strong");
});
