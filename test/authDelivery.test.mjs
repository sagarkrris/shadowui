import assert from "node:assert/strict";
import test from "node:test";

import { deliverAuthEmail } from "../lib/authDelivery.mjs";

test("delivers verification email through Resend with a usable verification link", async () => {
  let request;
  const result = await deliverAuthEmail({
    type: "verify-email",
    email: "candidate@example.com",
    token: "verification-token",
    env: {
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "InterviewIQ <no-reply@example.com>",
      APP_BASE_URL: "https://elevateprep.vercel.app",
    },
    fetchImpl: async (...args) => {
      request = args;
      return { ok: true };
    },
  });

  assert.deepEqual(result, { delivered: true, configured: true, provider: "resend" });
  assert.equal(request[0], "https://api.resend.com/emails");
  const body = JSON.parse(request[1].body);
  assert.equal(body.to[0], "candidate@example.com");
  assert.match(body.html, /action=verify/);
  assert.match(body.text, /verification-token/);
});
