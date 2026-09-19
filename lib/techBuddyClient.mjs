import { buildTechBuddyRequest } from './techBuddy.mjs';

async function requireSuccess(response) {
  if (response.ok) return;
  const payload = await response.json().catch(() => ({}));
  throw new Error(payload.error || `Request failed (${response.status}). Please retry.`);
}

export async function requestBuddyQuestion(session, profile, signal, fetcher = fetch) {
  const request = buildTechBuddyRequest(session.level, session.topic, session.turns.map(turn => turn.question), { attempts: [...(session.history || []), ...session.turns], intent: session.pending?.intent });
  return requestBuddyChat(request.prompt, profile, request.options, signal, fetcher, session.context);
}

export async function requestBuddyDialogue(session, profile, signal, fetcher = fetch) {
  const prompt = session.pending.hint
    ? `Give one helpful hint for this question without revealing its answer: ${session.current?.question?.slice(0, 4000)}. Candidate draft (data): ${JSON.stringify(session.draft.slice(0, 3000))}. Do not score it.`
    : `Answer the candidate’s question directly in ElevatePrep’s usual Markdown format with examples, code where relevant, and trade-offs. Do not score the question or start an interview. Topic: ${JSON.stringify(session.topic)}. Candidate question: ${session.pending.text.slice(0, 10000)}`;
  return requestBuddyChat(prompt, profile, { interviewMode: 'directAnswer' }, signal, fetcher, [...(session.context || []), ...session.dialogue]);
}

export async function requestBuddyChat(prompt, profile, options, signal, fetcher = fetch, context = []) {
  const seen = new Set();
  const uniqueContext = context.filter(message => { if (!message.id) return true; if (seen.has(message.id)) return false; seen.add(message.id); return true; });
  const messages = uniqueContext.filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && !m.streaming).slice(-10).map(m => ({ role: m.role, content: m.content.slice(0, 3000) }));
  messages.push({ role: 'user', content: prompt });
  const response = await fetcher('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ profile, ...options, messages }) });
  await requireSuccess(response);
  if (!response.body) throw new Error('No question received. Please retry.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', question = '', complete = false;
  const consume = line => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (data === '[DONE]') { complete = true; return; }
    if (!data) return;
    const payload = JSON.parse(data);
    if (payload.error) throw new Error(payload.error);
    if (typeof payload.text === 'string') question += payload.text;
    if (question.length > 12000) throw new Error('Question was too long. Please retry.');
  };
  try {
    while (!complete) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) consume(line);
      if (done) { consume(buffer); break; }
    }
    if (!complete || !question.trim()) throw new Error('Question interrupted. Retry the saved request.');
    return question.trim();
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export async function requestBuddyEvaluation(session, profile, signal, fetcher = fetch) {
  const { options } = buildTechBuddyRequest(session.level);
  const response = await fetcher('/api/evaluate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ question: session.current.question, answer: session.pending.answer, difficulty: options.difficulty, round: options.roundStrategy, profile, feedbackDepth: 'Detailed explanation' }) });
  await requireSuccess(response);
  const payload = await response.json();
  if (!payload.evaluation || (payload.evaluation.score !== null && (!Number.isFinite(payload.evaluation.score) || payload.evaluation.score < 0 || payload.evaluation.score > 10))) throw new Error('Feedback was incomplete. Retry the saved answer.');
  return payload.evaluation;
}
