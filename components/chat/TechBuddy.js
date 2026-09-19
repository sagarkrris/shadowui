import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import MessageContent from './MessageContent';
import { TECH_BUDDY_LEVELS, summarizeTechBuddy } from '../../lib/techBuddy.mjs';
import { useTechBuddySession } from '../../hooks/useTechBuddySession';
import { useTechBuddyMedia } from '../../hooks/useTechBuddyMedia';
import styles from './TechBuddy.module.css';

function FeedbackList({ title, items, empty }) {
  return <div><h4>{title}</h4>{items?.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>{empty}</p>}</div>;
}

export default function TechBuddy({ initialSession, config, profile, onChange, onAttempt, onClose, onConversation, messages = [], history = [] }) {
  const controller = useTechBuddySession({ initialSession, config, profile, onChange, onAttempt, onConversation, messages, history });
  const { session } = controller;
  const isAsk = session.interaction === 'ask';
  const { videoRef, avatarRef, ...media } = useTechBuddyMedia(isAsk ? controller.setAskDraft : controller.setDraft, session.mode === 'demo');
  const [buddyAvatar, setBuddyAvatar] = useState('portrait');
  const [topicDraft, setTopicDraft] = useState(session.topic);
  const [candidateAvatar, setCandidateAvatar] = useState('👤');
  const answerRef = useRef(null);
  const summaryRef = useRef(null);
  const speakFirstQuestion = useRef(false);
  const previousQuestionId = useRef(session.current?.id);
  const speakRef = useRef(media.speak);
  const busy = ['loading', 'evaluating'].includes(session.phase);
  const complete = session.phase === 'complete';
  const summary = summarizeTechBuddy(session);
  const lastTurn = session.turns.at(-1);
  const currentQuestionId = session.current?.id;
  const currentQuestionText = session.current?.question;
  const canAnswer = session.phase === 'question';
  const canAsk = ['idle', 'review'].includes(session.phase) && !session.pending;
  const { stopAll } = media;
  useEffect(() => {
    if (complete) { stopAll(); summaryRef.current?.focus(); }
  }, [complete, stopAll]);
  useEffect(() => { speakRef.current = media.speak; }, [media.speak]);
  useEffect(() => { if (canAnswer || isAsk) answerRef.current?.focus(); }, [canAnswer, isAsk, currentQuestionId]);
  useEffect(() => {
    if (!speakFirstQuestion.current || !currentQuestionText || currentQuestionId === previousQuestionId.current) return;
    speakFirstQuestion.current = false;
    previousQuestionId.current = currentQuestionId;
    speakRef.current(currentQuestionText);
  }, [currentQuestionId, currentQuestionText]);

  const configure = changes => { media.stopAll(); controller.configure(changes); };
  const startInterview = () => {
    speakFirstQuestion.current = true;
    media.stopSpeech();
    controller.ask();
  };
  const submit = event => {
    event.preventDefault();
    event.stopPropagation();
    if (busy || complete || (!isAsk && !canAnswer)) return;
    const answer = media.listening ? media.stopRecognition() : isAsk ? session.askDraft : session.draft;
    media.stopSpeech();
    if (isAsk) controller.converse(answer.slice(0, 10000)); else controller.submit(answer);
  };
  const status = session.phase === 'loading' ? session.pending?.kind === 'dialogue' ? 'Preparing your explanation…' : 'Preparing your next question…'
    : session.phase === 'evaluating' ? 'Evaluating your answer…'
    : complete ? 'Session complete.'
    : media.listening ? 'Listening. Stop to edit, or submit your answer.'
    : session.phase === 'error' ? session.error
    : isAsk ? 'Ask a question about your topic, code, or interview preparation.'
    : session.phase === 'review' ? 'Feedback ready. Try this question again or continue.' : canAnswer ? 'Your turn. Type or speak your answer.' : 'Choose your level and start.';

  return (
    <section className={styles.buddy} aria-label="Tech Buddy interview">
      <header className={styles.header}>
        <div><h2>Tech Buddy</h2><p>{session.mode === 'demo' ? 'Offline Java practice · 36 built-in questions · no AI feedback' : 'Interview practice and two-way Q&A · powered by Gemini'}</p>{session.topic && <p>Topic: <strong>{session.topic}</strong></p>}</div>
        {onClose && <button onClick={() => { media.stopAll(); onClose(session); }}>Back to conversation</button>}
      </header>
      <div className={styles.controls}>
        {session.mode !== 'demo' && <label>Conversation mode <select aria-label="Conversation mode" value={session.interaction} disabled={busy || Boolean(session.pending) || complete} onChange={event => { media.stopAll(); controller.setInteraction(event.target.value); }}><option value="interview">Interview me</option><option value="ask">Ask Buddy</option></select></label>}
        <label>Interview level <select aria-label="Tech Buddy level" value={session.level} disabled={busy} onChange={event => configure({ level: event.target.value })}>
          {TECH_BUDDY_LEVELS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select></label>
        {config?.mode !== 'demo' && <label>Session type <select aria-label="Session type" value={session.mode} disabled={busy} onChange={event => configure({ mode: event.target.value, targetQuestions: event.target.value === 'warmup' ? 5 : 0 })}><option value="practice">Open practice</option><option value="warmup">Five-question warm-up</option></select></label>}
      </div>
      {session.mode !== 'demo' && <div className={styles.controls}>
        <label>Practice topic <input aria-label="Practice topic" value={topicDraft} maxLength={180} disabled={busy} onChange={event => setTopicDraft(event.target.value)} /></label>
        <button disabled={busy || topicDraft.trim() === session.topic} onClick={() => configure({ topic: topicDraft.trim() })}>Apply topic</button>
        <label>Session length <select aria-label="Session length" value={session.targetQuestions} disabled={busy} onChange={event => configure({ targetQuestions: Number(event.target.value) })}>{[0, 3, 5, 10, 15, 20, 30, 50, 100].map(count => <option key={count} value={count}>{count ? `${count} questions` : 'Unlimited'}</option>)}</select></label>
      </div>}
      <p className={styles.status}>{session.mode === 'demo' ? 'Changing level clears this demo session. Demo answers are not saved.' : 'Changing topic, level, length, or session type starts a fresh session. Completed answers remain in practice history.'}</p>
      <p role="status" aria-live="polite" aria-atomic="true">{status}</p>
      {media.narration && <details><summary>Spoken explanation</summary><p>{media.narration}</p></details>}
      {media.speaking && <button onClick={media.stopSpeech}>Stop spoken response</button>}
      {media.notice && <p role="status">{media.notice}</p>}
      {session.targetQuestions > 0 && <p aria-label={session.mode === 'warmup' ? 'Warm-up progress' : 'Session progress'}>{summary.completed} of {session.targetQuestions} questions completed. Retrying a question does not advance the count.</p>}
      {!complete && <div className={styles.controls}>
        <button hidden={isAsk} disabled={!canAsk || media.listening} onClick={session.current ? () => { media.stopSpeech(); controller.ask(); } : startInterview}>{session.current ? 'Next Buddy question' : 'Start Buddy interview'}</button>
        <button hidden={isAsk} disabled={!session.current || busy || media.listening} aria-pressed={media.speaking} onClick={() => media.speaking ? media.stopSpeech() : media.speak(session.current.question)}>{media.speaking ? 'Stop reading' : 'Read question aloud'}</button>
        {!isAsk && session.mode !== 'demo' && <><button disabled={!canAnswer || busy || media.listening} onClick={() => { media.stopSpeech(); controller.converse('Give me a hint', true); }}>Give me a hint</button><button disabled={!canAsk || !lastTurn} onClick={() => { media.stopSpeech(); controller.ask('followup'); }}>Deeper follow-up</button><button disabled={!canAsk || !history.length && !session.turns.length} onClick={() => { media.stopSpeech(); controller.ask('revisit'); }}>Revisit a gap</button></>}
        <button onClick={() => { media.stopAll(); controller.end(); }}>End session</button>
        {busy && <button onClick={controller.stop}>Stop request</button>}
        {session.phase === 'error' && <button onClick={controller.retry}>Retry Buddy request</button>}
      </div>}
      <div className={styles.stage}>
        <article className={styles.tile} aria-label="Interviewer question">
          <h3><span aria-hidden="true">{buddyAvatar === 'portrait' ? '' : buddyAvatar}</span> Tech Buddy <small>Interviewer</small></h3>
          <label className={styles.status}>Interviewer avatar <select aria-label="Interviewer avatar" value={buddyAvatar} onChange={event => setBuddyAvatar(event.target.value)}><option value="portrait">Indian-presenting interviewer</option><option value="🤖">Robot</option><option value="🦉">Owl</option><option value="🧑‍🏫">Teacher</option></select></label>
          {buddyAvatar === 'portrait' && media.avatarStatus !== 'connected' && <figure className={styles.portrait}>
            <Image src="/avatars/tech-buddy-interviewer.png" width={1254} height={1254} unoptimized alt="Fictional Indian-presenting interviewer seated at a desk" />
            <figcaption>AI-generated portrait · static preview</figcaption>
          </figure>}
          <div ref={avatarRef} className={styles.liveAvatar} hidden={media.avatarStatus !== 'connected'} />
          {session.mode !== 'demo' && <div className={styles.controls}>
            <label>Speech voice <select aria-label="Speech voice" disabled={media.avatarStatus !== 'off'} value={media.speechMode} onChange={event => media.setSpeechMode(event.target.value)}><option value="gemini">Natural Indian English · Gemini</option><option value="device">Device voice</option></select></label>
            <button disabled={complete || media.avatarStatus === 'connecting'} onClick={media.connectAvatar}>{media.avatarStatus === 'connecting' ? 'Connecting interviewer…' : media.avatarStatus === 'connected' ? 'Disconnect live interviewer' : 'Connect live interviewer'}</button>
            <p className={styles.status}>Live animation uses the configured provider avatar and shares spoken responses with LiveAvatar. Your camera stays local. Reduced motion: use the static portrait by disconnecting.</p>
          </div>}
          <p className={styles.presence} data-speaking={media.speechActive} role="status">{complete ? 'Session ended' : media.speechActive ? 'Speaking' : media.speaking ? 'Preparing speech…' : media.listening ? 'Listening to your answer' : busy ? 'Considering your session' : 'Ready to practise'}</p>
          <p className={styles.status}>{media.speechMode === 'gemini' ? 'Natural Indian English · Gemini audio' : `Voice: ${media.voiceLabel}. Voice quality depends on your device.`}</p>
          {session.current ? <MessageContent content={session.current.question} /> : <p>Choose a level and start your interview.</p>}
        </article>
        <article className={styles.tile}>
          <h3><span aria-hidden="true">{candidateAvatar}</span> You <small>Candidate</small></h3>
          <label className={styles.status}>Your avatar <select aria-label="Your avatar" value={candidateAvatar} onChange={event => setCandidateAvatar(event.target.value)}><option value="👤">Person</option><option value="🦊">Fox</option><option value="🐼">Panda</option></select></label>
          {media.cameraOn && <video ref={videoRef} autoPlay playsInline muted aria-label="Your camera preview" />}
          <p className={styles.answer}>{(isAsk ? session.askDraft : session.pending?.answer || (canAnswer ? session.draft : lastTurn?.answer)) || (isAsk ? 'Ask about a concept, paste code, or request an example.' : 'Your answer will appear here.')}</p>
          {!complete && <div className={styles.controls}>
            <button aria-pressed={media.cameraOn} disabled={media.cameraPending} onClick={media.camera}>{media.cameraPending ? 'Opening camera…' : media.cameraOn ? 'Turn camera off' : 'Turn camera on'}</button>
            <button disabled={busy || complete || Boolean(session.pending) || (!isAsk && !canAnswer)} aria-pressed={media.listening} onClick={() => media.listen(isAsk ? session.askDraft : session.draft)}>{media.listening ? 'Stop listening' : isAsk ? 'Speak question' : 'Speak answer'}</button>
          </div>}
          <p className={styles.status}>Camera preview stays on this device. Speech recognition may use your browser’s speech service. Review the transcript before submitting.</p>
        </article>
      </div>
      {!complete && <form onSubmit={submit} className={styles.form}>
        <label htmlFor="buddy-answer">{isAsk ? "Your question for Buddy" : "Your interview answer"}</label>
        <textarea id="buddy-answer" ref={answerRef} value={isAsk ? session.askDraft : session.draft} maxLength={isAsk ? 10000 : 12000} disabled={busy || Boolean(session.pending) || (!isAsk && !canAnswer) || media.listening} onChange={event => isAsk ? controller.setAskDraft(event.target.value) : controller.setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) submit(event); }} rows={5} aria-describedby="buddy-answer-help" />
        <p id="buddy-answer-help" className={styles.status}>Ctrl/⌘ + Enter submits. Stop listening to edit your transcript.</p>
        <button type="submit" disabled={busy || Boolean(session.pending) || (isAsk ? !session.askDraft.trim() : !canAnswer || !session.draft.trim())}>{isAsk ? "Ask Buddy" : "Submit answer"}</button>
      </form>}
      {(messages.length > 0 || session.dialogue.length > 0) && <section className={styles.tile} aria-label="Buddy conversation">
        <h3>Conversation</h3>
        {(messages.length ? messages : session.dialogue).slice(-30).map((message, index) => <article key={message.id || index} className={styles.message}>
          <strong>{message.role === 'user' ? 'You' : 'Tech Buddy'}</strong>
          <MessageContent content={message.content} />
          {message.role === 'assistant' && <button disabled={busy || media.listening} onClick={() => media.speak(message.content, true)}>Speak concise explanation</button>}
        </article>)}
      </section>}
      {lastTurn && (session.phase === 'review' || complete) && <article className={styles.tile} aria-label="Tech Buddy feedback">
        <h3>Feedback · {lastTurn.score == null ? 'Not assessed' : `${lastTurn.score}/10`}</h3>
        <p><strong>Question:</strong> {lastTurn.question}</p>
        <p className={styles.answer}><strong>Your answer:</strong> {lastTurn.answer}</p>
        {session.mode === 'demo' ? <p>{lastTurn.feedback}</p> : <>
          <FeedbackList title="Strengths" items={lastTurn.strengths} empty="No specific strength established." />
          <FeedbackList title="Gaps" items={lastTurn.gaps} empty="No specific gap identified." />
          <FeedbackList title="Next steps" items={lastTurn.recommendations} empty="Try explaining the answer with a concrete example." />
          {lastTurn.followUp && <p><strong>Follow-up:</strong> {lastTurn.followUp}</p>}
        </>}
        <button disabled={media.listening} onClick={() => media.speak(lastTurn.feedback, true)}>Speak feedback</button>
        {!complete && <button onClick={() => { media.stopSpeech(); controller.again(); }}>Try this question again</button>}
      </article>}
      {complete && <section ref={summaryRef} tabIndex={-1} className={styles.tile} aria-label="Tech Buddy session summary">
        <h3>Session summary</h3>
        {session.dialogue.length > 0 && <p>{session.dialogue.length / 2} Q&A or hint exchanges · unscored</p>}
        <p>{summary.completed} questions completed · {summary.attempts} attempts · {summary.average == null ? 'Not assessed' : `${summary.average}/10 average`}</p>
        <p className={styles.status}>{session.mode === 'demo' ? 'This demo does not assess or score your answers.' : 'The average uses your latest attempt for each question. It is practice feedback, not an interview prediction.'}</p>
        {session.draft && <details><summary>Unfinished answer (not scored)</summary><p className={styles.answer}>{session.draft}</p></details>}
        {session.mode !== 'demo' && <><FeedbackList title="Session strengths" items={summary.strengths} empty="No assessed strengths yet." /><FeedbackList title="Topics to revisit" items={summary.gaps} empty="No assessed gaps yet." /></>}
        <ol>{summary.latest.map(turn => <li key={turn.questionId}>{turn.question} — {turn.score == null ? 'Not assessed' : `${turn.score}/10`}</li>)}</ol>
        <button onClick={() => media.speak(`${summary.completed} questions completed. ${summary.average == null ? 'Answers were not assessed.' : `Average score ${summary.average} out of ten.`} Topics to revisit: ${summary.gaps.join('. ') || 'No assessed gaps yet.'}`, true)}>Read session summary</button>
        <button onClick={() => configure({})}>Start new session</button>
      </section>}
    </section>
  );
}
