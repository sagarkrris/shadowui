import { useCallback, useEffect, useRef, useState } from 'react';
import { createTechBuddySession, normalizeTechBuddySession, transitionTechBuddy, summarizeTechBuddy, buildTechBuddyRequest } from '../lib/techBuddy.mjs';
import { TECH_BUDDY_QUESTIONS } from '../lib/techBuddyQuestions.mjs';
import { requestBuddyQuestion, requestBuddyEvaluation, requestBuddyDialogue } from '../lib/techBuddyClient.mjs';
import { evaluationMarkdown } from '../lib/dailyPractice.mjs';

export function useTechBuddySession({ initialSession, config, profile, onChange, onAttempt, onConversation, messages = [], history = [] }) {
  const [session, setSession] = useState(() => {
    const saved = normalizeTechBuddySession(initialSession);
    const initial = saved || createTechBuddySession({ ...config, id: crypto.randomUUID() });
    return ['loading', 'evaluating'].includes(initial.phase) ? { ...initial, phase: 'error', error: 'Session interrupted. Retry the saved request.' } : initial;
  });
  const state = useRef(session);
  const operation = useRef(null);
  const callbacks = useRef({ onChange, onAttempt, onConversation, messages, history });
  useEffect(() => { callbacks.current = { onChange, onAttempt, onConversation, messages, history }; }, [onChange, onAttempt, onConversation, messages, history]);
  const commit = useCallback(action => {
    const next = transitionTechBuddy(state.current, action);
    state.current = next;
    setSession(next);
    callbacks.current.onChange?.(next);
    return next;
  }, []);

  useEffect(() => () => { operation.current?.abort(); operation.current = null; }, []);

  const run = useCallback(async snapshot => {
    if (operation.current || !snapshot.pending) return;
    const controller = new AbortController();
    operation.current = controller;
    const timeout = setTimeout(() => controller.abort(), 90000);
    const isCurrent = () => operation.current === controller && state.current.id === snapshot.id;
    try {
      snapshot = { ...snapshot, context: callbacks.current.messages, history: callbacks.current.history.filter(turn => turn.buddySessionId !== snapshot.id && (turn.topic === snapshot.topic || turn.lessonTopic === snapshot.topic)) };
      const publish = entries => callbacks.current.onConversation?.(entries.map(entry => ({ ...entry, buddySessionId: snapshot.id })));
      if (snapshot.pending.kind === 'dialogue') {
        const content = await requestBuddyDialogue(snapshot, profile, controller.signal);
        if (isCurrent()) {
          const next = commit({ type: 'replied', id: snapshot.pending.id, content });
          publish(next.dialogue.slice(-2));
        }
      } else if (snapshot.pending.kind === 'question') {
        const question = snapshot.mode === 'demo'
          ? TECH_BUDDY_QUESTIONS[snapshot.level][summarizeTechBuddy(snapshot).completed % 6].question
          : await requestBuddyQuestion(snapshot, profile, controller.signal);
        if (isCurrent()) { commit({ type: 'question', id: snapshot.pending.id, question }); publish([{ id: snapshot.pending.id, role: 'assistant', content: question }]); }
      } else {
        const result = snapshot.mode === 'demo'
          ? { score: null, strengths: [], gaps: [], recommendations: [], feedback: 'Self-practice only. No AI evaluation was requested. Check the accuracy of your answer against the Java documentation, then explain why the approach works and give an example.' }
          : await requestBuddyEvaluation(snapshot, profile, controller.signal);
        if (!isCurrent()) return;
        const { options } = buildTechBuddyRequest(snapshot.level);
        const previous = snapshot.turns.findLast(turn => turn.questionId === snapshot.current.id);
        const turn = { ...result, id: snapshot.pending.id, questionId: snapshot.current.id, parentId: previous?.id, buddySessionId: snapshot.id, question: snapshot.current.question, answer: snapshot.pending.answer, topic: snapshot.topic || 'General interview', lessonTopic: snapshot.topic, difficulty: options.difficulty, round: options.roundStrategy, feedback: result.feedback || evaluationMarkdown(result), rubricVersion: snapshot.mode === 'demo' ? 0 : 1, completedAt: new Date().toISOString() };
        commit({ type: 'evaluated', turn });
        callbacks.current.onAttempt?.(turn);
        publish([{ id: `${turn.id}:answer`, role: 'user', content: turn.answer, attemptId: turn.id }, { id: `${turn.id}:feedback`, role: 'assistant', content: turn.feedback, attemptId: turn.id }]);
      }
    } catch (error) {
      if (isCurrent()) commit({ type: 'failure', message: error.name === 'AbortError' ? 'Request stopped. Your answer is saved; retry when ready.' : error.message });
    } finally {
      clearTimeout(timeout);
      if (operation.current === controller) operation.current = null;
    }
  }, [commit, profile]);

  const start = useCallback((action) => {
    if (operation.current) return;
    const previous = state.current;
    const next = commit(action);
    if (next !== previous && next.pending) void run(next);
  }, [commit, run]);

  const end = useCallback(() => {
    operation.current?.abort();
    operation.current = null;
    commit({ type: 'end' });
  }, [commit]);

  return {
    session,
    ask: intent => start({ type: 'ask', intent, id: crypto.randomUUID() }),
    converse: (text, hint = false) => start({ type: 'dialogue', text, hint, id: crypto.randomUUID() }),
    setInteraction: value => commit({ type: 'interaction', value }),
    setAskDraft: value => commit({ type: 'askDraft', value }),
    submit: answer => start({ type: 'submit', answer, id: crypto.randomUUID() }),
    retry: () => start({ type: 'retry' }),
    again: () => commit({ type: 'again' }),
    setDraft: value => commit({ type: 'draft', value }),
    configure: value => { if (!operation.current) commit({ type: 'configure', config: value, id: crypto.randomUUID() }); },
    stop: () => operation.current?.abort(),
    end,
  };
}
