import assert from "node:assert/strict";
import test from "node:test";

import { compactChatHistory, normalizeChatMessages } from "../lib/chatRequest.mjs";

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

test("compacts long history entries and retains the most recent context", () => {
  const history = compactChatHistory([
    { role: "user", content: "old context" },
    { role: "assistant", content: "x".repeat(12_500) },
    { role: "user", content: "latest question" },
  ]);

  assert.equal(history.length, 3);
  assert.equal(history.at(-1).content, "latest question");
  assert.ok(history[1].content.length <= 11_000);
  assert.match(history[1].content, /truncated for context/);
});

test("drops oldest history when the request context reaches its total limit", () => {
  const history = compactChatHistory([
    { role: "user", content: "a".repeat(10_000) },
    { role: "assistant", content: "b".repeat(10_000) },
    { role: "user", content: "latest question" },
  ], { maxMessageChars: 10_000, maxTotalChars: 15_000 });

  assert.equal(history.length, 2);
  assert.equal(history.at(-1).content, "latest question");
  assert.equal(history[0].content, "b".repeat(10_000));
  assert.ok(history.reduce((total, message) => total + message.content.length, 0) <= 15_000);
});
