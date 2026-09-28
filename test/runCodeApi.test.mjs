import assert from "node:assert/strict";
import test from "node:test";
import handler from "../pages/api/run-code/index.js";
function response() { return { statusCode: 200, headers: {}, body: null, setHeader(k,v) { this.headers[k]=v; }, getHeader(k) { return this.headers[k]; }, status(v) { this.statusCode=v; return this; }, json(v) { this.body=v; return this; } }; }
test("run endpoint rejects non-Java before execution", async () => { const res=response(); await handler({ method:"POST", headers:{}, body:{ language:"python", code:"print(1)" } },res); assert.equal(res.statusCode,400); assert.match(res.body.error,/Only Java/); });
test("run endpoint reports an unconfigured private runner", async () => { const res=response(); await handler({ method:"POST", headers:{}, body:{ language:"java", javaVersion:21, code:"class Main {}" } },res); assert.equal(res.statusCode,503); assert.equal(res.body.runnerUnavailable,true); });
