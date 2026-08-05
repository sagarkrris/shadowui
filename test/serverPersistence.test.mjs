import assert from "node:assert/strict";
import test from "node:test";
import { encryptState, decryptState, hashPassword, verifyPassword } from "../lib/serverPersistence.mjs";

test("server state encryption round-trips without exposing plaintext", () => {
  process.env.APP_ENCRYPTION_KEY = "test-encryption-key";
  const state = { resumeText: "private resume", messages: [{ role: "user", content: "private answer" }] };
  const encrypted = encryptState(state);
  assert.equal(encrypted.ciphertext.includes("private"), false);
  assert.deepEqual(decryptState(encrypted), state);
});

test("password hashing verifies correct passwords only", () => {
  const record = hashPassword("a-secure-password");
  assert.equal(verifyPassword("a-secure-password", record), true);
  assert.equal(verifyPassword("wrong-password", record), false);
});
