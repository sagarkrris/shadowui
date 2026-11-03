import { runSqlLab } from '../../lib/sqlLabRunner.mjs';
import { checkDistributedRateLimit } from '../../lib/redisRateLimit.mjs';
import { getClientAddress } from '../../lib/requestSecurity.mjs';
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }
  if (!String(req.headers['content-type'] || '').startsWith('application/json') || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Use a same-site JSON request.' });
  const rate = await checkDistributedRateLimit(`sql-lab:${getClientAddress(req)}`, {limit: 20});
  if (!rate.ok) { res.setHeader('Retry-After', String(rate.retryAfter)); return res.status(429).json({error:'Too many queries. Please wait before retrying.'}); }
  try { return res.status(200).json(await runSqlLab(req.body || {})); }
  catch (error) { return res.status(400).json({ error: error.message.startsWith('No such built-in') ? 'SQL execution requires Node 24 or newer.' : error.message.slice(0, 300) }); }
}
