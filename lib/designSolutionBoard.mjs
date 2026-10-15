// Wrap complete authored text for the portable SVG; never truncate a design decision.
export function wrapBoardText(value, columns = 43) {
  const lines = [];
  for (const paragraph of String(value).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const parts = word.match(new RegExp(`.{1,${columns}}`, 'gu')) || [];
      for (const part of parts) {
        if (line && line.length + part.length + 1 > columns) { lines.push(line); line = ''; }
        line += (line ? ' ' : '') + part;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function buildDesignSolutionBoard(problem) {
  const card = (title, text, color) => ({ title, text, color, lines: text.flatMap(item => wrapBoardText(item)) });
  const top = [
    card('Functional requirements', problem.requirements.map(item => `• ${item}`), '#a8d7f4'),
    card(problem.track === 'hld' ? 'Non-functional requirements' : 'State & boundary contract', (problem.nonFunctional || problem.checks).map(item => `• ${item}`), '#b9eec3'),
    card(problem.track === 'hld' ? 'Capacity & assumptions' : 'Design constraints', [problem.constraint], '#f9dbaa'),
  ];
  const bottom = [
    card(problem.track === 'hld' ? 'API design' : 'Public interfaces', problem.api.split('\n'), '#d7c5f4'),
    card(problem.track === 'hld' ? 'Data model & ownership' : 'Objects & ownership', [problem.data], '#b9eec3'),
    card('Key design decisions', problem.insights.map((item,i) => `${i+1}. ${item}`), '#f9dbaa'),
  ];
  const height = cards => Math.max(...cards.map(item => 54 + item.lines.length * 15));
  const topHeight = height(top), bottomHeight = height(bottom);
  const architectureY = 100 + topHeight + 24;
  const bottomY = architectureY + 455;
  return { top, bottom, topHeight, bottomHeight, architectureY, bottomY, height: bottomY + bottomHeight + 26 };
}
