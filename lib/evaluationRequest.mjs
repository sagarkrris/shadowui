import { PRACTICE_RUBRIC } from './dailyPractice.mjs';
import { parseStructuredEvaluation } from './interviewSession.mjs';

const score = { type: ['number', 'null'], minimum: 0, maximum: 10 };
const strings = { type: 'array', items: { type: 'string' } };
export const EVALUATION_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    score,
    confidence: { type: 'string', enum: ['high', 'medium', 'low', 'insufficient-evidence'] },
    strengths: strings, gaps: strings, recommendations: strings, inventedMetrics: strings,
    followUp: { type: 'string' }, exercise: { type: 'string' },
    dimensions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { key: { type: 'string', enum: PRACTICE_RUBRIC.map(item => item.key) }, score, evidence: { type: 'string' }, deduction: { type: 'string' } },
        required: ['key', 'score', 'evidence', 'deduction'],
      },
    },
  },
  required: ['score', 'confidence', 'strengths', 'gaps', 'recommendations', 'inventedMetrics', 'followUp', 'exercise', 'dimensions'],
};

// Regenerate once on invalid output. Never accept fabricated quotes to unblock the UI.
export async function requestVerifiedEvaluation({ generate, prompt, answer, onInvalid }) {
  let parsed;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await generate(attempt === 0 ? prompt : `${prompt}\nYour previous response failed validation: ${parsed.error}\nReturn the complete JSON again. Every evidence quote must occur verbatim in the answer; use an empty string when evidence is absent.`);
    parsed = parseStructuredEvaluation(result.text || '', { answer });
    if (parsed.ok) return { evaluation: parsed.value, outputChars: (result.text || '').length };
    onInvalid?.({ attempt: attempt + 1, reason: parsed.error });
  }
  const error = new Error(parsed.error);
  error.name = 'EvaluationValidationError';
  throw error;
}
