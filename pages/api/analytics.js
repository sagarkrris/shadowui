import { logOperationalFailure } from "../../lib/serverLogger.mjs";
import { withApiObservability } from "../../lib/apiObservability.mjs";
import { analyticsConfiguration, analyticsEnvelope, analyticsVisitor, createProductAnalyticsStore } from '../../lib/productAnalyticsStore.mjs';
import { sameOriginJson } from '../../lib/readerCommunity.mjs';
import { checkDistributedRateLimit } from '../../lib/redisRateLimit.mjs';
import { getClientAddress } from '../../lib/requestSecurity.mjs';

export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };
export function createAnalyticsHandler({ store = createProductAnalyticsStore(), env = process.env, rateLimit = checkDistributedRateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control','no-store');
    const configuration = analyticsConfiguration(env);
    if (req.method === 'GET') return res.status(200).json({ enabled: configuration.enabled, retentionDays: configuration.retentionDays });
    if (!['POST','DELETE'].includes(req.method)) { res.setHeader('Allow','GET, POST, DELETE'); return res.status(405).json({ error: 'Method not allowed.' }); }
    if (!sameOriginJson(req)) return res.status(403).json({ error: 'Use the same-origin JSON endpoint.' });
    const limit = await rateLimit(`analytics:${getClientAddress(req)}`, {limit:120});
    if (!limit.ok) return res.status(429).json({ error:'Too many measurement requests.' });
    try {
      if (req.method === 'DELETE') {
        const visitor = analyticsVisitor(req.body?.visitorId);
        if (!visitor) return res.status(400).json({error:'A valid browser measurement identifier is required.'});
        if (!configuration.database) return res.status(503).json({error:'Measurement storage is unavailable; deletion has not been confirmed.'});
        await store.remove(visitor);
        return res.status(200).json({deleted:true});
      }
      if (!configuration.enabled) return res.status(503).json({error:'Optional product measurements are not configured.'});
      const event = analyticsEnvelope(req.body);
      if (!event) return res.status(400).json({ error:'Explicit consent and a supported measurement are required.' });
      const receipt = await store.record(event);
      if (receipt.withdrawn) return res.status(200).json({stored:false,reason:'This measurement identifier was withdrawn.'});
      return res.status(202).json({stored:true});
    } catch (error) {
      logOperationalFailure(req, "/api/analytics", "analytics.storage_failed", error);
      return res.status(503).json({ error:'Measurement storage is unavailable. No receipt is confirmed.' });
    }
  };
}
export default withApiObservability("/api/analytics", createAnalyticsHandler());
