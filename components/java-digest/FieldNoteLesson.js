import Link from "next/link";
import { useState } from "react";

const card = { minWidth: 0, border: "1px solid var(--jd-border)", borderRadius: 8, padding: 12, background: "var(--jd-surface-subtle)" };

export default function FieldNoteLesson({ blog, learningProgress, onToggleChapter }) {
  const [choice, setChoice] = useState(null);
  return <>
    <p><Link href={`/tech-blogs/${blog.id}`}>Open the article, runnable example, and references →</Link></p>
    <section style={card}><h3>2-minute overview</h3><p>{blog.overview}</p><h4>Verification scope</h4><p>{blog.scope}</p></section>
    <section aria-label="Annotated event timeline" style={card}>
      <h3>Follow the annotated trace</h3>
      <p>Fictional events chosen to isolate the mechanism; times and positions are illustrative.</p>
      <ol style={{ margin: 0, paddingLeft: 24 }}>
        {blog.trace.map(([time, event, meaning]) => <li key={time} style={{ borderLeft: "2px solid var(--jd-border-strong)", padding: "8px 12px" }}><strong>{time} — {event}</strong><p style={{ margin: "6px 0" }}>{meaning}</p></li>)}
      </ol>
    </section>
    <h3>Deep explanation · {blog.chapters.length} chapters</h3>
    {blog.chapters.map(chapter => {
      const chapterId = `${blog.id}-chapter-${chapter.order}`;
      const completed = learningProgress.completedIds.has(chapterId);
      return <article key={chapter.order} style={card}>
        <h3>{chapter.title}</h3><p>{chapter.lesson}</p>
        <pre aria-label={`Example for ${chapter.title}`} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "12px 0", color: "var(--jd-code-text)" }}>{chapter.example}</pre>
        <p><strong>Exercise:</strong> {chapter.exercise}</p>
        <button type="button" className="glass-button" onClick={() => onToggleChapter(chapterId)}>{completed ? "Chapter completed" : "Mark chapter complete"}</button>
      </article>;
    })}
    <section style={card}>
      <h3>Self-check</h3>
      <fieldset><legend>{blog.misconception.question}</legend>
        {blog.misconception.options.map((option, index) => <label key={option} style={{ display: "block", margin: "10px 0" }}><input type="radio" name={`${blog.id}-misconception`} checked={choice === index} onChange={() => setChoice(index)} /> {option}</label>)}
      </fieldset>
      {choice !== null && <p role="status">{blog.misconception.feedback[choice]}</p>}
      <details><summary>Sample answer</summary><p>{blog.misconception.options[blog.misconception.correct]}</p><p>{blog.misconception.feedback[blog.misconception.correct]}</p></details>
    </section>
    <section style={card}><h3>Interview checkpoint</h3><ul>{blog.interviewQuestions.map(question => <li key={question}>{question}</li>)}</ul></section>
  </>;
}
