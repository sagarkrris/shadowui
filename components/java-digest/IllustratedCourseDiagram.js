import { useId } from 'react';
import { canIllustrateCourseDiagram } from '../../lib/illustratedCourseDiagrams.mjs';

const palette = { blue: '#b9dafa', violet: '#ded0fa', teal: '#bde8df', amber: '#f8dfaa' };

function Label({ x, y, children, size = 14, bold = false, ...props }) {
  return <text x={x} y={y} fontSize={size} fontWeight={bold ? 700 : 400} fill="#20364c" {...props}>{children}</text>;
}

function Panel({ x, y, width, height, tone = 'blue', children }) {
  return <g transform={`translate(${x} ${y})`}>
    <rect x="0" y="5" width={width} height={height} rx="18" fill="#20364c" opacity=".07" />
    <rect width={width} height={height} rx="18" fill={palette[tone]} stroke="#52687d" strokeWidth="1.5" />
    {children}
  </g>;
}

// Arrows are explicitly authored; none are inferred from display labels.
// The course's authored text remains available beside the artwork.
function MemoryPicture({ diagram, arrow }) {
  const node = key => diagram.nodes.find(item => item[0] === key);
  return <>
    <rect x="24" y="24" width="852" height="426" rx="24" fill="#f0f5fa" stroke="#52687d" strokeDasharray="7 5" />
    <Label x="48" y="58" size={18} bold>{node('process')[3]}</Label>
    <Label x="48" y="83">{node('process')[4]} · conceptual HotSpot map, not to scale</Label>
    <path d="M450 96 V112 M164 112 H736 M164 112 V142 M450 112 V142 M736 112 V142" fill="none" stroke="#52687d" strokeWidth="2" />
    {[[164, 'managed objects'], [450, 'per-thread'], [736, 'outside heap']].map(([x, text]) => <g key={text}>
      <path d={`M${x} 136 v8`} stroke="#52687d" strokeWidth="2" markerEnd={`url(#${arrow})`} />
      <Label x={x + 12} y="132" size={12} paintOrder="stroke" stroke="#f0f5fa" strokeWidth="5" strokeLinejoin="round">{text}</Label>
    </g>)}
    <Panel x={48} y={154} width={232} height={264}>
      <Label x="18" y="32" size={18} bold>{node('heap')[3]}</Label>
      <Label x="18" y="57" size={12}>{node('heap')[4]}</Label>
      {[[18, 85, 'Order'], [123, 85, 'User'], [18, 149, 'byte[]'], [123, 149, 'List']].map(([x,y,label]) => <g key={label}>
        <rect x={x} y={y} width="90" height="47" rx="9" fill="#f9fcff" stroke="#52687d" />
        <Label x={x + 45} y={y + 28} textAnchor="middle" bold>{label}</Label>
      </g>)}
      <Label x="18" y="236" size={12}>Objects and arrays · shared area</Label>
    </Panel>
    <Panel x={334} y={154} width={232} height={264} tone="violet">
      <Label x="18" y="32" size={18} bold>{node('stacks')[3]}</Label>
      <Label x="18" y="57" size={12}>{node('stacks')[4]}</Label>
      {[18, 124].map((x,index) => <g key={x}>
        <Label x={x + 43} y="91" textAnchor="middle" size={12}>Thread {index + 1}</Label>
        {[104, 140, 176].map((y,i) => <g key={y}>
          <rect x={x} y={y} width="88" height="31" rx="5" fill="#fcfaff" stroke="#72618f" />
          <Label x={x + 44} y={y + 20} textAnchor="middle" size={12}>Frame {3 - i}</Label>
        </g>)}
      </g>)}
      <Label x="18" y="236" size={12}>Method frames · one stack/thread</Label>
    </Panel>
    <Panel x={620} y={154} width={232} height={264} tone="teal">
      <Label x="18" y="32" size={18} bold>{node('native')[3]}</Label>
      <Label x="18" y="57" size={12}>Native memory outside the heap</Label>
      {['Metaspace', 'Code cache', 'Direct buffers', 'Memory mappings'].map((label,index) => <g key={label}>
        <rect x="18" y={77 + index * 39} width="196" height="30" rx="7" fill="#f5fffc" stroke="#4e7e75" />
        <Label x="32" y={97 + index * 39}>{label}</Label>
      </g>)}
    </Panel>
    <Label x="36" y="482" bold>Stable heap usage does not prove the process fits its container.</Label>
    <Label x="36" y="507">Inspect heap, thread count, and native memory together. Sizes here are illustrative.</Label>
  </>;
}

function GatewayPicture({ diagram, arrow }) {
  const node = key => diagram.nodes.find(item => item[0] === key);
  return <>
    <rect x="310" y="24" width="566" height="422" rx="24" fill="#f0f5fa" stroke="#52687d" strokeDasharray="7 5" />
    <Label x="36" y="55" size={12} bold>UNTRUSTED INPUT</Label>
    <Label x="334" y="55" size={12} bold>CONTROLLED SERVICE BOUNDARY</Label>
    {[[36, 'client', 'blue'], [346, 'edge', 'violet'], [656, 'service', 'teal']].map(([x,key,tone],index) => <Panel key={key} x={x} y={94} width={208} height={180} tone={tone}>
      <Label x="18" y="28" size={12} bold>0{index + 1}</Label>
      {key === 'client' ? <g fill="none" stroke="#20364c" strokeWidth="2.5"><rect x="86" y="24" width="60" height="42" rx="5" /><path d="M116 66 v9 m-20 0 h40 M86 36 h60" /></g>
        : key === 'edge' ? <g fill="none" stroke="#20364c" strokeWidth="2.5"><path d="M116 22 l26 10 v17 q0 20 -26 30 q-26 -10 -26 -30 V32 Z M103 49 l9 9 17 -19" /></g>
          : <g fill="none" stroke="#20364c" strokeWidth="2.5">{[26,45,64].map(y => <g key={y}><rect x="86" y={y} width="60" height="14" rx="4" /><path d={`M94 ${y + 7} h5 m8 0 h29`} /></g>)}</g>}
      <Label x="18" y="109" size={18} bold>{node(key)[3]}</Label>
      <Label x="18" y="135" size={12}>{node(key)[4]}</Label>
      <Label x="18" y="159" size={12}>{['Headers are not proof', 'Validate credentials first', 'Authorize this booking'][index]}</Label>
    </Panel>)}
    {['M244 180 H346', 'M554 180 H656', 'M760 274 V348'].map(path => <path key={path} d={path} fill="none" stroke="#52687d" strokeWidth="2" markerEnd={`url(#${arrow})`} />)}
    <Label x="295" y="165" textAnchor="middle" size={12}>request</Label>
    <Label x="605" y="151" textAnchor="middle" size={12}>authenticated</Label>
    <Label x="605" y="169" textAnchor="middle" size={12}>hop</Label>
    <Label x="745" y="314" textAnchor="end" size={12}>authorized</Label>
    <Panel x={656} y={348} width={208} height={76} tone="amber">
      <g fill="none" stroke="#20364c" strokeWidth="2"><ellipse cx="30" cy="22" rx="13" ry="5" /><path d="M17 22 v27 c0 7 26 7 26 0 V22 M17 35 c0 7 26 7 26 0" /></g>
      <Label x="57" y="28" size={12} bold>Owned booking state</Label>
      <Label x="57" y="51" size={12}>Only after checks</Label>
    </Panel>
    <Label x="36" y="482" bold>Authenticated identity is only the start of the access decision.</Label>
    <Label x="36" y="507">The owning service still checks the tenant and resource. Simplified request path.</Label>
  </>;
}

function StrategyPicture({ diagram, arrow, implementation }) {
  const node = key => diagram.nodes.find(item => item[0] === key);
  return <>
    <Label x="36" y="48" size={12} bold>ONE CALL CONTRACT · TWO INTERCHANGEABLE POLICIES</Label>
    <Panel x={36} y={84} width={300} height={130}>
      <path d="M24 28 h10 l8 34 h39 l8 -24 H38 M48 72 h1 m28 0 h1" fill="none" stroke="#20364c" strokeWidth="3" strokeLinecap="round" />
      <Label x="109" y="44" size={20} bold>{node('checkout')[3]}</Label>
      <Label x="109" y="71">{node('checkout')[4]}</Label>
      <Label x="24" y="109" size={12}>Uses the supplied policy, not a class switch</Label>
    </Panel>
    <Panel x={536} y={84} width={328} height={130} tone="violet">
      <Label x="22" y="29" size={12}>INTERFACE</Label>
      <Label x="22" y="61" size={22} bold>{node('contract')[3]}</Label>
      <Label x="22" y="88">price(subtotal)</Label>
      <Label x="22" y="111" size={12}>{node('contract')[4]}</Label>
    </Panel>
    <path d="M336 148 H536" fill="none" stroke="#52687d" strokeWidth="2" markerEnd={`url(#${arrow})`} />
    <Label x="436" y="132" textAnchor="middle">calls</Label>
    {['M236 326 V264 H650 V214', 'M664 326 V264 H750 V214'].map(path => <path key={path} d={path} fill="none" stroke="#52687d" strokeWidth="2" strokeDasharray="6 4" markerEnd={`url(#${implementation})`} />)}
    <Label x="370" y="254" textAnchor="middle" size={12}>implements</Label>
    <Label x="800" y="254" textAnchor="middle" size={12}>implements</Label>
    {[[36, 'standard', 'teal'], [464, 'discount', 'amber']].map(([x,key,tone]) => <Panel key={key} x={x} y={326} width={400} height={112} tone={tone}>
      <Label x="22" y="32" size={18} bold>{node(key)[3]}</Label>
      <Label x="22" y="75" size={28} bold>{node(key)[4]}</Label>
      <Label x="22" y="98" size={12}>{key === 'standard' ? 'Subtotal returned unchanged' : 'Illustrative ten-percent discount'}</Label>
    </Panel>)}
    <Label x="36" y="482" bold>Supply one policy at construction time; checkout uses its returned amount.</Label>
    <Label x="36" y="507">Solid arrow = call. Dashed hollow arrow = implements, not a second runtime call.</Label>
  </>;
}

export default function IllustratedCourseDiagram({ diagramKey, diagram, enlarged }) {
  const id = useId();
  const arrow = `picture-arrow-${id}`, implementation = `picture-implements-${id}`;
  const Picture = { memory: MemoryPicture, gatewayTrust: GatewayPicture, patternStrategy: StrategyPicture }[diagramKey];
  if (!Picture || !canIllustrateCourseDiagram(diagramKey, diagram)) return null;
  return <svg xmlns="http://www.w3.org/2000/svg" data-illustrated-diagram={diagramKey} role="img" aria-labelledby={`picture-title-${id} picture-desc-${id}`}
    viewBox="0 0 900 540" style={{ display: 'block', width: '100%', minWidth: enlarged ? 1200 : 900, height: 'auto', fontFamily: 'system-ui, sans-serif' }}>
    <title id={`picture-title-${id}`}>{diagram.title}</title>
    <desc id={`picture-desc-${id}`}>{diagram.description} {diagram.edges.map(([from,to,label]) => `${diagram.nodes.find(node => node[0] === from)[3]} → ${diagram.nodes.find(node => node[0] === to)[3]}: ${label}.`).join(' ')}</desc>
    <defs>
      <marker id={arrow} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#52687d" /></marker>
      <marker id={implementation} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="#f0f5fa" stroke="#52687d" /></marker>
    </defs>
    <rect width="900" height="540" rx="16" fill="#fffdf8" />
    <Picture diagram={diagram} arrow={arrow} implementation={implementation} />
  </svg>;
}
