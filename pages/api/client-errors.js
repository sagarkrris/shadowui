import { withApiObservability } from '../../lib/apiObservability.mjs';
import { createRequestLogger } from '../../lib/serverLogger.mjs';
import { normalizeBrowserError } from '../../lib/browserErrors.mjs';
import { sameOriginJson } from '../../lib/readerCommunity.mjs';
import { checkRateLimit, getClientAddress } from '../../lib/requestSecurity.mjs';

export const config = { api: { bodyParser: { sizeLimit: '1kb' } } };

export function createClientErrorsHandler({ rateLimit = checkRateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Use POST.' });
    }
    if (!sameOriginJson(req)) return res.status(403).json({ error: 'Use a same-origin JSON request.' });
    const rate = rateLimit(`client-errors:${getClientAddress(req)}`, { limit: 20 });
    if (!rate.ok) {
      res.setHeader('Retry-After', String(rate.retryAfter));
      return res.status(429).json({ error: 'Too many diagnostic reports.' });
    }
    const report = normalizeBrowserError(req.body);
    if (!report) return res.status(400).json({ error: 'Unsupported diagnostic report.' });
    createRequestLogger({ route: '/api/client-errors', requestId: req.requestId }).error('browser.failed', { kind: report.kind, pageRoute: report.route, line: report.line, column: report.column });
    return res.status(202).json({ accepted: true });
  };
}

export default withApiObservability('/api/client-errors', createClientErrorsHandler());
