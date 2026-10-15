import { HLD_SOLUTIONS } from './designLibraryHld.mjs';
import { LLD_SOLUTIONS } from './designLibraryLld.mjs';

export const DESIGN_PROBLEMS = [...HLD_SOLUTIONS, ...LLD_SOLUTIONS];
export const DESIGN_PROGRESS_KEY = 'interviewiq:design-library:v1';
export const designHref = problem => `/${problem.track}/${problem.slug}`;
export function getDesignProblem(track, slug) {
  return DESIGN_PROBLEMS.find(problem => problem.track === track && problem.slug === slug) || null;
}
export function filterDesignProblems(problems, { query = '', difficulty = 'All', topic = 'All', status = 'All' } = {}, progress = {}) {
  const words = String(query).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return problems.filter(problem => {
    const state = progress[`${problem.track}/${problem.slug}`] || {};
    const text = `${problem.slug.replace(/-/g, ' ')} ${problem.title} ${problem.summary} ${problem.topic} ${problem.tags.join(' ')}`.toLowerCase();
    return words.every(word => text.includes(word)) && (difficulty === 'All' || difficulty === problem.difficulty)
      && (topic === 'All' || topic === problem.topic)
      && (status === 'All' || (status === 'Completed' && state.done) || (status === 'To revisit' && state.starred) || (status === 'Not completed' && !state.done));
  });
}
export function parseDesignProgress(raw) {
  try {
    const input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    return Object.fromEntries(DESIGN_PROBLEMS.flatMap(problem => {
      const key = `${problem.track}/${problem.slug}`;
      const value = input[key];
      return value && typeof value === 'object' ? [[key, { done: value.done === true, starred: value.starred === true, notes: typeof value.notes === 'string' ? value.notes.slice(0, 20000) : '' }]] : [];
    }));
  } catch { return {}; }
}
export function exportDesignSolution(problem) {
  return [`# ${problem.title}`, `${problem.track.toUpperCase()} · ${problem.difficulty} · ${problem.topic}`, problem.summary,
    '## Requirements', ...problem.requirements.map(line => `- ${line}`), '## Design contract', problem.constraint,
    ...(problem.nonFunctional ? ['## Non-functional requirements', ...problem.nonFunctional.map(line => `- ${line}`)] : []),
    '## Solution', ...problem.steps.map((line, index) => `${index + 1}. ${line}`),
    '## Interfaces', problem.api, '## Data and ownership', problem.data, '## Trade-offs', ...problem.insights.map(line => `- ${line}`),
    '## Boundary checks', ...problem.checks.map(line => `- ${line}`), '## Scope', problem.scope,
    ...(problem.java ? ['## Java 17 core model', problem.java.source, '## Model boundaries', problem.java.limits] : []),
    '## Sources', ...problem.sources.map(([label, url]) => `${label}: ${url}`)].join('\n\n');
}
