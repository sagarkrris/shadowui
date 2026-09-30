// Infer a sequence only from an unambiguous single-line forward chain.
export function flowModel(value) {
  const source = String(value ?? '').replace(/\\n/g, '\n').trim();
  if (!source) return { kind: 'empty', source, steps: [] };
  if (/^(?:flowchart|graph)\s+(?:LR|TD|TB|RL|BT)\b/.test(source)) {
    const labels = new Map();
    const bare = source.replace(/([A-Za-z]\w*)\["([^"\n]*)"\]/g, (_, id, label) => {
      labels.set(id, label);
      return id;
    });
    const body = bare.replace(/^(?:flowchart|graph)\s+(?:LR|TD|TB|RL|BT)[ \t]*(?:\n|;)/, '');
    const statements = body.split(/[\n;]/).map(line => line.trim()).filter(Boolean);
    if (statements.length && statements.every(line => /^[A-Za-z]\w*(?:\s*-->\s*[A-Za-z]\w*)*$/.test(line))) {
      const edges = [];
      for (const statement of statements) {
        const ids = statement.split(/\s*-->\s*/);
        for (const id of ids) if (!labels.has(id)) labels.set(id, id);
        for (let index = 1; index < ids.length; index++) edges.push([ids[index - 1], ids[index]]);
      }
      return { kind: 'graph', source, nodes: [...labels].map(([id, label]) => ({ id, label })), edges };
    }
  }
  if (/[\n;←↔↘↙↗↖├└│]|<-|<=|\b(?:flowchart|graph)\b/.test(source)) return { kind: 'source', source, steps: [] };
  const steps = source.split(/\s*(?:-->|→|->|⇒)\s*/).filter(Boolean);
  return steps.length > 1 ? { kind: 'sequence', source, steps } : { kind: 'source', source, steps: [] };
}

export function wrapDiagramLabel(value, limit = 23) {
  const lines = [];
  let line = '';
  for (const word of String(value).split(/\s+/)) {
    if (line && (line + ' ' + word).length > limit) { lines.push(line); line = ''; }
    let rest = word;
    while (rest.length > limit) {
      if (line) { lines.push(line); line = ''; }
      lines.push(rest.slice(0, limit));
      rest = rest.slice(limit);
    }
    line = line ? line + ' ' + rest : rest;
  }
  if (line) lines.push(line);
  return lines;
}
