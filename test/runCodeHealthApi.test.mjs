import assert from "node:assert/strict";
import test from "node:test";
import handler from "../pages/api/run-code/health.js";
function response() { return { statusCode: 200, headers: {}, body: null, setHeader(k,v) { this.headers[k]=v; }, status(v) { this.statusCode=v; return this; }, json(v) { this.body=v; return this; } }; }
test("health exposes the Java 8 through Java 21 matrix", async () => { const res=response(); await handler({method:"GET"},res); assert.equal(res.body.provider,"interviewiq-java-runner"); assert.equal(res.body.supportedJavaVersions[0],8); assert.equal(res.body.supportedJavaVersions.at(-1),21); });
