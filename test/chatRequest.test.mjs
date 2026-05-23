import assert from "node:assert/strict";
import test from "node:test";

import { normalizeChatMessages } from "../lib/chatRequest.mjs";

test("rejects missing or empty chat message arrays", () => {
  assert.equal(normalizeChatMessages(null), null);
  assert.equal(normalizeChatMessages([]), null);
  assert.equal(normalizeChatMessages([{ role: "user", content: "   " }]), null);
});

test("normalizes supported chat message roles and content", () => {
  assert.deepEqual(
    normalizeChatMessages([
      { role: "user", content: "  Hello " },
      { role: "assistant", content: " Hi " },
      { role: "other", content: " Next " },
    ]),
    [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
      { role: "user", content: "Next" },
    ],
  );
});
