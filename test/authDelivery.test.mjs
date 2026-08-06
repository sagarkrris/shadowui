import assert from "node:assert/strict";
import test from "node:test";

import { deliverAuthEmail } from "../lib/authDelivery.mjs";

test("delivers verification email through Resend with a usable verification link", async () => {
  let request;
  const result = await deliverAuthEmail({
    type: "verify-email",
    email: "candidate@example.com",
    firstName: "Sagar",
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
  assert.match(body.html, /Hello Sagar/);
  assert.match(body.text, /Hello Sagar/);
});

test("uses the public reset page for password reset links", async () => {
  let request;
  await deliverAuthEmail({
    type: "password-reset",
    email: "candidate@example.com",
    token: "reset-token",
    env: { RESEND_API_KEY: "re_test_key", APP_BASE_URL: "https://elevateprep.vercel.app" },
    fetchImpl: async (...args) => { request = args; return { ok: true }; },
  });
  const body = JSON.parse(request[1].body);
  assert.match(body.html, /reset-password\?token=reset-token/);
  assert.match(body.text, /reset-password\?token=reset-token/);
});

test("passes the first name to webhook email providers", async () => {
  let request;
  await deliverAuthEmail({
    type: "verify-email",
    email: "candidate@example.com",
    firstName: "Sagar",
    token: "verification-token",
    env: { EMAIL_WEBHOOK_URL: "https://mailer.example.test" },
    fetchImpl: async (...args) => { request = args; return { ok: true }; },
  });
  assert.equal(JSON.parse(request[1].body).firstName, "Sagar");
});

test("uses a safe generic greeting when first name is unavailable", async () => {
  let request;
  await deliverAuthEmail({
    type: "verify-email",
    email: "candidate@example.com",
    token: "verification-token",
    env: { RESEND_API_KEY: "re_test_key" },
    fetchImpl: async (...args) => { request = args; return { ok: true }; },
  });
  const body = JSON.parse(request[1].body);
  assert.match(body.text, /Hello there/);
  assert.doesNotMatch(body.text, /candidate@example.com/);
});

test("sends an account deletion confirmation without an action link", async () => {
  let request;
  await deliverAuthEmail({
    type: "account-deleted",
    email: "candidate@example.com",
    env: { RESEND_API_KEY: "re_test_key" },
    fetchImpl: async (...args) => { request = args; return { ok: true }; },
  });
  const body = JSON.parse(request[1].body);
  assert.equal(body.subject, "Your InterviewIQ account was deleted");
  assert.match(body.text, /permanently deleted/);
  assert.doesNotMatch(body.html, /href=/);
});

test("returns a safe provider status code when Resend rejects delivery", async () => {
  await assert.rejects(() => deliverAuthEmail({
    type: "verify-email",
    email: "candidate@example.com",
    token: "verification-token",
    env: { RESEND_API_KEY: "re_test_key" },
    fetchImpl: async () => ({ ok: false, status: 422 }),
  }), (error) => error.code === "RESEND_HTTP_422");
});
