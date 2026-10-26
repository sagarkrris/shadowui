import { useId } from 'react';
import { ARTWORK_COLORS, layoutArtwork } from '../../lib/diagramArtwork.mjs';

export function DiagramGlyph({ kind = 'component', x = 0, y = 0, size = 44 }) {
  const paths = {
    browser: <><rect x="3" y="5" width="38" height="28" rx="4" /><path d="M3 13 h38 M22 33 v6 M12 39 h20" /></>,
    server: <>{[5,17,29].map(top => <g key={top}><rect x="5" y={top} width="34" height="9" rx="3" /><path d={`M11 ${top + 4.5} h2 M20 ${top + 4.5} h12`} /></g>)}</>,
    database: <><ellipse cx="22" cy="9" rx="16" ry="6" /><path d="M6 9 v25 c0 8 32 8 32 0 V9 M6 21 c0 8 32 8 32 0" /></>,
    cache: <><ellipse cx="22" cy="9" rx="16" ry="6" /><path d="M6 9 v25 c0 8 32 8 32 0 V9 M25 15 l-9 12 h8 l-4 10 12 -15 h-9 Z" /></>,
    shield: <path d="M22 3 l16 6 v11 q0 13 -16 21 Q6 33 6 20 V9 Z M13 21 l6 6 12 -13" />,
    policy: <><path d="M10 4 h20 l7 8 v27 H10 Z M30 4 v10 h7 M15 22 h15 M15 30 h11" /></>,
    document: <><path d="M9 4 h19 l8 8 v28 H9 Z M28 4 v10 h8 M15 21 h14 M15 28 h14 M15 35 h8" /></>,
    code: <path d="M14 10 L3 22 l11 12 M30 10 l11 12 -11 12 M26 6 l-8 32" />,
    stack: <>{[6,18,30].map(top => <rect key={top} x="6" y={top} width="32" height="8" rx="2" />)}</>,
    queue: <><path d="M2 22 h40 M35 15 l7 7 -7 7" />{[6,17,28].map(left => <rect key={left} x={left} y="12" width="7" height="20" rx="2" fill="#fffdf8" />)}</>,
    memory: <><rect x="9" y="9" width="26" height="26" rx="4" /><path d="M16 16 h12 v12 H16 Z M15 3 v6 M23 3 v6 M31 3 v6 M15 35 v6 M23 35 v6 M31 35 v6 M3 15 h6 M3 23 h6 M3 31 h6 M35 15 h6 M35 23 h6 M35 31 h6" /></>,
    clock: <><circle cx="22" cy="22" r="17" /><path d="M22 11 v12 l9 5" /></>,
    key: <><circle cx="14" cy="16" r="10" /><path d="M21 23 l16 16 M30 32 l6 -6 M25 27 l6 -6" /></>,
    signal: <><path d="M4 36 V8 M4 36 h36 M9 27 l8 -9 8 5 13 -17" /><circle cx="17" cy="18" r="2" /><circle cx="25" cy="23" r="2" /></>,
    people: <><circle cx="22" cy="12" r="7" /><path d="M8 38 v-6 a14 14 0 0 1 28 0 v6 M5 13 a5 5 0 0 0 0 10 M39 13 a5 5 0 0 1 0 10" /></>,
    collection: <>{[[4,6],[24,6],[4,25],[24,25]].map(([left,top]) => <rect key={`${left}-${top}`} x={left} y={top} width="15" height="13" rx="3" />)}</>,
    component: <path d="M22 3 L40 12 V32 L22 41 L4 32 V12 Z M4 12 L22 22 L40 12 M22 22 V41" />,
  };
  return <g aria-hidden="true" data-diagram-symbol={kind} transform={`translate(${x} ${y}) scale(${size / 44})`} fill="none" stroke="#20364c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{Object.hasOwn(paths, kind) ? paths[kind] : paths.component}</g>;
}

export function DiagramSymbol({ kind = 'component', size = 44 }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 44 44" style={{ display: 'block', flexShrink: 0 }}><DiagramGlyph kind={kind} /></svg>;
}

export default function DiagramArtwork({ model, enlarged = false, fit = false, activeNode, artworkKey = 'graph' }) {
  const id = useId();
  const layout = layoutArtwork(model);
  if (!layout) return null;
  const marker = `artwork-arrow-${id}`;
  return <svg xmlns="http://www.w3.org/2000/svg" data-diagram-artwork={artworkKey} role="img" aria-labelledby={`artwork-title-${id} artwork-desc-${id}`}
    viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} height={layout.height}
    style={{ display: 'block', width: '100%', minWidth: fit ? 0 : enlarged ? layout.width * 4 / 3 : layout.width, height: 'auto', fontFamily: 'system-ui, sans-serif' }}>
    <title id={`artwork-title-${id}`}>{model.title}</title>
    <desc id={`artwork-desc-${id}`}>{model.description} {model.nodes.map(node => `${node.label}: ${node.detail}.`).join(' ')} {model.edges.map(edge => `${model.nodes.find(node => node.id === edge.from).label} → ${model.nodes.find(node => node.id === edge.to).label}: ${edge.label}.`).join(' ')}</desc>
    <defs><marker id={marker} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#52687d" /></marker></defs>
    <rect width={layout.width} height={layout.height} rx="18" fill="#fffdf8" />
    <text x="40" y="43" fontSize="14" fontWeight="700" fill="#20364c">{model.relation === 'timeline' ? 'FOLLOW THE TIMELINE' : model.relation === 'sequence' ? 'FOLLOW THE AUTHORED ORDER' : model.relation === 'feedback' ? 'FOLLOW THE FEEDBACK LOOP' : model.edges.length ? 'FOLLOW THE AUTHORED CONNECTIONS' : 'COMPONENTS AT A GLANCE'}</text>
    <text x="40" y="69" fontSize="12" fill="#40586d">{model.relation === 'timeline' ? 'Arrows show chronological progression.' : model.relation === 'sequence' ? 'Arrows show the authored step order.' : model.relation === 'feedback' ? 'Follow the labeled connections around the loop.' : model.relation === 'comparison' ? 'Compare the items; position does not imply order or dependency.' : model.edges.length ? 'Numbers identify labeled connections; placement does not imply execution order.' : 'Position does not imply a dependency or execution order. Read the accompanying explanation.'}</text>
    {layout.routes.map(edge => <g key={edge.number}>
      <path data-artwork-edge={`${edge.from}:${edge.to}`} d={edge.path} fill="none" stroke="#52687d" strokeWidth="2" markerEnd={`url(#${marker})`} />
    </g>)}
    {layout.nodes.map((node,index) => <g key={node.id} data-diagram-node={node.id} transform={`translate(${node.x} ${node.y})`}>
      <rect x="0" y="0" width="280" height={layout.nodeHeight} rx="18" fill={ARTWORK_COLORS[index % ARTWORK_COLORS.length]} stroke={activeNode === node.id ? '#20364c' : '#52687d'} strokeWidth={activeNode === node.id ? 4 : 1.5} />
      <DiagramGlyph kind={node.symbol} x={18} y={16} />
      {activeNode === node.id && <text x="262" y="31" fontSize="12" textAnchor="end" fontWeight="700" fill="#20364c">FOCUS</text>}
      <text fontSize="16" fontWeight="700" fill="#20364c" aria-label={node.label}>{node.labelLines.map((line,i) => <tspan key={i} x="18" y={85 + i * 20}>{line}</tspan>)}</text>
      <text fontSize="13" fill="#30485f" aria-label={node.detail}>{node.detailLines.map((line,i) => <tspan key={i} x="18" y={107 + node.labelLines.length * 20 + i * 18}>{line}</tspan>)}</text>
    </g>)}
    {layout.routes.map(edge => <g key={edge.number} aria-hidden="true">
      <circle cx={edge.labelX} cy={edge.labelY} r="12" fill="#fffdf8" stroke="#52687d" />
      <text x={edge.labelX} y={edge.labelY + 4} fontSize="12" textAnchor="middle" fontWeight="700" fill="#20364c">{edge.number}</text>
    </g>)}
    {layout.legend.length > 0 && <text x="40" y={layout.graphBottom + 42} fontSize="12" fontWeight="700" fill="#40586d">CONNECTION KEY</text>}
    {layout.legend.map(edge => <g key={edge.number}>
      <circle cx="52" cy={edge.y - 5} r="12" fill="#e8eef5" />
      <text x="52" y={edge.y - 1} fontSize="12" textAnchor="middle" fontWeight="700" fill="#20364c">{edge.number}</text>
      <text fontSize="14" fill="#20364c">{edge.lines.map((line,index) => <tspan key={index} x="78" y={edge.y + index * 20}>{line}</tspan>)}</text>
    </g>)}
  </svg>;
}
