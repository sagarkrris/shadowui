import { runnerConfiguration, validateChallengeRun, executeChallenge } from '../../lib/challengeRunner.mjs';
import { requireConfiguredUser } from '../../lib/apiAuth.mjs';
import { checkDistributedRateLimit } from '../../lib/redisRateLimit.mjs';
import { getClientAddress } from '../../lib/requestSecurity.mjs';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'GET') return res.status(200).json({ configured: Boolean(runnerConfiguration()) });
  if (req.method !== 'POST') { res.setHeader('Allow','GET, POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!String(req.headers['content-type'] || '').startsWith('application/json') || req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Use a same-site JSON request.' });
  const auth = await requireConfiguredUser(req);
  if(auth.required && !auth.user) return res.status(401).json({ error: 'Sign in to run isolated checks. Local downloads remain available.' });
  const rate = await checkDistributedRateLimit(`build-run:${auth.user?.id || getClientAddress(req)}`, { limit: 6 });
  if(!rate.ok) { res.setHeader('Retry-After', String(rate.retryAfter)); return res.status(429).json({ error: 'Too many submissions. Please wait before retrying.' }); }
  const input = validateChallengeRun(req.body);
  if(input.error) return res.status(400).json({ error: input.error });
  const { statusCode, ...result } = await executeChallenge(input);
  return res.status(statusCode).json(result);
}
