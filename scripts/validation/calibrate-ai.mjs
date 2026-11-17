// Uses synthetic answers only. Never prints credentials or raw provider errors.
import { CALIBRATION_DATASET, question, cases } from './ai-calibration-fixtures.mjs';
import { calibrationObservation, calibrationMetrics } from './ai-calibration-metrics.mjs';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runGeminiRouteOperation } from '../../lib/aiGateway.mjs';
import { createGeminiClient, generateContent } from '../../lib/googleGenai.mjs';
import { buildStructuredEvaluationPrompt, parseStructuredEvaluation } from '../../lib/interviewSession.mjs';
try { process.loadEnvFile('.env.local'); } catch { /* Environment may already be configured. */ }
const live = process.argv.includes('--live');
const report = { schemaVersion: 2, mode: live ? 'live-calibration' : 'offline-inventory', dataset: CALIBRATION_DATASET, fixtureIds: cases.map(sample => sample.id), createdAt: new Date().toISOString(), rubric: 1, scope: 'Synthetic Java concurrency calibration; not a population-level validity study.', results: [] };
if (live) for (const sample of cases) {
  for (let repeat = 1; repeat <= 2; repeat++) {
    try {
      const { modelName, result } = await runGeminiRouteOperation({ operation: (model, { apiKey }) => generateContent(createGeminiClient(apiKey), { model, contents: buildStructuredEvaluationPrompt({ question, answer: sample.answer, difficulty: 'Mid', round: 'technical' }), config: { responseMimeType: 'application/json', temperature: 0, httpOptions: { timeout: 60000 } } }) });
      const parsed = parseStructuredEvaluation(result.text, { answer: sample.answer });
      const observation = calibrationObservation(sample, result.text, parsed);
      report.results.push({ id: sample.id, repeat, model: /^[a-z0-9_./-]{1,120}$/i.test(modelName) ? modelName : 'unknown', ...observation });
      console.log(`${sample.id} ${repeat}: ${report.results.at(-1).passed ? 'PASS' : 'FAIL'} (${observation.score ?? 'unassessed'})`);
    } catch (error) {
      report.results.push({ id: sample.id, repeat, passed: false, error: error.name === 'AiConfigError' ? 'AI_CONFIGURATION_UNAVAILABLE' : 'PROVIDER_UNAVAILABLE' });
      console.log(`${sample.id}: provider unavailable`);
      break;
    }
  }
  if (report.results.at(-1)?.error) break;
}
report.metrics = calibrationMetrics(report.results);
report.providerContact = live ? 'attempted-not-attested' : 'not-requested';
report.passed = live ? report.results.length === cases.length * 2 && report.results.every(r => r.passed) : null;
report.limits = ['Score bands are provisional synthetic expectations, not expert-reviewed labels.', 'Follow-up presence is checked; pedagogical quality requires independent human review.', 'This is not a population-level validity study or a hiring prediction.'];
await writeFile(process.argv.slice(2).find(arg => !arg.startsWith('--')) || join(tmpdir(), 'shadow-ai-calibration.json'), JSON.stringify(report, null, 2));
console.log(live ? 'Live synthetic calibration report written.' : 'Offline fixture inventory written; no provider request was made. Use --live only when explicitly authorized.');
process.exitCode = report.passed === false ? 1 : 0;
