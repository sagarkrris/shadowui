import { useState } from "react";
import { trackEvent } from "../../lib/analytics.mjs";

const DEMO_OPTIONS = [
  { id: "logs", label: "Check logs, RED metrics, traces, and the deploy timeline first.", correct: true },
  { id: "rollback", label: "Roll back immediately before looking at any signals.", correct: false },
  { id: "database", label: "Increase the database connection pool and wait for recovery.", correct: false },
];

export default function HomeDemo({ onContinue, onSignIn }) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  const selectedOption = DEMO_OPTIONS.find((option) => option.id === selected);

  const choose = (option) => {
    setSelected(option.id);
    trackEvent("demo_answered", { value: option.correct ? "correct" : "incorrect" });
  };

  return (
    <section className="home-demo" aria-labelledby="home-demo-title">
      <div className="home-demo__intro">
        <span className="home-demo__eyebrow">INTERVIEWIQ · 60-SECOND DEMO</span>
        <h1 id="home-demo-title">See how your next interview rep feels.</h1>
        <p>Answer one realistic question, get an explanation, and then build a prep plan around your gaps.</p>
        <div className="home-demo__steps" aria-label="How InterviewIQ works">
          <span><b>1</b> Answer</span><span><b>2</b> Get feedback</span><span><b>3</b> Keep improving</span>
        </div>
      </div>

      <div className="home-demo__card">
        <div className="home-demo__card-top"><span>JAVA · PRODUCTION DEBUGGING</span><span>01 / 01</span></div>
        <h2>Your Java service’s p99 latency doubled after a release. What do you check first?</h2>
        <div className="home-demo__options" role="radiogroup" aria-label="Demo answer choices">
          {DEMO_OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`home-demo__option${isSelected ? " is-selected" : ""}${answered && option.correct ? " is-correct" : ""}`}
                onClick={() => choose(option)}
              >
                <span className="home-demo__option-marker">{String.fromCharCode(65 + DEMO_OPTIONS.indexOf(option))}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        {answered ? (
          <div className={`home-demo__feedback ${selectedOption.correct ? "is-correct" : "is-incorrect"}`} role="status">
            <strong>{selectedOption.correct ? "Strong first move." : "Good instinct to investigate — start with signals before changing capacity."}</strong>
            <span>InterviewIQ explains the trade-off and gives you a sharper follow-up to practise.</span>
          </div>
        ) : <p className="home-demo__hint">Pick an answer to see the kind of feedback you’ll get.</p>}
        <button type="button" className="home-demo__primary" onClick={() => onContinue({ answered })}>
          {answered ? "Build my personalized plan" : "Skip to the workspace"} <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="home-demo__footer">
        <button type="button" className="home-demo__text-button" onClick={() => onContinue({ skipped: true })}>Skip demo</button>
        <span aria-hidden="true">·</span>
        <button type="button" className="home-demo__text-button" onClick={onSignIn}>Already have an account? Sign in</button>
      </div>
    </section>
  );
}
