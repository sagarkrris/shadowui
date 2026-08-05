import { useCallback, useState } from "react";
import { createInterviewSession, normalizeInterviewSession, startInterviewQuestion, submitInterviewAnswer, addInterviewFollowUp, scoreInterviewTurn, reviewInterviewTurn, completeInterviewSession } from "../lib/interviewSession.mjs";

export function useInterviewSession(initial = {}) {
  const [session, setSession] = useState(() => normalizeInterviewSession(initial.id ? initial : createInterviewSession(initial)));
  const update = useCallback((operation) => setSession((current) => operation(current)), []);
  return {
    session,
    startQuestion: useCallback((question) => update((current) => startInterviewQuestion(current, question)), [update]),
    submitAnswer: useCallback((answer) => update((current) => submitInterviewAnswer(current, answer)), [update]),
    addFollowUp: useCallback((followUp) => update((current) => addInterviewFollowUp(current, followUp)), [update]),
    score: useCallback((score) => update((current) => scoreInterviewTurn(current, score)), [update]),
    review: useCallback((review) => update((current) => reviewInterviewTurn(current, review)), [update]),
    complete: useCallback(() => update(completeInterviewSession), [update]),
    reset: useCallback((value = {}) => setSession(createInterviewSession(value)), []),
  };
}
