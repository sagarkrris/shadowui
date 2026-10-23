import { wrapDiagramLabel } from './visualModels.mjs';

// Decorative symbols use stable IDs, never translated display text. Unknown
// roles use a neutral component symbol; labels remain the technical authority.
const symbols = {
  client: 'browser', caller: 'browser', request: 'browser', user: 'people', users: 'people',
  service: 'server', app: 'server', worker: 'server', consumer: 'server', producer: 'server', target: 'server',
  db: 'database', database: 'database', store: 'database', source: 'database', state: 'database', commit: 'database', write: 'database',
  cache: 'cache', cached: 'cache', fresh: 'cache', index: 'collection', queue: 'queue', message: 'queue', event: 'queue',
  auth: 'shield', identity: 'shield', proxy: 'shield', edge: 'shield', validate: 'shield', policy: 'policy', contract: 'code',
  thread: 'stack', stacks: 'stack', heap: 'memory', native: 'memory', process: 'server',
  retry: 'clock', timeout: 'clock', deadline: 'clock', wait: 'clock', lease: 'key', owner: 'key',
  key: 'key', token: 'key', lock: 'key', log: 'document', trace: 'signal', metric: 'signal', alert: 'signal',
  input: 'document', output: 'document', result: 'document', outcome: 'document', evidence: 'document',
  read: 'browser', return: 'document', fill: 'shield', remove: 'shield', transaction: 'database',
  acquire: 'key', release: 'key', closed: 'shield', open: 'shield', probe: 'shield',
  checkout: 'browser', standard: 'policy', discount: 'policy', factory: 'code', interface: 'code', adapter: 'code',
};

export const ARTWORK_COLORS = ['#b9dafa', '#ded0fa', '#bde8df', '#f8dfaa', '#f4cedb'];
export function diagramSymbol(id) { return Object.hasOwn(symbols, id) ? symbols[id] : 'component'; }

export function artworkGraph(nodes, edges, title, description = '') {
  if (!Array.isArray(nodes) || !nodes.length || !Array.isArray(edges)) return null;
  const ids = new Set();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || ids.has(node.id) || typeof node.label !== 'string' || typeof node.detail !== 'string') return null;
    ids.add(node.id);
  }
  if (edges.some(edge => !edge || !ids.has(edge.from) || !ids.has(edge.to) || typeof edge.label !== 'string')) return null;
  return { nodes, edges, title, description };
}

export function courseArtworkModel(diagram) {
  if (!diagram || !Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return null;
  return artworkGraph(diagram.nodes.map(node => Array.isArray(node) ? ({ id: node[0], x: node[1], y: node[2], label: node[3], detail: node[4], symbol: diagramSymbol(node[0]) }) : null),
    diagram.edges.map(edge => Array.isArray(edge) ? ({ from: edge[0], to: edge[1], label: edge[2] }) : null), diagram.title, diagram.description);
}

export function sequenceArtworkModel(steps, title, comparison = false) {
  if (!Array.isArray(steps)) return null;
  const nodes = steps.map((step, index) => ({ id: `step-${index}`, label: Array.isArray(step) ? step[0] : `Step ${index + 1}`, detail: Array.isArray(step) ? step[1] : step, symbol: comparison ? 'policy' : 'document' }));
  return artworkGraph(nodes, comparison ? [] : nodes.slice(1).map((node, index) => ({ from: nodes[index].id, to: node.id, label: 'then' })), title, comparison ? 'Read these items side by side; no execution order is implied.' : 'Follow the authored sequence.');
}

// Parse only complete, explicit arrow chains. Unsupported notation remains
// visible as source rather than having its relationships guessed or discarded.
export function arrowArtworkModel(source, title) {
  if (typeof source !== 'string' || /\b(?:flowchart|graph)\b|[├└│]/.test(source)) return null;
  const nodes = new Map(), edges = [];
  const id = label => { if (!nodes.has(label)) nodes.set(label, { id: `node-${nodes.size}`, label, detail: '', symbol: 'component' }); return nodes.get(label).id; };
  for (const statement of source.split(/[;\n]/).map(line => line.trim()).filter(Boolean)) {
    const parts = statement.split(/\s+(-->|->|<-|←|→|↔|⇒)\s+/);
    if (parts.length < 3 || parts.some(part => !part.trim()) || parts.filter((_, index) => index % 2 === 0).some(label => /[→←↔⇒]|-->|->|<-/.test(label))) return null;
    for (let index = 1; index < parts.length; index += 2) {
      const left = id(parts[index - 1].trim()), right = id(parts[index + 1].trim()), arrow = parts[index];
      if (['←', '<-'].includes(arrow)) edges.push({ from: right, to: left, label: 'authored direction' });
      else if (arrow === '↔') edges.push({ from: left, to: right, label: 'authored direction' }, { from: right, to: left, label: 'authored direction' });
      else edges.push({ from: left, to: right, label: 'authored direction' });
    }
  }
  return artworkGraph([...nodes.values()], edges, title, source);
}

export function layoutArtwork(model) {
  if (!model) return null;
  const positioned = model.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.y));
  const xs = positioned ? [...new Set(model.nodes.map(node => node.x))].sort((a,b) => a-b) : [];
  const ys = positioned ? [...new Set(model.nodes.map(node => node.y))].sort((a,b) => a-b) : [];
  const columns = positioned ? xs.length : Math.min(3, model.nodes.length);
  const nodes = model.nodes.map((node, index) => {
    const labelLines = wrapDiagramLabel(node.label, 27), detailLines = wrapDiagramLabel(node.detail, 32);
    return { ...node, labelLines, detailLines, x: 80 + (positioned ? xs.indexOf(node.x) : index % columns) * 400, row: positioned ? ys.indexOf(node.y) : Math.floor(index / columns) };
  });
  const nodeHeight = Math.max(180, ...nodes.map(node => 118 + node.labelLines.length * 20 + node.detailLines.length * 18));
  const stride = nodeHeight + 130;
  for (const node of nodes) node.y = 150 + node.row * stride;
  const width = Math.max(900, 160 + (columns - 1) * 400 + 280);
  const graphBottom = Math.max(...nodes.map(node => node.y + nodeHeight));
  const routes = model.edges.map((edge, index) => {
    const a = nodes.find(node => node.id === edge.from), b = nodes.find(node => node.id === edge.to);
    const lane = 30 + (index % 6) * 13;
    let path, labelX, labelY;
    if (a.id === b.id) {
      path = `M${a.x + 220} ${a.y} V${a.y - lane} H${a.x + 60} V${a.y}`;
      labelX = a.x + 140; labelY = a.y - lane;
    } else if (a.row === b.row && Math.abs(a.x - b.x) === 400) {
      const forward = a.x < b.x, y = a.y + nodeHeight / 2 + (forward ? -12 : 12);
      path = `M${a.x + (forward ? 280 : 0)} ${y} H${b.x + (forward ? 0 : 280)}`;
      labelX = (a.x + b.x + 280) / 2; labelY = y;
    } else if (a.row === b.row) {
      const y = a.y - lane;
      path = `M${a.x + 140} ${a.y} V${y} H${b.x + 140} V${b.y}`;
      labelX = (a.x + b.x) / 2 + 140; labelY = y;
    } else if (Math.abs(a.row - b.row) > 1) {
      const x = 22 + (index % 4) * 12;
      path = `M${a.x + 140} ${a.y} V${a.y - lane} H${x} V${b.y - lane} H${b.x + 140} V${b.y}`;
      labelX = x; labelY = (a.y + b.y + nodeHeight) / 2;
    } else {
      const down = a.row < b.row, startY = a.y + (down ? nodeHeight : 0), endY = b.y + (down ? 0 : nodeHeight);
      const midY = (startY + endY) / 2 + (index % 3 - 1) * 22;
      const shift = down ? -14 : 14;
      path = `M${a.x + 140 + shift} ${startY} V${midY} H${b.x + 140 + shift} V${endY}`;
      labelX = (a.x + b.x) / 2 + 140 + shift; labelY = midY;
    }
    return { ...edge, path, labelX, labelY, number: index + 1 };
  });
  let legendY = graphBottom + 75;
  const legend = routes.map(edge => {
    const from = nodes.find(node => node.id === edge.from), to = nodes.find(node => node.id === edge.to);
    const lines = wrapDiagramLabel(`${from.label} → ${to.label}: ${edge.label}`, Math.floor((width - 150) / 8));
    const item = { ...edge, lines, y: legendY };
    legendY += lines.length * 20 + 16;
    return item;
  });
  return { nodes, routes, legend, nodeHeight, width, graphBottom, height: legend.length ? legendY + 24 : graphBottom + 35 };
}
