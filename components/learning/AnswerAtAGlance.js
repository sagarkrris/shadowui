import React from "react";
import styles from "./AnswerAtAGlance.module.css";
import { tokenizeJava } from "../../lib/learningCode.mjs";

export function LearningCode({ code, language = "java", label = "Source example" }) {
  const tokens = language === "java" ? tokenizeJava(code) : [{ text: code }];
  return <pre className={styles.code} tabIndex={0} aria-label={label}><code>{tokens.map((token, index) => token.kind
    ? <span key={index} className={styles[token.kind]}>{token.text}</span>
    : token.text)}</code></pre>;
}

// Only display supplied lesson content. Category-wide prompts are not answers.
export default function AnswerAtAGlance({ takeaway, title = "Answer in 30 seconds", compact = false, example, exampleCode,
  exampleLanguage = "java", exampleNote, commands = [], output, why, failure,
  complexity, tradeoff, edgeCases, note, followUp, exampleId, outputId }) {
  const normalize = value => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value;
  const seen = new Set([normalize(takeaway)].filter(Boolean));
  const unique = value => {
    const key = normalize(value);
    if (!key || seen.has(key)) return null;
    seen.add(key);
    return value;
  };
  const mechanism = unique(why);
  const illustration = unique(example);
  const mistakes = unique(failure);
  const depth = [["Trade-offs and verification", complexity || tradeoff], ["Boundary cases", edgeCases], ["Interview follow-up", followUp]]
    .map(([label, text]) => [label, unique(text)]).filter(([, text]) => text);
  return (
    <aside aria-label="Answer at a glance" className={`answer-at-a-glance ${styles.root} ${compact ? styles.compact : ""}`}>
      <div className={styles.eyebrow}>{title}</div>
      {takeaway && <p className={styles.takeaway}>{takeaway}</p>}
      {note && <p className={styles.note}>{note}</p>}
      {mechanism && <section><h3>How it works</h3><p>{mechanism}</p></section>}
      {(illustration || exampleCode) && <section id={exampleId} className={styles.example}>
        <h3>{exampleId ? "Example" : "Worked example"}</h3>
        {illustration && <p>{illustration}</p>}
        {exampleNote && <p className={styles.note}>{exampleNote}</p>}
        {exampleCode && <LearningCode code={exampleCode} language={exampleLanguage} />}
      </section>}
      {commands.map(({ label, code }) => <section key={label}><h3>{label}</h3><LearningCode code={code} language="shell" label={label} /></section>)}
      {output && <section id={outputId}><h3>Expected result</h3><p className={styles.output}>{output}</p></section>}
      {mistakes && <section><h3>Common misconceptions and failure cases</h3><p>{mistakes}</p></section>}
      {depth.length > 0 && <details className={styles.depth}><summary>Go deeper</summary>
        {depth.map(([label, text]) => <section key={label}><h3>{label}</h3><p>{text}</p></section>)}
      </details>}
    </aside>
  );
}
