import { useId, useRef, useState } from 'react';
import { buildDesignSolutionBoard } from '../../lib/designSolutionBoard.mjs';
import styles from '../../styles/DesignLibrary.module.css';

export function downloadText(text, filename, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const positions = [[25,45],[335,45],[645,45],[25,280],[335,280],[645,280]];
const colors = ['#e1eefb','#e2f0e6','#fff0d3','#ede5fa','#fae2e8','#dff3f1'];

function BoardCard({ card, x, y, height }) {
  return <g data-board-card={card.title} data-card-height={height} transform={`translate(${x} ${y})`}>
    <path d={`M14 1 Q1 2 1 17 L2 ${height-17} Q1 ${height-1} 17 ${height-1} L266 ${height-2} Q281 ${height-1} 282 ${height-18} L281 16 Q282 1 265 2 Z`} fill={card.color} stroke="#3d403f" strokeWidth="1.4" />
    <text x="14" y="27" fontSize="14" fontWeight="600" fill="#252c2d">{card.title}</text>
    {card.lines.map((line,index) => <text key={index} x="14" y={50+index*15} fontSize="10.8" fill="#252c2d">{line}</text>)}
  </g>;
}

export default function DesignDiagram({ problem }) {
  const id = useId().replace(/:/g, '');
  const svg = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);
  const board = buildDesignSolutionBoard(problem);
  function downloadBoard() {
    const copy = svg.current.cloneNode(true);
    copy.style.width = '900px'; copy.style.height = `${board.height}px`; copy.style.minWidth = ''; copy.style.maxHeight = '';
    downloadText(copy.outerHTML, `${problem.slug}.svg`, 'image/svg+xml');
  }
  return <figure className={styles.figure}>
    <figcaption className={styles.boardCaption}><span>WORKED SOLUTION BOARD</span><p>Requirements, {problem.track === 'hld' ? 'architecture, APIs and data' : 'objects, contracts and invariants'} in one view. Zoom in to study a decision.</p></figcaption>
    <div className={styles.diagramTools}><button type="button" aria-label="Zoom out diagram" disabled={!fit && zoom <= .6} onClick={() => { setFit(false); setZoom(value => Math.max(.6, +(value - .2).toFixed(1))); }}>−</button><span aria-live="polite">{fit ? 'Fit' : `${Math.round(zoom * 100)}%`}</span><button type="button" aria-label="Zoom in diagram" disabled={!fit && zoom >= 1.8} onClick={() => { setFit(false); setZoom(value => Math.min(1.8, +(value + .2).toFixed(1))); }}>+</button><button type="button" onClick={() => { setZoom(1); setFit(false); }}>Reset zoom</button><button type="button" aria-pressed={fit} onClick={() => { setZoom(1); setFit(true); }}>Fit board</button><button type="button" onClick={downloadBoard}>Download SVG</button><span className={styles.boardHint}>Read-only reference</span></div>
    <div className={styles.diagramScroll} role="region" aria-label="Solution diagram; scroll horizontally on narrow screens" tabIndex={0}>
      <svg ref={svg} className={styles.boardSvg} xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`} viewBox={`0 0 900 ${board.height}`} width="900" height={board.height} style={{ width: fit ? '100%' : `${zoom * 100}%`, minWidth: fit ? 0 : `${zoom * 680}px`, maxHeight: fit ? 'calc(100dvh - 280px)' : 'none', height: 'auto', fontFamily: '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive' }}>
        <title id={`${id}-title`}>{`${problem.title} — reference diagram`}</title><desc id={`${id}-desc`}>{problem.edges.map(([a,b,label]) => `${problem.nodes[a][0]} → ${problem.nodes[b][0]}: ${label}`).join('. ')}</desc>
        <rect width="900" height={board.height} fill="#fffefb" />
        <text x="18" y="39" fontSize="27" fontWeight="600" fill="#252c2d">{problem.title}</text>
        <text x="18" y="68" fontSize="12" fill="#465650">{problem.track === 'hld' ? 'High-level design · Reference solution' : 'Low-level design · Reference solution'}</text>
        {board.top.map((card,index) => <BoardCard key={card.title} card={card} x={12+index*298} y={100} height={board.topHeight} />)}
        <g transform={`translate(0 ${board.architectureY})`}>
        <rect x="12" y="0" width="878" height="435" fill="none" stroke="#646967" strokeWidth="1.3" strokeDasharray="7 6" />
        <text x="24" y="25" fontSize="16" fill="#252c2d">{problem.track === 'hld' ? 'System architecture' : 'Class responsibilities & collaboration'}</text>
        <defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#53657b" /></marker></defs>
        {problem.edges.map(([from,to,label],index) => {
          const [ax,ay] = positions[from], [bx,by] = positions[to];
          const sameRow = ay === by;
          const bypass = sameRow && Math.abs(from - to) > 1;
          const startX = sameRow && !bypass ? ax + (bx > ax ? 210 : 0) : ax + 105;
          const endX = sameRow && !bypass ? bx + (bx > ax ? 0 : 230) : bx + 105;
          const startY = bypass ? ay + (ay > 100 ? 100 : 0) : sameRow ? ay + 50 : ay + (by > ay ? 100 : 0);
          const endY = bypass ? by + (by > 100 ? 100 : 0) : sameRow ? by + 50 : by + (by > ay ? 0 : 100);
          const lane = 180 + (index % 3) * 24;
          const bypassY = ay > 100 ? 415 : 36;
          const path = bypass ? `M${startX} ${startY} V${bypassY} H${endX} V${endY}` : sameRow ? `M${startX} ${startY} L${endX} ${endY}` : `M${startX} ${startY} V${lane} H${endX} V${endY}`;
          const lx = (startX + endX) / 2, ly = bypass ? bypassY - 8 : sameRow ? startY - 18 : lane - 8;
          return <g key={`${from}-${to}-${index}`}><path d={path} fill="none" stroke="#53657b" strokeWidth="1.6" markerEnd={`url(#${id}-arrow)`} /><rect x={lx - 76} y={ly - 13} width="152" height="19" fill="#fff" fillOpacity=".94" rx="4" /><text x={lx} y={ly} textAnchor="middle" fontSize="10" fill="#34445a">{label}</text></g>;
        })}
        {problem.nodes.map(([title,detail],index) => <g key={title} transform={`translate(${positions[index][0]} ${positions[index][1]})`}><path d="M16 1 Q1 1 2 17 L1 83 Q2 99 18 98 L193 99 Q210 100 209 83 L210 18 Q210 1 193 2 Z" fill={colors[index]} stroke="#424c50" strokeWidth="1.5" /><text x="105" y="42" textAnchor="middle" fontSize="16" fontWeight="600" fill="#182b43">{title}</text><text x="105" y="68" textAnchor="middle" fontSize="11" fill="#34445a">{detail}</text></g>)}
        </g>
        {board.bottom.map((card,index) => <BoardCard key={card.title} card={card} x={12+index*298} y={board.bottomY} height={board.bottomHeight} />)}
      </svg>
    </div>
    <details className={styles.diagramText}><summary>Read the diagram as text</summary>{[...board.top,...board.bottom].map(card => <section key={card.title}><h3>{card.title}</h3>{card.text.map((line,index) => <p key={index}>{line}</p>)}</section>)}<h3>Architecture relationships</h3><ul>{problem.edges.map(([a,b,label],i) => <li key={i}><strong>{problem.nodes[a][0]} → {problem.nodes[b][0]}</strong>: {label}</li>)}</ul></details>
  </figure>;
}
