import { ImageResponse } from 'next/og';
import { HLD_SOLUTIONS } from '../../lib/designLibraryHld.mjs';
import { DETECTIVE_CASES } from '../../lib/productionDetective.mjs';
import { READING_SERIES } from '../../lib/readerEditorial.mjs';

const cards = new Map([
  ...HLD_SOLUTIONS.map(item => [`/hld/${item.slug}`, { title: item.title, label: 'System design practice' }]),
  ...DETECTIVE_CASES.map(item => [`/detective/${item.slug}`, { title: item.title, label: 'Debugging challenge' }]),
  ...READING_SERIES.map(item => [`/series/${item.slug}`, { title: item.title, label: 'Connected reading path' }]),
]);
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  const card = typeof req.query.path === 'string' && cards.get(req.query.path);
  if (!card) return res.status(404).json({ error: 'Unknown public sharing card.' });
  try {
    const image = new ImageResponse(<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', background: '#10233f', color: 'white', padding: 72 }}><div style={{ display: 'flex', color: '#93c5fd', fontSize: 30 }}>InterviewIQ · {card.label}</div><div style={{ display: 'flex', fontSize: 64, lineHeight: 1.15 }}>{card.title}</div><div style={{ display: 'flex', fontSize: 26, color: '#cbd5e1' }}>Understand · Experiment · Build · Explain</div></div>, { width: 1200, height: 630 });
    const buffer = Buffer.from(await image.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).send(buffer);
  } catch { return res.status(503).json({ error: 'Sharing image temporarily unavailable.' }); }
}
