// Explicit contracts for artwork with authored geometry. A changed topology
// falls back to the data-driven diagram rather than showing stale relationships.
export const ILLUSTRATED_DIAGRAM_CONTRACTS = {
  memory: { nodes: ['process', 'heap', 'stacks', 'native'], edges: [['process', 'heap'], ['process', 'stacks'], ['process', 'native']] },
  gatewayTrust: { nodes: ['client', 'edge', 'service', 'state'], edges: [['client', 'edge'], ['edge', 'service'], ['service', 'state']] },
  patternStrategy: { nodes: ['checkout', 'contract', 'standard', 'discount'], edges: [['checkout', 'contract'], ['standard', 'contract'], ['discount', 'contract']] },
};

export function canIllustrateCourseDiagram(key, diagram) {
  const contract = Object.hasOwn(ILLUSTRATED_DIAGRAM_CONTRACTS, key) ? ILLUSTRATED_DIAGRAM_CONTRACTS[key] : null;
  if (!contract || !diagram || typeof diagram.title !== 'string' || typeof diagram.description !== 'string' ||
      !Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return false;
  if (diagram.nodes.length !== contract.nodes.length || diagram.edges.length !== contract.edges.length) return false;
  const ids = new Set();
  for (const node of diagram.nodes) {
    if (!Array.isArray(node) || !contract.nodes.includes(node[0]) || ids.has(node[0]) ||
        typeof node[3] !== 'string' || typeof node[4] !== 'string') return false;
    ids.add(node[0]);
  }
  const edges = new Set();
  for (const edge of diagram.edges) {
    if (!Array.isArray(edge) || typeof edge[2] !== 'string' ||
        !contract.edges.some(([from, to]) => edge[0] === from && edge[1] === to)) return false;
    edges.add(JSON.stringify(edge.slice(0, 2)));
  }
  return edges.size === contract.edges.length;
}
