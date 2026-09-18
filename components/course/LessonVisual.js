import { useState } from 'react';
import { COURSE_VISUAL_GUIDES, calculateTeachingBudget } from '../../lib/courseVisualGuides.mjs';

const panel = { padding: 16, border: '1px solid #64748b', borderRadius: 10, color: '#e2e8f0', background: 'rgba(127,127,127,.04)', minWidth: 0, fontSize: 14, lineHeight: 1.7, overflowWrap: 'anywhere' };
const button = { padding: '8px 12px', margin: '4px 8px 4px 0', color: '#e2e8f0' };

export default function LessonVisual({ lessonId }) {
  const guide = COURSE_VISUAL_GUIDES[lessonId];
  const [active, setActive] = useState(0);
  if (!guide) return null;
  return <section aria-label={`Visual guide: ${guide.title}`} style={panel}>
    <p style={{ color: '#93c5fd', margin: 0 }}>Picture it first</p>
    <h3 style={{ margin: '4px 0 10px' }}>{guide.title}</h3>
    <p>{guide.story}</p>
    <figure style={{ margin: '16px 0' }}>
      <figcaption>Follow the example. Select a numbered card to focus on its explanation.</figcaption>
      <ol data-visual-steps style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 10, padding: 0, listStyle: 'none' }}>
        {guide.steps.map(([title, detail], index) => <li key={title} style={{ minWidth: 0 }}>
          <button type="button" aria-pressed={active === index} onClick={() => setActive(index)} style={{ ...panel, width: '100%', height: '100%', textAlign: 'left', cursor: 'pointer', border: `2px solid ${active === index ? '#93c5fd' : '#475569'}`, background: active === index ? 'rgba(96,165,250,.12)' : 'rgba(127,127,127,.04)' }}>
            <span style={{ color: '#93c5fd', display: 'block' }}>{index + 1} {index < guide.steps.length - 1 ? '→' : '✓'}</span>
            <strong>{title}</strong><span style={{ display: 'block', marginTop: 8 }}>{detail}</span>
          </button>
        </li>)}
      </ol>
      <p aria-live="polite"><strong>Focus {active + 1}:</strong> {guide.steps[active][1]}</p>
    </figure>
    <p><strong>The idea to keep:</strong> {guide.takeaway}</p>
    {guide.terms && <dl>{guide.terms.map(([term, meaning]) => <div key={term} style={{ marginTop: 8 }}><dt style={{ fontWeight: 700 }}>{term}</dt><dd style={{ marginLeft: 0 }}>{meaning}</dd></div>)}</dl>}
    {guide.question && <details><summary style={{ cursor: 'pointer', color: '#93c5fd' }}>Pause and predict: {guide.question}</summary><p>{guide.answer}</p></details>}
    {lessonId === 'llm-foundations' && <ContextBudget />}
  </section>;
}

function ContextBudget() {
  const [history, setHistory] = useState(1600);
  const [extra, setExtra] = useState(false);
  const { parts, used, remaining } = calculateTeachingBudget(history, extra);
  const colors = ['#60a5fa', '#a78bfa', '#fbbf24', '#34d399', '#fb7185', '#cbd5e1'];
  return <section aria-label="Context budget explorer" style={{ marginTop: 24 }}>
    <h4>Try it: pack an 8,000-token window</h4>
    <p>Think of a box with 8,000 spaces. Input fills some spaces; leave 1,000 for the answer. These are illustrative allocations, not token measurements of the sample sentences.</p>
    <label htmlFor="context-history">Selected history: {history.toLocaleString('en-US')} tokens</label>
    <input id="context-history" type="range" min="0" max="4000" step="100" value={history} onChange={event => setHistory(Number(event.target.value))} style={{ display: 'block', width: '100%' }} />
    <label style={{ display: 'block' }}><input type="checkbox" checked={extra} onChange={event => setExtra(event.target.checked)} /> Add a 1,500-token document</label>
    <div>
      <button type="button" className="glass-button" style={button} onClick={() => { setHistory(3200); setExtra(false); }}>Double baseline history</button>
      <button type="button" className="glass-button" style={button} onClick={() => { setHistory(1000); setExtra(false); }}>Show 20% headroom</button>
      <button type="button" className="glass-button" style={button} onClick={() => { setHistory(1600); setExtra(false); }}>Reset budget</button>
    </div>
    <div aria-hidden="true" style={{ display: 'flex', height: 28, border: '1px solid #94a3b8', borderRadius: 5, overflow: 'hidden', marginTop: 16 }}>
      {parts.map(([label, tokens], index) => <span key={label} style={{ width: `${100 * tokens / Math.max(8000, used)}%`, background: colors[index] }} />)}
    </div>
    <p style={{ fontSize: 12 }}>Bar scale: {Math.max(8000, used).toLocaleString('en-US')} tokens. Empty space is headroom; an overfull budget is shown in full and rejected below.</p>
    <ul>{parts.map(([label, tokens], index) => <li key={label}><span aria-hidden="true" style={{ color: colors[index] }}>■ </span>{label}: {tokens.toLocaleString('en-US')}</li>)}</ul>
    <p role="status"><strong>{remaining < 0 ? `Blocked before generation: ${(-remaining).toLocaleString('en-US')} tokens over capacity.` : `Fits: ${remaining.toLocaleString('en-US')} tokens of headroom.`}</strong><br />8,000 − {used.toLocaleString('en-US')} = {remaining.toLocaleString('en-US')}</p>
    <p>The latest question is included in the fixed 600-token profile/question allocation here. Reduce irrelevant old history, not the current question. For real requests, count the actual question and message overhead with the selected model’s tokenizer.</p>
    <p><strong>What this cannot prove:</strong> A request fitting in the box can still produce a wrong answer. Capacity checking and fact checking solve different problems.</p>
  </section>;
}

export function CourseOrientation() {
  return <section aria-label="How to learn this course" style={panel}>
    <h2>Start with one concrete problem</h2>
    <p>Maya knows Java and asks: “What should I study next?” We will build an app that finds her notes, proposes a supported study plan, checks it, and saves it only after approval.</p>
    <p style={{ color: '#93c5fd' }}>Question → allowed notes → model proposal → application checks → approval → saved plan</p>
    <p>Follow this same example through the course. Read the visual first, explain it in your own words, then try the exercise. You can start without downloading or running anything.</p>
    <ol>
      <li>New to AI? Start with <a href="#beginner-genai">Generative AI for Developers</a>, then <a href="#beginner-rag">RAG from Scratch</a>.</li>
      <li>Try the <a href="#rag-playground">RAG playground</a> to watch evidence selection.</li>
      <li>Use the <a href="#module-llm-foundations">six core modules</a> to build and test the local project.</li>
      <li>Continue to advanced workshops, optional stack ports, and interview practice when you can explain the core flow.</li>
    </ol>
    <p>The model writes a proposal. Ordinary application code controls data access, validation, and saving. The downloaded lab simulates generation so you can learn these boundaries without an account or API key.</p>
  </section>;
}
