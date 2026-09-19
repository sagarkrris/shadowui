import { requireConfiguredUser } from '../../../lib/apiAuth.mjs';
import { checkDistributedRateLimit } from '../../../lib/redisRateLimit.mjs';
import { getClientAddress } from '../../../lib/requestSecurity.mjs';
import { withApiObservability } from '../../../lib/apiObservability.mjs';
import { startBuddyAvatar, stopBuddyAvatar } from '../../../lib/techBuddyAvatarServer.mjs';
export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
export default withApiObservability('/api/tech-buddy/avatar', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: 'Sign in to use the live interviewer.' });
  if (!['start', 'stop'].includes(req.body?.action)) return res.status(400).json({ error: 'Invalid avatar action.' });
  const rate = await checkDistributedRateLimit(`buddy-avatar:${req.body.action}:${getClientAddress(req)}`, { limit: req.body.action === 'start' ? 3 : 30 });
  if (!rate.ok) return res.status(429).json({ error: 'Please wait before reconnecting the interviewer.' });
  try {
    if (req.body.action === 'stop') {
      const token = req.body.sessionToken;
      if (typeof token !== 'string' || token.length > 8000 || !/^[A-Za-z0-9_.-]+$/.test(token)) return res.status(400).json({ error: 'Invalid session.' });
      await stopBuddyAvatar(token);
      return res.status(200).json({ stopped: true });
    }
    let disconnected = false;
    res.on('close', () => { if (!res.writableEnded) disconnected = true; });
    const session = await startBuddyAvatar();
    if (disconnected && session) { await stopBuddyAvatar(session.sessionToken); return; }
    if (!session) return res.status(503).json({ error: 'Live interviewer is not configured yet. Continue with the portrait and voice.' });
    return res.status(200).json(session);
  } catch {
    return res.status(503).json({ error: 'Live interviewer connection failed. Continue with the portrait and voice.' });
  }
});
