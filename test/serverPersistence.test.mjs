import assert from "node:assert/strict";
import test from "node:test";
import { encryptState, decryptState, hashPassword, verifyPassword, hashPasswordAsync, verifyPasswordAsync } from "../lib/serverPersistence.mjs";
import { clearPrivateLocalData } from "../lib/localStoragePrivacy.mjs";

test("server state encryption round-trips without exposing plaintext", () => {
  process.env.APP_ENCRYPTION_KEY = "test-encryption-key";
  const state = { resumeText: "private resume", messages: [{ role: "user", content: "private answer" }] };
  const encrypted = encryptState(state);
  assert.equal(encrypted.ciphertext.includes("private"), false);
  assert.deepEqual(decryptState(encrypted), state);
});

test("private local data cleanup removes app-owned keys without touching unrelated storage", () => {
  const values = new Map([
    ["interviewiq.profile", "secret"],
    ["interviewprep.session.v1", "secret"],
    ["theme.preference", "keep"],
  ]);
  const storage = {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    removeItem(key) { values.delete(key); },
  };
  clearPrivateLocalData(storage);
  assert.deepEqual([...values.keys()], ["theme.preference"]);
});

test("password hashing verifies correct passwords only", () => {
  const record = hashPassword("a-secure-password");
  assert.equal(verifyPassword("a-secure-password", record), true);
  assert.equal(verifyPassword("wrong-password", record), false);
});

test("request-path password hashing has an asynchronous implementation", async () => {
  const record = await hashPasswordAsync("a-secure-password");
  assert.equal(await verifyPasswordAsync("a-secure-password", record), true);
  assert.equal(await verifyPasswordAsync("wrong-password", record), false);
});
