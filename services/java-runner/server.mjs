import { createServer } from 'node:http';
import { executeJava, workspaceConfiguration } from './executor.mjs';

const port = Number(process.env.PORT || 8080);
const token = String(process.env.JAVA_RUNNER_SHARED_TOKEN || '').trim();
const workspace = workspaceConfiguration();
if (token.length < 32) throw new Error('JAVA_RUNNER_SHARED_TOKEN must contain at least 32 characters.');
let active = 0;
let healthy = true;
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  const chunks = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 131072) throw new Error('Invalid request size');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Invalid JSON'); }
}
const server = createServer(async (req, res) => {
  if (req.headers['x-java-runner-token'] !== token) return send(res, 401, { error: 'Unauthorized' });
  if (req.method === 'GET' && req.url === '/health') return send(res, healthy ? 200 : 503, { ready: healthy, active, versions: Array.from({ length: 14 }, (_, i) => i + 8) });
  if (req.method !== 'POST' || req.url !== '/v1/run') return send(res, 404, { error: 'Not found' });
  if (!healthy) return send(res, 503, { error: 'Runner requires operator cleanup.' });
  if (active >= 2) return send(res, 429, { error: 'Runner capacity reached.' });
  active++;
  try { return send(res, 200, await executeJava(await readBody(req), { workspace })); }
  catch (error) {
    if (error.code === 'CONTAINER_CLEANUP_FAILED') healthy = false;
    console.error(JSON.stringify({ event: 'java_runner.failed', cleanupFailed: !healthy }));
    return send(res, error.message.startsWith('Invalid') ? 400 : 503, { error: 'Runner could not execute the request.' });
  } finally { active--; }
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, () => console.log(JSON.stringify({ event: 'java_runner.started', port })));
