import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeAnalyticsEvent, summarizeExplainLogEvents } from "../lib/analytics.mjs";
import { EXPLAIN_LOGS, explainLog } from "../lib/explainThisLog.mjs";

test("Explain This Log publishes four fictional artifacts with bounded interpretation", () => {
  assert.equal(EXPLAIN_LOGS.length, 4);
  assert.equal(new Set(EXPLAIN_LOGS.map((item) => item.slug)).size, EXPLAIN_LOGS.length);
  for (const item of EXPLAIN_LOGS) {
    assert.equal(explainLog(item.slug), item);
    assert.ok(item.artifact.length >= 4, `${item.slug} has line-by-line evidence`);
    assert.ok(item.proves && item.doesNotProve && item.next.length >= 3 && item.reference.url, `${item.slug} separates evidence from conclusion`);
  }
});

test("log reader is static, avoids uploads, and records only bounded lifecycle events", () => {
  const page = readFileSync(new URL("../pages/explain-log/[slug].js", import.meta.url), "utf8");
  const index = readFileSync(new URL("../pages/explain-log/index.js", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../pages/sitemap.xml.js", import.meta.url), "utf8");
  const rss = readFileSync(new URL("../pages/rss.xml.js", import.meta.url), "utf8");
  assert.match(page, /getStaticPaths/);
  assert.match(page, /What this proves/);
  assert.match(page, /What it doesn't prove/);
  assert.match(index, /does not accept, upload, or store production logs/);
  assert.match(sitemap, /EXPLAIN_LOGS/);
  assert.match(rss, /explainLogItems/);
  assert.deepEqual(normalizeAnalyticsEvent({ name: "explain_log_completed", path: "/explain-log/x", value: "x" }), { name: "explain_log_completed", path: "/explain-log/x", value: "x" });
  assert.deepEqual(summarizeExplainLogEvents([
    { name: "explain_log_started", value: "x", sessionId: "session_1" },
    { name: "explain_log_completed", value: "x", sessionId: "session_1" },
    { name: "explain_log_returned", value: "x", sessionId: "session_2" },
  ]), { artifactViews: 0, startedReadings: 1, completedReadings: 1, sameSessionCompletionRate: 1, laterDayReturns: 1 });
});
