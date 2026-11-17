import { PRACTICE_RUBRIC } from '../../lib/dailyPractice.mjs';

export function calibrationObservation(sample, raw, parsed) {
  let payload;
  try { payload = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { payload = null; }
  const dimensions = Array.isArray(payload?.dimensions) ? payload.dimensions : [];
  const quotes = dimensions.filter(item => typeof item?.evidence === 'string' && item.evidence.length > 0);
  const validQuotes = quotes.filter(item => sample.answer.includes(item.evidence));
  const validEvidence = validQuotes.length === quotes.length;
  const rubricComplete = PRACTICE_RUBRIC.every(item => dimensions.filter(d => d?.key === item.key).length === 1);
  const score = parsed?.ok ? parsed.value.score : null;
  const scoreInBand = parsed?.ok === true && (sample.min === null ? score === null : typeof score === 'number' && Number.isFinite(score) && score >= sample.min && score <= sample.max);
  const followUpPresent = typeof parsed?.value?.followUp === 'string' && parsed.value.followUp.trim().length > 0;
  const exercisePresent = typeof parsed?.value?.exercise === 'string' && parsed.value.exercise.trim().length > 0;
  return { score, confidence: parsed?.value?.confidence || 'unavailable', validEvidence, quoteCount: quotes.length, validQuoteCount: validQuotes.length, rubricComplete, scoreInBand, followUpPresent, exercisePresent, passed: parsed?.ok === true && validEvidence && rubricComplete && scoreInBand && followUpPresent && exercisePresent && (score === null || quotes.length > 0) };
}
export function calibrationMetrics(results = []) {
  const observations = results.filter(item => !item.error);
  const scored = observations.filter(item => typeof item.score === 'number' && Number.isFinite(item.score));
  const perCase = [...new Set(observations.map(item => item.id))].map(id => {
    const values = scored.filter(item => item.id === id).map(item => item.score);
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    return { id, scoredRepeats: values.length, mean, populationVariance: values.length >= 2 ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length : null, range: values.length >= 2 ? Math.max(...values) - Math.min(...values) : null };
  });
  const quoteCount = observations.reduce((sum, item) => sum + item.quoteCount, 0);
  const validQuoteCount = observations.reduce((sum, item) => sum + item.validQuoteCount, 0);
  return { completedObservations: observations.length, provisionalBandAgreement: observations.length ? observations.filter(item => item.scoreInBand).length / observations.length : null, evidenceQuoteValidity: quoteCount ? validQuoteCount / quoteCount : null, quotedSpansChecked: quoteCount, followUpPresence: observations.length ? observations.filter(item => item.followUpPresent).length / observations.length : null, exercisePresence: observations.length ? observations.filter(item => item.exercisePresent).length / observations.length : null, perCase, expertAgreement: null, expertReview: 'not-yet-performed' };
}
