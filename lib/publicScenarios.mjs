import { SCENARIO_SEEDS, RECENT_SCENARIO_REPORTS } from './scenarioBank.mjs';

// Recent reports already have an editorial prompt and rubric in Scenario Bank.
// Adapt those same records for public practice rather than maintain a second copy.
export const PUBLIC_SCENARIOS = [...SCENARIO_SEEDS, ...RECENT_SCENARIO_REPORTS.map(report => ({
  ...report,
  difficulty: report.level,
  deepDive: report.polishedAnswer,
  traps: [report.candidateTrap],
}))];

export function publicScenario(id) {
  return PUBLIC_SCENARIOS.find(scenario => scenario.id === id) || null;
}
