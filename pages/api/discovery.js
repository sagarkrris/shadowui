import { discoveryCatalogue } from '../../lib/discoveryCatalog.mjs';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET to browse the public catalogue.' });
  }
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res.status(200).json({ items: discoveryCatalogue() });
}
