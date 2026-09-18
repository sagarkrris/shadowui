import { useState } from 'react';
import { BEGINNER_PATHS } from '../../lib/aiBeginnerPaths.mjs';
import { runRagPlayground } from '../../lib/ragPlayground.mjs';

const card = { border: '1px solid rgba(127,127,127,.25)', borderRadius: 8, padding: 16, minWidth: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, overflowWrap: 'anywhere' };
const field = { background: 'rgba(127,127,127,.08)', color: 'inherit', border: '1px solid #64748b', borderRadius: 6, padding: 10, maxWidth: '100%', boxSizing: 'border-box' };
const button = { padding: '8px 12px', margin: '8px 8px 8px 0' };

function BeginnerLesson({ lesson, theme }) {
  const [choice, setChoice] = useState(null);
  const [checked, setChecked] = useState(false);
  return <article aria-label={lesson.title}>
    <h3>{lesson.title}</h3><p><strong>By the end:</strong> {lesson.objective}</p>
    <h4>Understand the idea</h4><p>{lesson.explanation}</p>
    <h4>Worked example</h4><p>{lesson.example}</p>
    <h4>Try it yourself</h4><p>{lesson.exercise}</p>
    <details><summary style={{ color: theme.accentText, cursor: 'pointer' }}>Show exercise solution</summary><p>{lesson.solution}</p></details>
    <p><strong>Common mistake:</strong> {lesson.pitfall}</p>
    <fieldset style={card}><legend>Check your understanding</legend>
      <p>{lesson.quiz.question}</p>
      {lesson.quiz.options.map((option, index) => <label key={option} style={{ display: 'block', margin: '8px 0' }}><input type="radio" name={`quiz-${lesson.id}`} checked={choice === index} onChange={() => { setChoice(index); setChecked(false); }} /> {option}</label>)}
      <button type="button" className="glass-button" style={button} disabled={choice === null} onClick={() => setChecked(true)}>Check answer</button>
      {checked && <p role="status"><strong>{choice === lesson.quiz.correct ? 'Correct.' : 'Not quite.'}</strong> {lesson.quiz.explanation}</p>}
    </fieldset>
    <details><summary style={{ color: theme.accentText, cursor: 'pointer' }}>Interview practice: {lesson.interview}</summary><p>{lesson.answer}</p></details>
  </article>;
}

function LearningPath({ path, theme }) {
  const [index, setIndex] = useState(0);
  const lesson = path.lessons[index];
  return <section id={`beginner-${path.id}`} aria-label={path.title} className="glass-card" style={card}>
    <h2 style={{ color: theme.accentText }}>{path.title}</h2>
    <p>{path.prerequisite}</p><p><strong>Outcome:</strong> {path.outcome}</p>
    <p>Six beginner lessons. Allow about 30–45 minutes per lesson including the exercise; this is a study suggestion. Answers and selections reset when you change lessons or leave the course.</p>
    <label htmlFor={`lesson-${path.id}`}>Choose a lesson </label>
    <select id={`lesson-${path.id}`} value={index} onChange={event => setIndex(Number(event.target.value))} style={{ ...field, width: '100%' }}>
      {path.lessons.map((item, lessonIndex) => <option key={item.id} value={lessonIndex}>{item.title}</option>)}
    </select>
    <BeginnerLesson key={lesson.id} lesson={lesson} theme={theme} />
    <nav aria-label={`${path.title} lesson navigation`}>
      <button type="button" className="glass-button" style={button} disabled={index === 0} onClick={() => setIndex(value => value - 1)}>Previous lesson</button>
      <span>Lesson {index + 1} of {path.lessons.length}</span>
      <button type="button" className="glass-button" style={button} disabled={index === path.lessons.length - 1} onClick={() => setIndex(value => value + 1)}>Next lesson</button>
    </nav>
    {path.id === 'genai' ? <a href="#beginner-rag" style={{ color: theme.accentText }}>Continue with RAG from Scratch</a> : <a href="#rag-playground" style={{ color: theme.accentText }}>Open the RAG playground</a>}
  </section>;
}

export function RagPlayground({ theme }) {
  const [query, setQuery] = useState('password reset');
  const [topK, setTopK] = useState(2);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const clear = () => { setResult(null); setError(''); };
  const run = event => {
    event.preventDefault();
    try { setResult(runRagPlayground(query, topK)); setError(''); }
    catch (failure) { setResult(null); setError(failure.message); }
  };
  return <section id="rag-playground" aria-label="RAG playground" className="glass-card" style={card}>
    <h2 style={{ color: theme.accentText }}>RAG playground: inspect every step</h2>
    <p>Three fictional help-center sources → paragraph chunks → word-count vectors → cosine ranking → context → cited excerpts.</p>
    <p>This is a local lexical simulation, not learned semantic embeddings or LLM generation. No API key or network request is needed. It returns source excerpts to make the evidence visible; positive similarity alone does not prove that a question is answered. Ambiguous questions need clarification in a real assistant.</p>
    <div aria-label="Example queries">{[
      ['Password example', 'password reset'], ['API example', 'api token'], ['Support example', 'support hours'],
      ['Unknown-topic example', 'refund policy'], ['Paraphrase example', 'credentials renewal'], ['Shared-term example', 'token'],
    ].map(([label, value]) => <button type="button" key={label} className="glass-button" style={button} onClick={() => { setQuery(value); clear(); }}>{label}</button>)}</div>
    <form onSubmit={run}>
      <label htmlFor="rag-query">Your question (maximum 500 characters)</label>
      <input id="rag-query" maxLength={500} value={query} onChange={event => { setQuery(event.target.value); clear(); }} style={{ ...field, width: '100%', display: 'block' }} />
      <label htmlFor="rag-top-k">Top-k </label>
      <select id="rag-top-k" value={topK} onChange={event => { setTopK(Number(event.target.value)); clear(); }} style={field}>{[1, 2, 3].map(value => <option key={value}>{value}</option>)}</select>
      <button type="submit" className="glass-button" style={button} disabled={!query.trim()}>Run retrieval</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div aria-label="Retrieval result">
      <h3>1. Ingest and chunk</h3><ol>{result.chunks.map(chunk => <li key={chunk.id}><strong>{chunk.id} · {chunk.title}</strong><p>{chunk.text}</p></li>)}</ol>
      <h3>2. Represent the question</h3><p>Lowercase words, remove a small stop-word list, and count terms in a vocabulary built from the source chunks. These terms are not LLM tokens. Unknown words have no vector coordinate in this demo.</p>
      <details><summary>Inspect vocabulary and query vector</summary><pre style={{ ...field, overflowX: 'auto', whiteSpace: 'pre-wrap' }}><code>{JSON.stringify({ vocabulary: result.vocabulary, queryVector: result.queryVector }, null, 2)}</code></pre></details>
      <h3>3. Rank candidate chunks</h3>
      <ul>{result.ranked.map(chunk => <li key={chunk.id}>{chunk.id}: cosine {chunk.score.toFixed(3)} · {result.selected.some(item => item.id === chunk.id) ? 'selected' : 'not selected'}<details><summary>Inspect {chunk.id} vector</summary><code style={{ overflowWrap: 'anywhere' }}>{JSON.stringify(chunk.vector)}</code></details></li>)}</ul>
      <p>Only scores above zero are selected, up to top-k. Zero is a teaching rule here, not a recommended production relevance threshold.</p>
      <h3>4. Assemble context</h3><details><summary>Inspect the context packet</summary><pre style={{ ...field, overflowX: 'auto', whiteSpace: 'pre-wrap' }}><code>{JSON.stringify(result.context, null, 2)}</code></pre></details>
      <h3>5. Return cited evidence or abstain</h3><p role="status" style={{ whiteSpace: 'pre-wrap' }}>{result.answer}</p>
      <p><strong>What to inspect next:</strong> {result.status === 'abstained' ? 'Is evidence missing, or did exact-word matching miss a paraphrase? A no-match result cannot distinguish these by itself.' : 'Do these passages answer the actual question? Check each claim and clarify ambiguity before using a live generator.'}</p>
    </div>}
    <p>Next coding step: <a href="/course/interviewiq-lab.mjs" download style={{ color: theme.accentText }}>download the existing core lab</a>, run stage 3, and compare its overlap retrieval with the cosine ranking shown here. Both are lexical baselines; neither computes learned embeddings.</p>
    <details><summary>Further reading · reviewed September 18, 2026</summary><ul>
      <li><a href="https://cloud.google.com/use-cases/retrieval-augmented-generation" target="_blank" rel="noreferrer" style={{ color: theme.accentText }}>Google Cloud: What is RAG?</a></li>
      <li><a href="https://www.anthropic.com/engineering/contextual-retrieval" target="_blank" rel="noreferrer" style={{ color: theme.accentText }}>Anthropic: Contextual Retrieval</a> — optional reading after the basics.</li>
    </ul></details>
  </section>;
}

export default function BeginnerCourse({ theme }) {
  return <>
    {BEGINNER_PATHS.map(path => <LearningPath key={path.id} path={path} theme={theme} />)}
    <RagPlayground theme={theme} />
  </>;
}
