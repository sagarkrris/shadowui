import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const source = readFileSync(new URL("../components/CodeRunner.js", import.meta.url), "utf8");
test("runner UI submits Java with a selected version", () => { assert.match(source,/JAVA_VERSIONS/); assert.match(source,/Java version/); assert.match(source,/fetch\("\/api\/run-code"/); assert.match(source,/javaVersion/); });
