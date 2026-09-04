import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import {
  CSES_JAVA_PARTS,
  FRESHER_DSA_GLOSSARY,
  FRESHER_DSA_PLAYBOOK,
  JAVA_DIGEST_ROADMAPS,
  JAVA_DIGEST_TRACKS,
  JAVA_DIGEST_ARTICLES,
  JAVA_DIGEST_VERSION,
  JAVA_SPRING_STUDY_PATHS,
  JAVA_QUICK_REFERENCE,
  JAVA_INTERVIEW_QA,
  JAVA_PRODUCTION_GLOSSARY,
  JAVA_PRODUCTION_SCENARIOS,
  JAVA_CURATED_TUTORIAL_CATALOG,
  JAVA_VERSION_TOPIC_GUIDE,
  JAVA_PROGRAM_EXAMPLES,
  JAVA_QUIZ_BANK,
  buildJavaDigestCompetencySummary,
  buildCsesJavaPracticePrompt,
  buildJavaDigestGeneratedTopicPrompt,
  buildJavaDigestCoachPrompt,
  buildJavaDigestMockPrompt,
  buildJavaDigestRoadmapPrompt,
  getCsesJavaChapterDetail,
  getJavaDigestTrack,
  listJavaDigestArticles,
} from "../../lib/javaDigest.mjs";
import BeginnerGuideBanner from "../BeginnerGuideBanner";
import AnswerAtAGlance from "../learning/AnswerAtAGlance";
import MessageContent from "../chat/MessageContent";
import useJavaDigestProgress from "./useJavaDigestProgress";
import JavaDigestTutorialCard from "./JavaDigestTutorialCard";
import JavaDigestReviewQueue from "./JavaDigestReviewQueue";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const responsiveGrid = (minColumnWidth, gap = 10) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

const VIEW_METADATA = {
  "Production Scenarios": {
    title: "Production Scenario Interviews",
    description: "Practice end-to-end incident reasoning: impact, triage, evidence, mitigation, root cause, prevention, and STAR communication.",
  },
  "Interview Q&A": {
    title: "Java Interview Q&A",
    description: "Detailed internal-mechanics answers, when-to-use comparisons, and STAR stories for Java and multithreading interviews.",
  },
  "Java Curriculum": {
    title: "Competitive Programming in Java",
    description: "A complete Java practice curriculum for algorithms, data structures, graphs, and advanced topics.",
  },
  "Senior Refresher": {
    title: "Senior Java Interview Refresher",
    description: "Practice Java 21, JVM, concurrency, architecture, and production judgement.",
  },
  "Java + Spring": {
    title: "Java + Spring Study Path",
    description: "Original learning material for robust Java, Spring Framework, and production Spring Boot development.",
  },
  "Quick Reference": {
    title: "Java + Spring Quick Reference",
    description: "Short revision sheets and self-check questions for daily recall.",
  },
  "Tutorial Library": {
    title: "Java Tutorial Library",
    description: "An original, searchable catalog spanning core Java, modern releases, concurrency, data, Spring, and Spring Boot.",
  },
  "Practice Lab": {
    title: "Java Programs + Quizzes",
    description: "Short implementation prompts and self-check questions for deliberate practice.",
  },
  "Saved & Review": {
    title: "Saved Learning and Review Queue",
    description: "Return to bookmarked material and spaced-repetition reviews without losing your place.",
  },
  Search: {
    title: "Java Interview Topic Search",
    description: "Generate a focused explanation for any Java, backend, or DSA topic.",
  },
  Articles: {
    title: "Java Interview Articles",
    description: "Open one focused lesson at a time, then practice its interview drill.",
  },
  Roadmaps: {
    title: "Java Learning Roadmaps",
    description: "Choose a guided plan and expand it when you are ready to see every step.",
  },
};

function ChipButton({ label, icon, active, onClick, accent }) {
  return (
    <button
      type="button"
      className={active ? "glass-button" : ""}
      onClick={onClick}
      aria-label={label}
      style={{
        alignItems: "center",
        background: active ? "var(--jd-accent-surface-strong)" : "var(--jd-surface-sunken)",
        border: `1px solid ${active ? accent : "var(--jd-border)"}`,
        borderRadius: 7,
        color: active ? "var(--jd-text)" : "var(--jd-text-muted)",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 800,
        gap: 6,
        maxWidth: "100%",
        minHeight: 31,
        padding: "7px 10px",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: active ? accent : "var(--jd-text-muted)", fontSize: 14 }} />
      {label}
    </button>
  );
}

function DetailList({ title, icon, items, accent }) {
  return (
    <section style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 8, padding: 10 }}>
      <h4 style={{ ...wrap, alignItems: "center", color: "var(--jd-text)", display: "flex", fontSize: 12, gap: 6, marginBottom: 7 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h4>
      <ul style={{ ...wrap, color: "var(--jd-text-muted)", display: "grid", fontSize: 11.4, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function buildArticleDrill(article) {
  const primaryLearn = article.learn?.[0] || article.summary;
  const trap = article.questions?.[0] || "Explain the hidden trade-off before coding.";
  const followUp = article.questions?.[1] || "How would this change under production constraints?";
  const snippet = article.trackId === "dsa"
    ? "for (int i = 0; i < n; i++) {\n    // update state, prove invariant\n}"
    : "interface ServicePort {\n    Result execute(Command command);\n}";

  return {
    explain: primaryLearn,
    snippet,
    trap,
    followUp,
  };
}

function buildStarFrame(title, context = "") {
  return `Situation: a backend feature involving ${title} had a correctness or operational risk that was not obvious from the happy path. Task: explain the mechanism, choose the right boundary, and apply it without weakening reliability. Action: clarified the invariant and workload, traced the normal and failure paths, implemented the smallest observable change, added focused tests for edge cases and regressions, and measured the relevant latency, throughput, memory, or error signal. Result: the behavior matched the contract, the trade-off was documented, and the team had evidence it would remain safe under production load. ${context}`;
}

function parseStarStory(story = "") {
  const match = String(story).match(/^Situation:\s*(.*?)\s+Task:\s*(.*?)\s+Action:\s*(.*?)\s+Result:\s*(.*)$/s);
  if (!match) return { Situation: story, Task: "", Action: "", Result: "" };
  return { Situation: match[1], Task: match[2], Action: match[3], Result: match[4] };
}

function StarAnswer({ story, accent, label = "STAR answer:", technicalAnswer = "", example = "", actionSteps = [] }) {
  const parts = parseStarStory(story);
  return (
    <section aria-label={label} style={{ borderLeft: `3px solid ${accent}`, display: "grid", gap: 7, paddingLeft: 9 }}>
      <strong style={{ color: accent, fontSize: 10.5, textTransform: "uppercase" }}>{label}</strong>
      <div style={{ color: "var(--jd-text-soft)", display: "grid", fontSize: 11.35, gap: 7, lineHeight: 1.55 }}>
        <div><b style={{ color: accent }}>Situation:</b> {parts.Situation}</div>
        <div><b style={{ color: accent }}>Task:</b> {parts.Task}</div>
        <div><b style={{ color: accent }}>Action:</b> {parts.Action}{actionSteps.length ? <ol style={{ margin: "6px 0 0", paddingLeft: 21 }}>{actionSteps.map((step) => <li key={step}>{step}</li>)}</ol> : null}{technicalAnswer ? <><br /><span style={{ color: "var(--jd-text)" }}><b>Technical approach:</b> {technicalAnswer}</span></> : null}{example ? <pre style={{ background: "var(--jd-surface-sunken)", borderRadius: 6, color: "var(--jd-code-text)", fontSize: 10.8, lineHeight: 1.5, margin: "7px 0 0", overflowX: "auto", padding: 8, whiteSpace: "pre-wrap" }}>{example}</pre> : null}</div>
        <div><b style={{ color: accent }}>Result:</b> {parts.Result}</div>
      </div>
      <span style={{ color: "var(--jd-text-muted)", fontSize: 10.8, lineHeight: 1.4 }}><b style={{ color: "var(--jd-text)" }}>Make it yours:</b> replace the generic context with your system, decision, metric, and learning.</span>
    </section>
  );
}

function StructuredInterviewAnswer({ entry, accent }) {
  return (
    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
      <section style={{ background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 7, padding: 10 }}>
        <strong style={{ color: accent, display: "block", fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase" }}>Short answer</strong>
        <p style={{ color: "var(--jd-text)", fontSize: 12, lineHeight: 1.58, margin: "5px 0 0" }}>{entry.answer}</p>
      </section>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <section style={answerCardStyle}><strong style={answerLabelStyle(accent)}>How it works</strong><p style={answerTextStyle}>{entry.internals}</p></section>
        <section style={answerCardStyle}><strong style={answerLabelStyle("var(--jd-warning)")}>What to watch for</strong><p style={answerTextStyle}>{entry.commonMistakes}</p></section>
        <section style={answerCardStyle}><strong style={answerLabelStyle("var(--jd-accent-alt)")}>Complexity / trade-off</strong><p style={answerTextStyle}>{entry.performanceNotes}</p></section>
      </div>
      <section style={answerCardStyle}><strong style={answerLabelStyle(accent)}>Explain it in this order</strong><ol style={{ color: "var(--jd-text-soft)", fontSize: 11.35, lineHeight: 1.52, margin: "6px 0 0", paddingLeft: 20 }}>{entry.actionSteps.map((step) => <li key={step}>{step}</li>)}</ol></section>
      {entry.example ? <details style={{ ...answerCardStyle, padding: "8px 10px" }}><summary style={{ color: accent, cursor: "pointer", fontSize: 11.2, fontWeight: 850 }}>Show Java example</summary><pre style={{ background: "var(--jd-surface-sunken)", borderRadius: 6, color: "var(--jd-code-text)", fontSize: 10.8, lineHeight: 1.5, margin: "8px 0 0", overflowX: "auto", padding: 8, whiteSpace: "pre-wrap" }}>{entry.example}</pre></details> : null}
      <div style={{ background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 7, color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5, padding: "8px 9px" }}><strong style={{ color: accent }}>Proof to mention:</strong> {entry.expectedOutput}<br /><strong style={{ color: accent }}>How to test:</strong> {entry.testingNotes}</div>
    </div>
  );
}

const answerCardStyle = { background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 7, padding: "9px 10px" };
const answerLabelStyle = (color) => ({ color, display: "block", fontSize: 10.5, textTransform: "uppercase" });
const answerTextStyle = { color: "var(--jd-text-soft)", fontSize: 11.35, lineHeight: 1.52, margin: "5px 0 0" };

function InterviewDrillCard({ article, accent, onAction }) {
  const drill = buildArticleDrill(article);
  const start = () => {
    onAction?.([
      `Run a Java interview drill for: ${article.title}.`,
      `Explain target: ${drill.explain}`,
      `Code snippet to discuss:\n${drill.snippet}`,
      `Trap to test: ${drill.trap}`,
      `Follow-up: ${drill.followUp}`,
      "Ask me to explain first, then ask for code or trade-offs, then score my answer.",
    ].join("\n"), { type: "javaDigestDrillCard", article, drill });
  };

  return (
    <section style={{ ...wrap, background: "var(--jd-surface-sunken)", border: `1px solid ${accent}28`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Interview Drill Card</div>
      <div style={responsiveGrid(170, 8)}>
        <div style={{ border: "1px solid var(--jd-border)", borderRadius: 7, padding: 8 }}>
          <strong style={{ color: accent, display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Explain</strong>
          <span style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.4 }}>{drill.explain}</span>
        </div>
        <div style={{ border: "1px solid var(--jd-border)", borderRadius: 7, padding: 8 }}>
          <strong style={{ color: "var(--jd-warning)", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Trap</strong>
          <span style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.4 }}>{drill.trap}</span>
        </div>
        <div style={{ border: "1px solid var(--jd-border)", borderRadius: 7, padding: 8 }}>
          <strong style={{ color: "var(--jd-accent-alt)", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Follow-up</strong>
          <span style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.4 }}>{drill.followUp}</span>
        </div>
      </div>
      <code style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 7, color: "var(--jd-code-text)", display: "block", fontSize: 11, lineHeight: 1.45, padding: 8, whiteSpace: "pre-wrap" }}>{drill.snippet}</code>
      <button type="button" className="glass-button" onClick={start} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
        <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
        Start Drill Card
      </button>
    </section>
  );
}

function GeneratedAnswerPanel({ answer, error, loading, query, accent, onRetry }) {
  const hasQuery = Boolean(query.trim());

  return (
    <section style={{ ...wrap, background: "var(--jd-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>AI Interview Explainer</div>
          <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>
            {hasQuery ? query : "Search any Java, backend, or DSA topic"}
          </h3>
        </div>
        {loading && (
          <span style={{ border: `1px solid ${accent}44`, borderRadius: 999, color: accent, flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px" }}>
            Generating
          </span>
        )}
      </div>

      {!answer && !error && !loading && (
        <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 12, lineHeight: 1.55 }}>
          Type a topic like interface, deserialization, segment tree, dynamic programming, Spring transactions, or Java memory model, then press Enter.
        </p>
      )}

      {loading && !answer && (
        <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 12, lineHeight: 1.55 }}>
          Building a polished answer with direct explanation, interview framing, examples, traps, follow-ups, and DSA/competitive-programming angles where relevant.
        </p>
      )}

      {answer && (
        <div className="glass-card" style={{ border: "1px solid var(--jd-border)", borderRadius: 8, padding: 12 }}>
          <MessageContent content={answer} />
        </div>
      )}

      {error && (
        <div role="alert" style={{ ...wrap, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", borderRadius: 8, color: "var(--jd-danger-text)", display: "grid", fontSize: 12, gap: 8, lineHeight: 1.45, padding: 10 }}>
          {error}
          {hasQuery && (
            <button type="button" className="glass-button" onClick={onRetry} style={{ border: "1px solid rgba(248,113,113,.32)", borderRadius: 7, color: "var(--jd-danger-text)", fontSize: 11, fontWeight: 900, justifySelf: "start", padding: "7px 10px" }}>
              <i className="ti ti-refresh" style={{ marginRight: 6 }} />
              Retry
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ArticleCard({ article, accent, expanded, onAction, onToggle, previousArticle, nextArticle, onNavigate }) {
  const track = getJavaDigestTrack(article.trackId);
  const beginnerContext = {
    what: `${article.title} is a focused Java/interview concept. Start by understanding the idea before memorizing syntax.`,
    why: `It matters because interviewers expect you to connect ${article.title} to correctness, complexity, maintainability, or production behavior.`,
    where: `You will use it in ${track.label} practice, code reviews, debugging, and interview explanations.`,
  };
  const coach = () => {
    onAction?.(buildJavaDigestCoachPrompt(article.id), { type: "javaDigestCoach", article, track });
  };
  const mock = () => {
    onAction?.(buildJavaDigestMockPrompt(article.id), { type: "javaDigestMock", article, track });
  };

  return (
    <article className={`java-digest-card${expanded ? " is-expanded" : ""}`} style={{ ...wrap, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {track.label} · {article.format}
          </div>
          <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25, marginTop: 4 }}>{article.title}</h3>
        </div>
        <span style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 999, color: "var(--jd-text-soft)", flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: "3px 7px", whiteSpace: "nowrap" }}>
          {article.readMinutes} min
        </span>
      </div>

      <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 12, lineHeight: 1.55 }}>{article.summary}</p>
      {expanded && (
        <div id={`java-digest-article-${article.id}`} style={{ display: "grid", gap: 10 }}>
          <nav aria-label="Table of contents" style={{ ...wrap, background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 7, padding: 9 }}><strong style={{ color: accent, fontSize: 10.5, textTransform: "uppercase" }}>Contents</strong>{[["Overview", "overview"], ["Topics", "topics"], ["Questions", "questions"], ["STAR framing", "star"], ["Practice", "practice"]].map(([label, id]) => <a key={id} href={`#java-digest-${article.id}-${id}`} style={{ color: "var(--jd-text-soft)", fontSize: 10.8 }}>{label}</a>)}</nav>
          <section id={`java-digest-${article.id}-overview`} style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}2f`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <div style={{ color: accent, fontSize: 10.8, fontWeight: 900, textTransform: "uppercase" }}>Beginner Explainer</div>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>What is this?</strong> {beginnerContext.what}</p>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>Why does it matter?</strong> {beginnerContext.why}</p>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>Where is it used?</strong> {beginnerContext.where}</p>
          </section>

          <div id={`java-digest-${article.id}-topics`} style={responsiveGrid(220, 9)}>
            <DetailList title="What To Learn" icon="ti-list-check" items={article.learn} accent={accent} />
            <DetailList title="Interview Questions" icon="ti-message-question" items={article.questions} accent="var(--jd-accent-alt)" />
          </div>

          <section id={`java-digest-${article.id}-star`}><StarAnswer story={buildStarFrame(article.title, article.summary)} accent={accent} label="How to frame it in STAR" /></section>

          <div id={`java-digest-${article.id}-questions`}><div id={`java-digest-${article.id}-practice`}><InterviewDrillCard article={article} accent={accent} onAction={onAction} /></div></div>
          <nav aria-label="Article navigation" style={{ alignItems: "center", borderTop: "1px solid var(--jd-border)", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "space-between", paddingTop: 9 }}>
            <button type="button" className="glass-button" disabled={!previousArticle} onClick={() => onNavigate(previousArticle)} style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 7, color: "var(--jd-text)", fontSize: 10.8, opacity: previousArticle ? 1 : .45, padding: "6px 8px" }}>← {previousArticle?.title || "Previous"}</button>
            <button type="button" className="glass-button" onClick={() => { window.print(); }} style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 7, color: "var(--jd-text)", fontSize: 10.8, padding: "6px 8px" }}>Print lesson</button>
            <button type="button" className="glass-button" onClick={() => { const url = window.location.href; navigator.clipboard?.writeText(url); }} style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 7, color: "var(--jd-text)", fontSize: 10.8, padding: "6px 8px" }}>Copy link</button>
            <button type="button" className="glass-button" disabled={!nextArticle} onClick={() => onNavigate(nextArticle)} style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 7, color: "var(--jd-text)", fontSize: 10.8, opacity: nextArticle ? 1 : .45, padding: "6px 8px" }}>{nextArticle?.title || "Next"} →</button>
          </nav>
        </div>
      )}

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
        <span style={{ border: "1px solid rgba(250,204,21,.3)", borderRadius: 999, color: "var(--jd-warning-text)", fontSize: 10.5, fontWeight: 900, padding: "3px 7px" }}>{article.level}</span>
        <button type="button" className="glass-button" onClick={onToggle} aria-expanded={expanded} aria-controls={expanded ? `java-digest-article-${article.id}` : undefined} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className={`ti ${expanded ? "ti-chevron-up" : "ti-book-2"}`} style={{ color: accent, marginRight: 6 }} />
          {expanded ? "Close Lesson" : "Open Lesson"}
        </button>
        {expanded && (
          <>
            <button type="button" className="glass-button" onClick={coach} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
              <i className="ti ti-school" style={{ color: accent, marginRight: 6 }} />
              Coach Me
            </button>
            <button type="button" className="glass-button" onClick={mock} style={{ border: "1px solid rgba(196,181,253,.38)", borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
              <i className="ti ti-player-play" style={{ color: "var(--jd-accent-alt)", marginRight: 6 }} />
              Mock Drill
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function StudyPathCard({ path, accent, expanded, onToggle, completedIds, bookmarkedIds, onToggleStatus }) {
  return (
    <article className={`java-digest-card${expanded ? " is-expanded" : ""}`} style={{ ...wrap, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={wrap}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{path.eyebrow}</div>
        <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25, marginTop: 4 }}>{path.title}</h3>
        <span style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 999, color: "var(--jd-warning-text)", display: "inline-block", fontSize: 10, fontWeight: 900, marginTop: 6, padding: "3px 7px" }}>{path.level}</span>
        <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 12, lineHeight: 1.55, marginTop: 7 }}>{path.description}</p>
      </div>
      <button type="button" className="glass-button" onClick={onToggle} aria-expanded={expanded} aria-controls={`java-study-path-${path.id}`} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
        <i className={`ti ${expanded ? "ti-chevron-up" : "ti-book-2"}`} style={{ color: accent, marginRight: 6 }} />
        {expanded ? "Close Lessons" : "Open Lessons"}
      </button>
      {expanded && (
        <ol id={`java-study-path-${path.id}`} style={{ ...wrap, color: "var(--jd-text-muted)", display: "grid", fontSize: 11.5, gap: 9, lineHeight: 1.5, margin: 0, paddingLeft: 19 }}>
          {path.lessons.map((lesson, index) => {
            const id = `${path.id}-${index + 1}`;
            return <li key={lesson.title} style={{ borderBottom: "1px solid var(--jd-border)", paddingBottom: 9 }}>
              <strong style={{ color: "var(--jd-text)", display: "block", fontSize: 12 }}>{lesson.title}</strong>
              <span style={{ display: "block", marginTop: 5 }}><b style={{ color: accent }}>Learn:</b> {lesson.outcome}</span>
              <span style={{ display: "block", marginTop: 5 }}><b style={{ color: "var(--jd-warning-text)" }}>Remember it:</b> {lesson.mentalModel}</span>
              <span style={{ display: "block", marginTop: 5 }}><b style={{ color: "var(--jd-text)" }}>See it:</b> {lesson.example}</span>
              <span style={{ color: "var(--jd-accent-alt)", display: "block", marginTop: 5 }}><b>Recall without looking:</b> {lesson.recall}</span>
              <span style={{ color: "var(--jd-accent-alt)", display: "block", marginTop: 5 }}><b>Do it:</b> {lesson.drill}</span>
              <div style={{ marginTop: 7 }}><StarAnswer story={buildStarFrame(lesson.title, lesson.outcome)} accent={accent} label="How to frame it in STAR" /></div>
              {lesson.definition && <details style={{ borderTop: "1px solid var(--jd-border)", marginTop: 8, paddingTop: 7 }}><summary style={{ color: accent, cursor: "pointer", fontSize: 11.2, fontWeight: 900 }}>Detailed pattern answer</summary><div style={{ color: "var(--jd-text-soft)", display: "grid", fontSize: 11.2, gap: 6, lineHeight: 1.5, marginTop: 7 }}><div><b style={{ color: "var(--jd-text)" }}>Definition:</b> {lesson.definition}</div><div><b style={{ color: "var(--jd-text)" }}>How it works:</b> {lesson.howItWorks}</div><div><b style={{ color: "var(--jd-text)" }}>Advantages:</b> {lesson.advantages}</div><div><b style={{ color: "var(--jd-text)" }}>Disadvantages:</b> {lesson.disadvantages}</div><div><b style={{ color: "var(--jd-text)" }}>When to use:</b> {lesson.whenToUse}</div><div><b style={{ color: "var(--jd-text)" }}>Interview question:</b> {lesson.interview}</div><StarAnswer story={lesson.star} accent={accent} /><pre style={{ background: "var(--jd-surface-sunken)", borderRadius: 6, color: "var(--jd-code-text)", margin: 0, overflowX: "auto", padding: 8, whiteSpace: "pre-wrap" }}>{lesson.codeSketch}</pre></div></details>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}><ChipButton label={completedIds.has(id) ? "Completed" : "Mark complete"} icon="ti-check" active={completedIds.has(id)} accent={accent} onClick={() => onToggleStatus("completedTutorials", id)} /><ChipButton label={bookmarkedIds.has(id) ? "Bookmarked" : "Bookmark"} icon="ti-bookmark" active={bookmarkedIds.has(id)} accent="var(--jd-warning)" onClick={() => onToggleStatus("bookmarkedTutorials", id)} /></div>
            </li>
          })}
        </ol>
      )}
    </article>
  );
}

function QuickReferenceCard({ reference, accent, completedIds, bookmarkedIds, onToggleStatus }) {
  return (
    <article className="java-digest-card" style={{ ...wrap, borderRadius: 8, display: "grid", gap: 9, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}><span style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{reference.category}</span><span style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 999, color: "var(--jd-warning-text)", fontSize: 9.8, fontWeight: 900, padding: "3px 6px" }}>{reference.level}</span></div>
      <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 14.5, lineHeight: 1.25 }}>{reference.title}</h3>
      <ul style={{ ...wrap, color: "var(--jd-text-soft)", display: "grid", fontSize: 11.4, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {reference.points.map((point) => <li key={point}>{point}</li>)}
      </ul>
      <details style={{ borderTop: "1px solid var(--jd-border)", paddingTop: 8 }}>
        <summary style={{ color: "var(--jd-accent-alt)", cursor: "pointer", fontSize: 11, fontWeight: 800 }}>Self-check: {reference.quiz}</summary>
        <p style={{ color: "var(--jd-text-soft)", fontSize: 11.3, lineHeight: 1.5, margin: "7px 0 0" }}><b style={{ color: accent }}>Answer:</b> {reference.answer}</p>
        <StarAnswer story={buildStarFrame(reference.title, reference.answer)} accent={accent} label="How to frame it in STAR" />
      </details>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><ChipButton label={completedIds.has(reference.id) ? "Reviewed" : "Mark reviewed"} icon="ti-check" active={completedIds.has(reference.id)} accent={accent} onClick={() => onToggleStatus("completedTutorials", reference.id)} /><ChipButton label={bookmarkedIds.has(reference.id) ? "Bookmarked" : "Bookmark"} icon="ti-bookmark" active={bookmarkedIds.has(reference.id)} accent="var(--jd-warning)" onClick={() => onToggleStatus("bookmarkedTutorials", reference.id)} /></div>
    </article>
  );
}

function RoadmapCard({ roadmap, accent, expanded, onAction, onToggle }) {
  const start = () => {
    onAction?.(buildJavaDigestRoadmapPrompt(roadmap.id), { type: "javaDigestRoadmap", roadmap });
  };

  return (
    <article className="java-digest-card" style={{ ...wrap, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={wrap}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{roadmap.audience}</div>
        <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15, lineHeight: 1.25, marginTop: 4 }}>{roadmap.title}</h3>
      </div>
      <ol id={`java-digest-roadmap-${roadmap.id}`} style={{ ...wrap, color: "var(--jd-text-muted)", display: "grid", fontSize: 11.5, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 18 }}>
        {(expanded ? roadmap.days : roadmap.days.slice(0, 3)).map((day) => <li key={day}>{day}</li>)}
      </ol>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {roadmap.days.length > 3 && (
          <button type="button" className="glass-button" onClick={onToggle} aria-expanded={expanded} aria-controls={`java-digest-roadmap-${roadmap.id}`} style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
            <i className={`ti ${expanded ? "ti-chevron-up" : "ti-list"}`} style={{ color: accent, marginRight: 6 }} />
            {expanded ? "Show Preview" : "View Full Roadmap"}
          </button>
        )}
        <button type="button" className="glass-button" onClick={start} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-calendar-stats" style={{ color: accent, marginRight: 6 }} />
          Build My Plan
        </button>
      </div>
    </article>
  );
}

function FresherDsaPlaybook({ accent }) {
  return (
    <section style={{ ...wrap, background: "var(--jd-surface)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={wrap}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Fresher DSA Playbook</div>
        <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25, marginTop: 3 }}>A repeatable method for unfamiliar DSA questions</h3>
        <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5, margin: "6px 0 0" }}>Use this before every problem: understand the constraints, name the pattern, state the invariant (the fact that must stay true), code the smallest correct version, and test the edges. The goal is not to guess a trick; it is to make each decision explainable.</p>
        <details style={{ color: "var(--jd-text-soft)", fontSize: 11.4, lineHeight: 1.5, marginTop: 8 }}>
          <summary style={{ color: accent, cursor: "pointer", fontWeight: 850 }}>New to DSA? Read the vocabulary first</summary>
          <p style={{ margin: "7px 0" }}>Start with the definition, trace the small example, and only then worry about memorizing a template. The symbols describe scale; the pattern names describe how you move through the input.</p>
          <dl style={{ display: "grid", gap: 6, margin: 0 }}>{FRESHER_DSA_GLOSSARY.map(({ term, definition }) => <div key={term}><dt style={{ color: "var(--jd-text)", fontWeight: 800 }}>{term}</dt><dd style={{ margin: "1px 0 0" }}>{definition}</dd></div>)}</dl>
        </details>
      </div>
      <div style={responsiveGrid(260, 9)}>
        <section style={{ ...wrap, background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, padding: 10 }}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, margin: "0 0 7px" }}>Seven-step solving framework</h4>
          <ol style={{ ...wrap, color: "var(--jd-text-soft)", display: "grid", fontSize: 11.5, gap: 5, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
            {FRESHER_DSA_PLAYBOOK.framework.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </section>
        <section style={{ ...wrap, background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, padding: 10 }}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, margin: "0 0 7px" }}>Constraint-to-algorithm map</h4>
          <p style={{ color: "var(--jd-text-muted)", fontSize: 11.2, lineHeight: 1.45, margin: "0 0 7px" }}>These are sizing heuristics, not guarantees: account for the time limit, language overhead, input shape, and the cost of each operation.</p>
          <div style={{ display: "grid", gap: 7 }}>
            {FRESHER_DSA_PLAYBOOK.constraintMap.map((entry) => (
              <div key={entry.limit} style={{ ...wrap, borderBottom: "1px solid var(--jd-border)", paddingBottom: 6 }}>
                <strong style={{ color: accent, fontSize: 11.2 }}>{entry.limit} · {entry.choice}</strong>
                <div style={{ color: "var(--jd-text-muted)", fontSize: 11.2, lineHeight: 1.45, marginTop: 2 }}>{entry.reason}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section style={{ ...wrap, background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, padding: 10 }}>
        <h4 style={{ color: "var(--jd-text)", fontSize: 12, margin: "0 0 7px" }}>Pattern recognition and interview follow-ups</h4>
        <div style={responsiveGrid(300, 8)}>
          {FRESHER_DSA_PLAYBOOK.patterns.map((pattern) => (
            <article key={pattern.name} style={{ ...wrap, background: "var(--jd-surface)", border: "1px solid var(--jd-border)", borderRadius: 7, display: "grid", gap: 5, padding: 9 }}>
              <strong style={{ color: accent, fontSize: 12 }}>{pattern.name}</strong>
              <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.45 }}><b>Recognize:</b> {pattern.recognize}</div>
              <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.45 }}><b>Approach:</b> {pattern.approach}</div>
              <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.45 }}><b>Java:</b> {pattern.java}</div>
              <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.45 }}><b>Cost:</b> {pattern.complexity}</div>
              <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.45 }}><b>Start with:</b> {pattern.starter}</div>
              <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.45 }}><b>Follow-up:</b> {pattern.followUp}</div>
            </article>
          ))}
        </div>
      </section>
      <div style={responsiveGrid(260, 9)}>
        <DetailList title="Edge-case checklist" icon="ti-checklist" items={FRESHER_DSA_PLAYBOOK.edgeCases} accent="var(--jd-warning)" />
        <DetailList title="Debugging routine" icon="ti-bug" items={FRESHER_DSA_PLAYBOOK.debugging} accent="var(--jd-danger-accent)" />
      </div>
      <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, padding: 10 }}>
        <h4 style={{ color: "var(--jd-text)", fontSize: 12, margin: "0 0 7px" }}>Progressive practice ladder</h4>
        <div style={responsiveGrid(250, 8)}>
          {FRESHER_DSA_PLAYBOOK.practiceLadder.map((level) => (
            <article key={level.level} style={{ ...wrap, background: "var(--jd-surface)", border: "1px solid var(--jd-border)", borderRadius: 7, padding: 9 }}>
              <strong style={{ color: accent, fontSize: 11.5 }}>{level.level}</strong>
              <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.45, marginTop: 4 }}>{level.goal}</div>
              <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.45, marginTop: 4 }}>{level.problems}</div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function CsesChapterCard({ chapter, accent, expanded, onAction, onToggleExpanded }) {
  const detail = getCsesJavaChapterDetail(chapter);
  const startPractice = () => {
    onAction?.(buildCsesJavaPracticePrompt(chapter.id), { type: "csesJavaTrack", csesTrack: chapter });
  };

  return (
    <article style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "flex-start", display: "grid", gap: 9, gridTemplateColumns: "auto 1fr auto", minWidth: 0 }}>
        <span style={{ alignItems: "center", background: "var(--jd-accent-surface-strong)", border: `1px solid ${accent}44`, borderRadius: 7, color: accent, display: "inline-flex", fontSize: 12, fontWeight: 950, height: 34, justifyContent: "center", minWidth: 38 }}>
          {chapter.chapter}
        </span>
        <div style={{ ...wrap, alignSelf: "center" }}>
          <div style={{ color: "var(--jd-text-muted)", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            Part {chapter.part} · {chapter.partTitle}
          </div>
          <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25, marginTop: 3 }}>{chapter.title}</h3>
        </div>
        <span style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 999, color: "var(--jd-text-soft)", flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
          {chapter.difficulty}
        </span>
      </div>

      <div style={responsiveGrid(230, 9)}>
        <DetailList title="Book Sections" icon="ti-book" items={chapter.sections} accent={accent} />
        <DetailList title="Java Drills" icon="ti-cup" items={chapter.javaDrills} accent={accent} />
      </div>

      <section style={{ ...wrap, background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
        <div style={wrap}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>Detailed Explanation</h4>
          <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.55, margin: 0 }}>{detail.explanation}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>How To Think About It</h4>
          <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.reasoning}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>Java Implementation Notes</h4>
          <p style={{ ...wrap, color: "var(--jd-code-text)", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.javaApproach}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>Worked Example</h4>
          <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.workedExample}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>Java Sketch</h4>
          <code style={{ ...wrap, color: "var(--jd-code-text)", display: "block", fontSize: 11.2, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{detail.codeSketch}</code>
        </div>
        {expanded && (
          <div style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}22`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
            <div style={wrap}>
              <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>Deep Study Path</h4>
              <ol style={{ ...wrap, color: "var(--jd-text-soft)", display: "grid", fontSize: 11.5, gap: 5, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
                {detail.stepByStep.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
            <div style={wrap}>
              <h4 style={{ color: "var(--jd-text)", fontSize: 12, marginBottom: 6 }}>Interview Answer</h4>
              <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.interviewAnswer}</p>
            </div>
            <div style={responsiveGrid(220, 9)}>
              <DetailList title="Common Mistakes" icon="ti-alert-triangle" items={detail.commonMistakes} accent="var(--jd-danger-accent)" />
              <DetailList title="Practice Tasks" icon="ti-target-arrow" items={detail.practiceTasks} accent="var(--jd-accent-alt)" />
            </div>
          </div>
        )}
      </section>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" className="glass-button" onClick={onToggleExpanded} aria-expanded={expanded} style={{ border: "1px solid var(--jd-border-strong)", borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ color: accent, marginRight: 6 }} />
          {expanded ? "Show Less" : "Explain More"}
        </button>
        <button type="button" className="glass-button" onClick={startPractice} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
          Study Chapter in Java
        </button>
      </div>
    </article>
  );
}

function CsesPartSection({ part, accent, expanded, expandedChapterId, onAction, onToggleChapter, onTogglePart }) {
  return (
    <section style={{ ...wrap, border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ ...wrap, alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>Part {part.part}</div>
          <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 17, lineHeight: 1.25, marginTop: 3 }}>{part.title}</h3>
          <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.7, lineHeight: 1.5, marginTop: 6 }}>{part.summary}</p>
        </div>
        <button type="button" className="glass-button" onClick={onTogglePart} aria-expanded={expanded} aria-controls={expanded ? `java-digest-part-${part.id}` : undefined} style={{ border: `1px solid ${accent}44`, borderRadius: 999, color: accent, flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "5px 8px", whiteSpace: "nowrap" }}>
          {part.chapters.length} chapters <i className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ marginLeft: 4 }} />
        </button>
      </header>
      {expanded && (
        <div id={`java-digest-part-${part.id}`} style={responsiveGrid(330, 10)}>
          {part.chapters.map((chapter) => (
            <CsesChapterCard key={chapter.id} chapter={{ ...chapter, part: part.part, partTitle: part.title }} accent={accent} expanded={expandedChapterId === chapter.id} onAction={onAction} onToggleExpanded={() => onToggleChapter(chapter.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function JavaDigest({ theme = {}, onAction, onJavaProgressChange, onRefresherProgressChange, profile = null, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange, onActivity, progress = {} }) {
  const updateProgress = onJavaProgressChange || onRefresherProgressChange;
  const [activeTrack, setActiveTrack] = useState("all");
  const [activeView, setActiveView] = useState("Java Curriculum");
  const [expandedPartId, setExpandedPartId] = useState(CSES_JAVA_PARTS[0]?.id || "");
  const [expandedChapterId, setExpandedChapterId] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState("");
  const [expandedRoadmapId, setExpandedRoadmapId] = useState("");
  const [expandedStudyPathId, setExpandedStudyPathId] = useState("");
  const [tutorialSearch, setTutorialSearch] = useState("");
  const [tutorialCategory, setTutorialCategory] = useState("all");
  const [tutorialLevel, setTutorialLevel] = useState("all");
  const [tutorialSavedFilter, setTutorialSavedFilter] = useState("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [refresherQuestions, setRefresherQuestions] = useState([]);
  const [refresherSource, setRefresherSource] = useState("pdf");
  const [refresherLoading, setRefresherLoading] = useState(false);
  const [refresherError, setRefresherError] = useState("");
  const [refresherFilter, setRefresherFilter] = useState("");
  const [selectedRefresherSection, setSelectedRefresherSection] = useState("all");
  const [randomQuestionId, setRandomQuestionId] = useState("");
  const [expandedRefresherQuestionId, setExpandedRefresherQuestionId] = useState("");
  const [practiceQuestionId, setPracticeQuestionId] = useState("");
  const [practiceResponse, setPracticeResponse] = useState("");
  const [practiceAnswerRevealed, setPracticeAnswerRevealed] = useState(false);
  const router = useRouter();
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";
  const articles = useMemo(() => listJavaDigestArticles(activeTrack), [activeTrack]);
  const selectedArticle = articles.find((article) => article.id === expandedArticleId) || null;
  const viewMetadata = VIEW_METADATA[activeView] || VIEW_METADATA["Java Curriculum"];
  const { learningProgress, dueReviewCount, dueReviewIds, toggleLearningStatus } = useJavaDigestProgress(progress, updateProgress);
  const competencySummary = useMemo(
    () => buildJavaDigestCompetencySummary({ progress, selectedTrackId: activeTrack }),
    [progress, activeTrack],
  );
  const tutorialCategories = useMemo(() => Array.from(new Set(JAVA_CURATED_TUTORIAL_CATALOG.map((tutorial) => tutorial.category))), []);
  const tutorialLevels = useMemo(() => Array.from(new Set(JAVA_CURATED_TUTORIAL_CATALOG.map((tutorial) => tutorial.level))), []);
  const visibleTutorials = useMemo(() => {
    const query = tutorialSearch.trim().toLocaleLowerCase();
    return JAVA_CURATED_TUTORIAL_CATALOG.filter((tutorial) => (
      (tutorialCategory === "all" || tutorial.category === tutorialCategory)
      && (tutorialLevel === "all" || tutorial.level === tutorialLevel)
      && (tutorialSavedFilter === "all" || (tutorialSavedFilter === "saved" ? learningProgress.bookmarkedIds.has(tutorial.id) : !learningProgress.completedIds.has(tutorial.id)))
      && (!query || [tutorial.title, tutorial.category, tutorial.level, tutorial.summary, tutorial.explanation, tutorial.walkthrough, tutorial.howToThink, tutorial.mistakes, tutorial.productionNote, tutorial.interviewAnswer, tutorial.relatedTopics?.join(" "), tutorial.editorialStatus].join(" ").toLocaleLowerCase().includes(query))
    ));
  }, [learningProgress.bookmarkedIds, learningProgress.completedIds, tutorialCategory, tutorialLevel, tutorialSavedFilter, tutorialSearch]);
  const dueTutorials = useMemo(() => JAVA_CURATED_TUTORIAL_CATALOG.filter((tutorial) => dueReviewIds.includes(tutorial.id)).slice(0, 8), [dueReviewIds]);
  const savedTutorials = useMemo(() => JAVA_CURATED_TUTORIAL_CATALOG.filter((tutorial) => learningProgress.bookmarkedIds.has(tutorial.id)), [learningProgress.bookmarkedIds]);
  const lastOpenedTutorial = JAVA_CURATED_TUTORIAL_CATALOG.find((tutorial) => tutorial.id === progress.lastOpenedTutorial) || null;
  const openTutorial = (tutorial) => {
    updateProgress?.((previous = {}) => ({ ...previous, lastOpenedTutorial: tutorial.id }));
    setTutorialSearch(tutorial.title);
  };
  useEffect(() => {
    const articleId = typeof router.query.article === "string" ? router.query.article : "";
    if (!router.isReady || !articleId || !JAVA_DIGEST_ARTICLES.some((article) => article.id === articleId)) return;
    setActiveView("Articles");
    setExpandedArticleId(articleId);
  }, [router.isReady, router.query.article]);
  const navigateArticle = (article) => {
    if (!article) return;
    setActiveView("Articles");
    setActiveTrack("all");
    setExpandedArticleId(article.id);
    router.push({ pathname: router.pathname, query: { ...router.query, article: article.id } }, undefined, { shallow: true });
  };
  const visibleRefresherQuestions = useMemo(() => {
    const query = refresherFilter.trim().toLocaleLowerCase();
    return refresherQuestions.filter((entry) => (
      (selectedRefresherSection === "all" || entry.section === selectedRefresherSection)
      && (!query || `${entry.section} ${entry.question} ${entry.answer}`.toLocaleLowerCase().includes(query))
    ));
  }, [refresherFilter, refresherQuestions, selectedRefresherSection]);
  const refresherSections = useMemo(
    () => Array.from(new Set(refresherQuestions.map((entry) => entry.section))),
    [refresherQuestions],
  );
  const practiceQuestion = refresherQuestions.find((entry) => entry.id === practiceQuestionId) || null;
  const refresherProgress = {
    bookmarkedQuestions: new Set(Array.isArray(progress.bookmarkedQuestions) ? progress.bookmarkedQuestions : []),
    reviewedQuestions: new Set(Array.isArray(progress.reviewedQuestions) ? progress.reviewedQuestions : []),
    masteredQuestions: new Set(Array.isArray(progress.masteredQuestions) ? progress.masteredQuestions : []),
  };
  const tabs = [
    { label: "Interview Q&A", icon: "ti-message-question" },
    { label: "Production Scenarios", icon: "ti-alert-triangle" },
    { label: "Senior Refresher", icon: "ti-bolt" },
    { label: "Java + Spring", icon: "ti-leaf" },
    { label: "Quick Reference", icon: "ti-notes" },
    { label: "Tutorial Library", icon: "ti-books" },
    { label: "Practice Lab", icon: "ti-code" },
    { label: "Saved & Review", icon: "ti-bookmark" },
    { label: "Java Curriculum", icon: "ti-book-2" },
    { label: "Search", icon: "ti-search" },
    { label: "Articles", icon: "ti-news" },
    { label: "Roadmaps", icon: "ti-route" },
  ];
  const generateAnswer = async (topic) => {
    const trimmedTopic = String(topic || "").trim();
    if (!trimmedTopic || searchLoading) return;

    setSearchQuery(trimmedTopic);
    setActiveView("Search");
    setGeneratedAnswer("");
    setSearchError("");
    setSearchLoading(true);
    onActivity?.({
      workspaceId: "javaDigest",
      type: "generate",
      label: "Generated Java topic answer",
      detail: trimmedTopic,
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: buildJavaDigestGeneratedTopicPrompt(trimmedTopic, profile || {}) }],
          profile,
          interviewMode: "directAnswer",
          roundStrategy: "directAnswer",
          interviewPanel: null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "AI generation failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          let payload;
          try {
            payload = JSON.parse(data);
          } catch {
            continue;
          }

          if (payload.error) throw new Error(payload.error);
          if (payload.text) {
            answer += payload.text;
            setGeneratedAnswer(answer);
          }
        }
      }
    } catch (error) {
      setSearchError(error.message || "AI generation failed.");
    } finally {
      setSearchLoading(false);
    }
  };
  const submitSearch = (event) => {
    event?.preventDefault();
    const query = searchDraft.trim().toLocaleLowerCase();
    const exactArticle = JAVA_DIGEST_ARTICLES.find((article) => article.title.toLocaleLowerCase() === query);
    const exactTutorial = JAVA_CURATED_TUTORIAL_CATALOG.find((tutorial) => tutorial.title.toLocaleLowerCase() === query);
    if (exactArticle) {
      navigateArticle(exactArticle);
      return;
    }
    if (exactTutorial) {
      setActiveView("Tutorial Library");
      openTutorial(exactTutorial);
      return;
    }
    generateAnswer(searchDraft);
  };
  const toggleExpandedChapter = (chapterId) => setExpandedChapterId((current) => current === chapterId ? "" : chapterId);
  const toggleExpandedPart = (partId) => {
    setExpandedPartId((current) => current === partId ? "" : partId);
    setExpandedChapterId("");
  };
  const toggleRefresherStatus = (field, questionId) => {
    updateProgress?.((previous = {}) => {
      const values = new Set(Array.isArray(previous[field]) ? previous[field] : []);
      if (values.has(questionId)) values.delete(questionId);
      else values.add(questionId);
      return { ...previous, [field]: Array.from(values) };
    });
  };
  const chooseRandomQuestion = () => {
    const candidates = visibleRefresherQuestions.length ? visibleRefresherQuestions : refresherQuestions;
    if (!candidates.length) return;
    if (!visibleRefresherQuestions.length) {
      setSelectedRefresherSection("all");
      setRefresherFilter("");
    }
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    setRandomQuestionId(selected.id);
    setExpandedRefresherQuestionId(selected.id);
  };
  const startPracticeMode = () => {
    const candidates = visibleRefresherQuestions.length ? visibleRefresherQuestions : refresherQuestions;
    if (!candidates.length) return;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    setPracticeQuestionId(selected.id);
    setPracticeResponse("");
    setPracticeAnswerRevealed(false);
  };
  const revealPracticeAnswer = () => {
    if (!practiceQuestion) return;
    setPracticeAnswerRevealed(true);
    updateProgress?.((previous = {}) => ({
      ...previous,
      reviewedQuestions: Array.from(new Set([...(previous.reviewedQuestions || []), practiceQuestion.id])),
    }));
  };
  const scorePracticeResponse = () => {
    if (!practiceQuestion || !practiceResponse.trim()) return;
    onAction?.([
      "Score my senior Java interview answer against the provided reference answer.",
      `Question: ${practiceQuestion.question}`,
      `My answer: ${practiceResponse.trim()}`,
      `Reference answer: ${practiceQuestion.answer}`,
      "Return a concise score out of 10 for correctness, trade-offs, production judgement, and communication.",
      "Then give the three highest-value improvements and a stronger 60-second answer. Do not claim the reference is universally correct; call out assumptions.",
    ].join("\n"), { type: "javaSeniorRefresherScore", refresherQuestion: practiceQuestion });
  };
  useEffect(() => {
    if (activeView !== "Senior Refresher" || refresherQuestions.length) return undefined;

    const controller = new AbortController();
    setRefresherLoading(true);
    setRefresherError("");
    fetch("/api/java-senior-refresher", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "The question bank could not be loaded.");
        setRefresherQuestions(Array.isArray(payload.questions) ? payload.questions : []);
        setRefresherSource(payload.source || "pdf");
      })
      .catch((error) => {
        if (error.name !== "AbortError") setRefresherError(error.message || "The question bank could not be loaded.");
      })
      .finally(() => setRefresherLoading(false));

    return () => controller.abort();
  }, [activeView, refresherQuestions.length]);

  return (
    <section
      className="glass-card java-digest"
      style={{
        background: "var(--jd-background)",
        border: "1px solid var(--jd-border-strong)",
        borderRadius: 8,
        color: "var(--jd-text)",
        display: "grid",
        flexShrink: 0,
        gap: 12,
        minWidth: 0,
        padding: 14,
        width: "100%",
      }}
    >
      <BeginnerGuideBanner
        enabled={beginnerMode}
        accent={accent}
        currentStep={beginnerStep}
        onStepSelect={onBeginnerStepChange}
        detail="For Java: read one concept, predict the interview trap, explain the code cue, practice one drill card, then review the follow-up."
      />
      <AnswerAtAGlance category="Java" takeaway="Read the runtime rule first, then connect it to the API choice and the production behavior you would observe." complexity="State the relevant time/space cost and the safety or throughput trade-off." edgeCases="Nulls, mutable keys, empty collections, concurrent access, lifecycle boundaries, and version compatibility." />

      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Java Digest</div>
          <h2 style={{ ...wrap, color: "var(--jd-text)", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>{viewMetadata.title}</h2>
          <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.5, lineHeight: 1.45, margin: "4px 0 0" }}>{viewMetadata.description}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
          {tabs.map((tab) => (
            <ChipButton
              key={tab.label}
              label={tab.label}
              icon={tab.icon}
              active={activeView === tab.label}
              accent={accent}
              onClick={() => setActiveView(tab.label)}
            />
          ))}
        </div>
      </header>

      <section className="java-digest-progress" style={{ background: "var(--jd-surface-subtle)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
        <div className="java-digest-progress-summary" style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "6px 18px" }}>
          <span style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Java Digest {JAVA_DIGEST_VERSION}</span>
          <strong style={{ color: "var(--jd-text)", fontSize: 13 }}>Mastery {competencySummary.masteryScore}%</strong>
          <span style={{ color: "var(--jd-text-soft)", fontSize: 11 }}>Coverage {competencySummary.completedTopics}/{competencySummary.totalTopics}</span>
        </div>
        <div className="java-digest-radar" style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))" }}>
          {competencySummary.competencyTracks.map((track) => (
            <div key={track.id} style={{ border: "1px solid var(--jd-border)", borderRadius: 7, padding: "6px 8px" }}>
              <strong style={{ color: "var(--jd-text)", display: "block", fontSize: 11.6 }}>{track.label}</strong>
              <div style={{ color: "var(--jd-text-soft)", fontSize: 10.8, marginTop: 3 }}>Coverage {track.coverage}% · Mastery {track.mastery}%</div>
            </div>
          ))}
        </div>
      </section>

      <section className="java-digest-search" style={{ border: `1px solid ${accentBorder}`, borderRadius: 10, display: "grid", gap: 8, minWidth: 0, padding: 10, width: "min(100%, 680px)" }}>
        <form className="java-digest-search-form" onSubmit={submitSearch} style={{ ...wrap, display: "grid", gap: 6 }}>
          <span className="java-digest-search-label" style={{ color: "var(--jd-text-muted)", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Search Interview Topic</span>
          <div className="java-digest-search-control" style={{ alignItems: "center", background: "var(--jd-surface-sunken)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "flex", gap: 8, minWidth: 0, padding: "7px 9px" }}>
            <i className="ti ti-search" style={{ color: accent, flexShrink: 0, fontSize: 15 }} />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => {
                setSearchDraft(event.target.value);
                setActiveView("Search");
              }}
              placeholder="Search interface, deserialization, segment tree, dynamic programming..."
              className="glass-input"
              style={{ background: "transparent", border: "none", color: "var(--jd-text)", flex: 1, fontSize: 13, minHeight: 30, minWidth: 0, outline: "none", padding: 0 }}
            />
            <button
              type="submit"
              disabled={searchLoading || !searchDraft.trim()}
              className="glass-button java-digest-search-button"
              style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", cursor: searchLoading || !searchDraft.trim() ? "not-allowed" : "pointer", flexShrink: 0, fontSize: 11, fontWeight: 900, minHeight: 32, opacity: searchLoading || !searchDraft.trim() ? .45 : 1, padding: "6px 10px" }}
            >
              <i className="ti ti-arrow-right" style={{ color: accent, marginRight: 5 }} />
              Search
            </button>
          </div>
        </form>
      </section>

      {activeView === "Search" && (
        <div style={{ display: "grid", gap: 10 }}>
          <GeneratedAnswerPanel
            answer={generatedAnswer}
            error={searchError}
            loading={searchLoading}
            query={searchQuery}
            accent={accent}
            onRetry={() => generateAnswer(searchQuery)}
          />
        </div>
      )}

      {activeView === "Interview Q&A" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Answer framework</div>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.55, margin: 0 }}>Start with a direct technical answer, explain the internal mechanism, name the trade-off and usage boundary, then give a STAR story that proves you applied the idea in production.</p>
          </section>
          {JAVA_INTERVIEW_QA.map((entry) => (
            <details key={entry.id} style={{ ...wrap, background: "var(--jd-surface-subtle)", border: `1px solid ${accentBorder}`, borderRadius: 8, padding: "10px 11px" }}>
              <summary style={{ color: "var(--jd-text)", cursor: "pointer", fontSize: 13, fontWeight: 850, lineHeight: 1.45 }}>{entry.question}</summary>
              <div style={{ color: accent, fontSize: 10.3, fontWeight: 900, marginTop: 9, textTransform: "uppercase" }}>{entry.section} · Interview-ready answer</div>
              <StructuredInterviewAnswer entry={entry} accent={accent} />
              <StarAnswer story={entry.star} accent={accent} label="STAR answer · Situation → Task → Action → Result" />
              <div style={{ background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 7, display: "grid", gap: 6, marginTop: 9, padding: "8px 9px" }}>
                <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: accent }}>Why this works:</strong> {entry.whyItWorks}</div>
                <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: accent }}>Common mistakes:</strong> {entry.commonMistakes}</div>
                <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: accent }}>Performance notes:</strong> {entry.performanceNotes}</div>
                <div style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5 }}><strong style={{ color: accent }}>Testing:</strong> {entry.testingNotes}</div>
              </div>
              <div style={{ color: "var(--jd-text-muted)", fontSize: 11.2, lineHeight: 1.45, marginTop: 8 }}><strong style={{ color: "var(--jd-text)" }}>Likely follow-ups:</strong> {entry.followUps}</div>
            </details>
          ))}
        </div>
      )}

      {activeView === "Production Scenarios" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Incident answer loop</div>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.55, margin: 0 }}>State impact first. Then separate mitigation from diagnosis: stabilize users with the safest reversible action, gather evidence, test a hypothesis, and only then explain root cause and prevention. Finish with the STAR story in your own voice.</p>
            <details style={{ color: "var(--jd-text-soft)", fontSize: 11.4, lineHeight: 1.5 }}>
              <summary style={{ color: accent, cursor: "pointer", fontWeight: 850 }}>Plain-language operations glossary — p99 means the slowest 1% of requests</summary>
              <dl style={{ display: "grid", gap: 6, margin: "8px 0 0" }}>{JAVA_PRODUCTION_GLOSSARY.map(({ term, definition }) => <div key={term}><dt style={{ color: "var(--jd-text)", fontWeight: 800 }}>{term}</dt><dd style={{ margin: "1px 0 0" }}>{definition}</dd></div>)}</dl>
            </details>
          </section>
          {JAVA_PRODUCTION_SCENARIOS.map((scenario) => (
            <details key={scenario.id} style={{ ...wrap, background: "var(--jd-surface-subtle)", border: `1px solid ${accentBorder}`, borderRadius: 8, padding: "10px 11px" }}>
              <summary style={{ color: "var(--jd-text)", cursor: "pointer", fontSize: 13, fontWeight: 850, lineHeight: 1.45 }}>{scenario.title} <span style={{ color: accent, fontSize: 10.5, marginLeft: 5 }}>{scenario.area}</span></summary>
              <div style={{ display: "grid", gap: 8, marginTop: 9 }}>
                <p style={{ color: "var(--jd-text)", fontSize: 11.7, lineHeight: 1.55, margin: 0 }}><strong style={{ color: accent }}>Interviewer prompt:</strong> {scenario.prompt}</p>
                <p style={{ color: "var(--jd-text-soft)", fontSize: 11.4, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>Customer impact:</strong> {scenario.impact}</p>
                <div><strong style={{ color: accent, fontSize: 10.3, textTransform: "uppercase" }}>End-to-end triage</strong><ol style={{ color: "var(--jd-text-soft)", display: "grid", fontSize: 11.4, gap: 5, lineHeight: 1.48, margin: "6px 0 0", paddingLeft: 20 }}>{scenario.triage.map((step) => <li key={step}>{step}</li>)}</ol></div>
                <p style={{ color: "var(--jd-text-soft)", fontSize: 11.4, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-accent-alt)" }}>Likely diagnosis:</strong> {scenario.diagnosis}</p>
                <p style={{ color: "var(--jd-text-soft)", fontSize: 11.4, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#facc15" }}>Prevention:</strong> {scenario.prevention}</p>
                <StarAnswer story={scenario.star} accent={accent} />
                <div style={{ color: "var(--jd-text-muted)", fontSize: 11.1, lineHeight: 1.45 }}><strong style={{ color: "var(--jd-text)" }}>Follow-ups:</strong> {scenario.followUps}</div>
              </div>
            </details>
          ))}
        </div>
      )}

      {activeView === "Senior Refresher" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Java 21 · JVM · Concurrency</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 16, lineHeight: 1.25 }}>Complete Java Senior Refresher</h3>
          </section>
          <section style={{ ...wrap, background: `${accent}0d`, border: `1px solid ${accent}44`, borderRadius: 8, display: "grid", gap: 9, padding: 12 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <div>
                <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Practice Mode</div>
                <p style={{ color: "var(--jd-text-soft)", fontSize: 11.6, lineHeight: 1.5, margin: "5px 0 0" }}>Answer one question aloud or in writing before revealing the source answer.</p>
              </div>
              <button type="button" className="glass-button" onClick={startPracticeMode} disabled={!refresherQuestions.length} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", cursor: refresherQuestions.length ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 900, opacity: refresherQuestions.length ? 1 : .45, padding: "8px 10px" }}>
                <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
                {practiceQuestion ? "New Practice Question" : "Start Practice"}
              </button>
            </div>
            {practiceQuestion && (
              <div style={{ background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 9, padding: 11 }}>
                <div style={{ color: "var(--jd-text)", fontSize: 14, fontWeight: 850, lineHeight: 1.45 }}>{practiceQuestion.question}</div>
                <div style={{ color: "var(--jd-text-muted)", fontSize: 10.5 }}>{practiceQuestion.section}</div>
                <textarea value={practiceResponse} onChange={(event) => setPracticeResponse(event.target.value)} placeholder="Speak your answer aloud, then capture the key points here for scoring..." aria-label="Your interview practice answer" className="glass-input" rows={5} style={{ background: "var(--jd-surface-sunken)", border: `1px solid ${accentBorder}`, borderRadius: 7, color: "var(--jd-text)", fontFamily: "inherit", fontSize: 12, lineHeight: 1.5, outline: "none", padding: 9, resize: "vertical", width: "100%" }} />
                <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  <button type="button" className="glass-button" onClick={revealPracticeAnswer} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11, fontWeight: 900, padding: "7px 10px" }}>
                    <i className="ti ti-eye" style={{ color: accent, marginRight: 6 }} />
                    Reveal Source Answer
                  </button>
                  {practiceAnswerRevealed && <button type="button" className="glass-button" onClick={scorePracticeResponse} disabled={!practiceResponse.trim()} style={{ border: "1px solid rgba(196,181,253,.45)", borderRadius: 7, color: "var(--jd-text)", cursor: practiceResponse.trim() ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 900, opacity: practiceResponse.trim() ? 1 : .45, padding: "7px 10px" }}>
                    <i className="ti ti-chart-bar" style={{ color: "var(--jd-accent-alt)", marginRight: 6 }} />
                    Score with AI
                  </button>}
                </div>
                {practiceAnswerRevealed && <section style={{ borderTop: "1px solid var(--jd-border)", color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.58, paddingTop: 10 }}><strong style={{ color: accent, display: "block", fontSize: 10.3, marginBottom: 5, textTransform: "uppercase" }}>Source Answer</strong>{practiceQuestion.answer}</section>}
              </div>
            )}
          </section>
          <section style={{ ...wrap, background: "var(--jd-surface-subtle)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 9, padding: 12 }}>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
              <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{refresherSource === "curated" || refresherSource === "bundled-fallback" ? "Curated Q&A Bank" : "Verbatim Q&A Bank"}</div>
              <span style={{ color: "var(--jd-text-muted)", fontSize: 11 }}>{refresherLoading ? "Loading questions..." : `${visibleRefresherQuestions.length} of ${refresherQuestions.length} questions`}</span>
            </div>
            <div className="java-digest-refresher-toolbar">
              <select
                value={selectedRefresherSection}
                onChange={(event) => setSelectedRefresherSection(event.target.value)}
                aria-label="Filter refresher questions by section"
                className="glass-input java-digest-refresher-section"
              >
                <option value="all">All sections</option>
                {refresherSections.map((section) => <option key={section} value={section}>{section}</option>)}
              </select>
              <input
                type="search"
                value={refresherFilter}
                onChange={(event) => setRefresherFilter(event.target.value)}
                placeholder="Filter questions, e.g. transactions, GC, Kafka, or leadership"
                aria-label="Filter Java senior refresher questions and answers"
                className="glass-input java-digest-refresher-filter"
              />
              <button type="button" className="glass-button" onClick={chooseRandomQuestion} disabled={!refresherQuestions.length} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", cursor: refresherQuestions.length ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 900, opacity: refresherQuestions.length ? 1 : .45, padding: "7px 10px" }}>
                <i className="ti ti-shuffle" style={{ color: accent, marginRight: 6 }} />
                Random Question
              </button>
            </div>
            <span className="java-digest-refresher-status">
              {refresherProgress.bookmarkedQuestions.size} bookmarked · {refresherProgress.reviewedQuestions.size} reviewed · {refresherProgress.masteredQuestions.size} mastered
            </span>
            {refresherError && <p role="alert" style={{ color: "var(--jd-danger-text)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{refresherError}</p>}
            {!refresherLoading && !refresherError && visibleRefresherQuestions.length === 0 && <p style={{ color: "var(--jd-text-muted)", fontSize: 11.5, margin: 0 }}>No matching questions.</p>}
            <div style={{ display: "grid", gap: 8 }}>
              {visibleRefresherQuestions.map((entry) => (
                <details key={entry.id} open={expandedRefresherQuestionId === entry.id} onToggle={(event) => { const open = event.currentTarget.open; setExpandedRefresherQuestionId((current) => open ? entry.id : current === entry.id ? "" : current); if (!open && randomQuestionId === entry.id) setRandomQuestionId(""); }} style={{ background: randomQuestionId === entry.id ? `${accent}10` : "var(--jd-surface-sunken)", border: `1px solid ${randomQuestionId === entry.id ? `${accent}66` : "var(--jd-border)"}`, borderRadius: 7, padding: "9px 10px" }}>
                  <summary style={{ color: "var(--jd-text)", cursor: "pointer", fontSize: 12.5, fontWeight: 800, lineHeight: 1.45 }}>{entry.question}</summary>
                  <div style={{ color: accent, fontSize: 10.2, fontWeight: 900, marginTop: 9, textTransform: "uppercase" }}>{entry.section}</div>
                  <div style={{ color: accent, fontSize: 10.2, fontWeight: 900, marginTop: 7, textTransform: "uppercase" }}>Senior Answer</div>
                  <div className="java-digest-refresher-answer" style={{ color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.58, marginTop: 6 }}>
                    <MessageContent content={entry.answer} />
                  </div>
                  <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                    <ChipButton label={refresherProgress.bookmarkedQuestions.has(entry.id) ? "Bookmarked" : "Bookmark"} icon="ti-bookmark" active={refresherProgress.bookmarkedQuestions.has(entry.id)} accent="var(--jd-warning)" onClick={() => toggleRefresherStatus("bookmarkedQuestions", entry.id)} />
                    <ChipButton label={refresherProgress.reviewedQuestions.has(entry.id) ? "Reviewed" : "Mark Reviewed"} icon="ti-check" active={refresherProgress.reviewedQuestions.has(entry.id)} accent={accent} onClick={() => toggleRefresherStatus("reviewedQuestions", entry.id)} />
                    <ChipButton label={refresherProgress.masteredQuestions.has(entry.id) ? "Mastered" : "Mark Mastered"} icon="ti-award" active={refresherProgress.masteredQuestions.has(entry.id)} accent="var(--jd-accent-alt)" onClick={() => toggleRefresherStatus("masteredQuestions", entry.id)} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeView === "Java Curriculum" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Java Competitive Programming Curriculum</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25 }}>A complete, original Java practice path from fundamentals to advanced algorithms</h3>
            <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5 }}>
              Work through Basic Techniques, Graph Algorithms, and Advanced Topics. Every chapter includes Java implementation checkpoints, complexity prompts, worked examples, and a focused study action.
            </p>
          </section>
          <FresherDsaPlaybook accent={accent} />
          {CSES_JAVA_PARTS.map((part) => <CsesPartSection key={part.id} part={part} accent={accent} expanded={expandedPartId === part.id} expandedChapterId={expandedChapterId} onAction={onAction} onToggleChapter={toggleExpandedChapter} onTogglePart={() => toggleExpandedPart(part.id)} />)}
        </div>
      )}

      {activeView === "Java + Spring" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Guided technical curriculum</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25 }}>Java, Spring Framework, and Spring Boot</h3>
            <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5 }}>
              This is a complete progression for everyone: start with language foundations, deepen your design judgement, then move into Spring and production operations. The existing Senior Refresher adds Java 21, JVM, concurrency, architecture, and interview-level trade-offs. For every lesson, read the mental model, picture the example, answer the recall question without looking, and complete the drill.
            </p>
          </section>
          <div style={responsiveGrid(280, 10)}>
            {JAVA_SPRING_STUDY_PATHS.map((path) => <StudyPathCard key={path.id} path={path} accent={accent} expanded={expandedStudyPathId === path.id} completedIds={learningProgress.completedIds} bookmarkedIds={learningProgress.bookmarkedIds} onToggleStatus={toggleLearningStatus} onToggle={() => setExpandedStudyPathId((current) => current === path.id ? "" : path.id)} />)}
          </div>
        </div>
      )}

      {activeView === "Quick Reference" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Daily revision sheets</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25 }}>Quick Reference + Self-Check</h3>
            <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5 }}>Read the three rules, close the card, and answer the self-check from memory. Return to a card tomorrow and one week later.</p>
          </section>
          <div style={responsiveGrid(280, 10)}>{JAVA_QUICK_REFERENCE.map((reference) => <QuickReferenceCard key={reference.id} reference={reference} accent={accent} completedIds={learningProgress.completedIds} bookmarkedIds={learningProgress.bookmarkedIds} onToggleStatus={toggleLearningStatus} />)}</div>
        </div>
      )}

      {activeView === "Tutorial Library" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Curated tutorial library · {JAVA_CURATED_TUTORIAL_CATALOG.length} chapters · {dueReviewCount} due for review</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25 }}>Searchable Java and Spring Tutorial Library</h3>
            <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5 }}>Browse by category and level. Each card is a compact starting point; open the AI topic search for a deeper explanation and code walkthrough.</p>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, marginTop: 3 }}>
              <input value={tutorialSearch} onChange={(event) => setTutorialSearch(event.target.value)} className="glass-input" placeholder="Find a topic..." aria-label="Find a Java tutorial" style={{ background: "var(--jd-surface-sunken)", border: `1px solid ${accentBorder}`, borderRadius: 7, color: "var(--jd-text)", fontSize: 11.5, minHeight: 31, minWidth: 190, padding: "6px 8px" }} />
              <ChipButton label="All topics" icon="ti-layout-grid" active={tutorialCategory === "all"} accent={accent} onClick={() => setTutorialCategory("all")} />
              {tutorialCategories.map((category) => <ChipButton key={category} label={category} icon="ti-tag" active={tutorialCategory === category} accent={accent} onClick={() => setTutorialCategory(category)} />)}
              <ChipButton label="All levels" icon="ti-adjustments" active={tutorialLevel === "all"} accent={accent} onClick={() => setTutorialLevel("all")} />
              {tutorialLevels.map((level) => <ChipButton key={level} label={level} icon="ti-chart-dots" active={tutorialLevel === level} accent={accent} onClick={() => setTutorialLevel(level)} />)}
              <ChipButton label="Saved" icon="ti-bookmark" active={tutorialSavedFilter === "saved"} accent="var(--jd-warning)" onClick={() => setTutorialSavedFilter(tutorialSavedFilter === "saved" ? "all" : "saved")} />
              <ChipButton label="Unfinished" icon="ti-progress" active={tutorialSavedFilter === "unfinished"} accent={accent} onClick={() => setTutorialSavedFilter(tutorialSavedFilter === "unfinished" ? "all" : "unfinished")} />
              <span style={{ color: "var(--jd-text-muted)", fontSize: 10.8 }}>{visibleTutorials.length} shown</span>
            </div>
          </section>
          <JavaDigestReviewQueue dueTutorials={dueTutorials} dueReviewCount={dueReviewCount} accent={accent} onOpen={(tutorial) => { setTutorialSearch(tutorial.title); setTutorialSavedFilter("all"); }} />
          {lastOpenedTutorial && <section style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: 10 }}><span style={{ color: "var(--jd-text-soft)", fontSize: 11.2 }}>Continue reading: <b style={{ color: "var(--jd-text)" }}>{lastOpenedTutorial.title}</b></span><button type="button" className="glass-button" onClick={() => openTutorial(lastOpenedTutorial)} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 10.5, padding: "5px 8px" }}>Resume</button></section>}
          <div style={responsiveGrid(260, 9)}>{visibleTutorials.map((tutorial) => <JavaDigestTutorialCard key={tutorial.id} tutorial={tutorial} accent={accent} completedIds={learningProgress.completedIds} bookmarkedIds={learningProgress.bookmarkedIds} onToggleStatus={toggleLearningStatus} onOpen={openTutorial} />)}</div>
          <section style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 7, padding: 11 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Java release guide</div>
            {JAVA_VERSION_TOPIC_GUIDE.map((release) => <div key={release.version} style={{ color: "var(--jd-text-soft)", fontSize: 11.3, lineHeight: 1.45 }}><b style={{ color: "var(--jd-text)" }}>{release.version}:</b> {release.topics} — {release.focus}.</div>)}
          </section>
        </div>
      )}

      {activeView === "Practice Lab" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Programs · quizzes · interview readiness</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25 }}>Practice one small thing at a time</h3>
            <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5 }}>Implement a program, state the invariant and complexity, then use a quiz question to check whether the concept is understood—not just memorized.</p>
          </section>
          <div style={responsiveGrid(280, 9)}>{JAVA_PROGRAM_EXAMPLES.map((program) => <article key={program.id} className="java-digest-card" style={{ ...wrap, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}><div style={{ color: accent, fontSize: 10.2, fontWeight: 900, textTransform: "uppercase" }}>{program.level}</div><h4 style={{ ...wrap, color: "var(--jd-text)", fontSize: 13, margin: 0 }}>{program.title}</h4><p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.45, margin: 0 }}>{program.prompt}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}><ChipButton label={learningProgress.completedIds.has(program.id) ? "Completed" : "Mark complete"} icon="ti-check" active={learningProgress.completedIds.has(program.id)} accent={accent} onClick={() => toggleLearningStatus("completedPrograms", program.id)} /><ChipButton label={learningProgress.bookmarkedIds.has(program.id) ? "Bookmarked" : "Bookmark"} icon="ti-bookmark" active={learningProgress.bookmarkedIds.has(program.id)} accent="var(--jd-warning)" onClick={() => toggleLearningStatus("bookmarkedPrograms", program.id)} /><button type="button" className="glass-button" onClick={() => onAction?.(`Help me implement ${program.title} in Java. ${program.prompt}`, { type: "javaCodeRunner", program })} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "var(--jd-text)", fontSize: 10.5, padding: "5px 7px" }}><i className="ti ti-player-play" style={{ color: accent, marginRight: 4 }} />Open runner</button></div></article>)}</div>
          <div style={{ display: "grid", gap: 8 }}>{JAVA_QUIZ_BANK.map((quiz) => <details key={quiz.id} style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 8, padding: "9px 10px" }}><summary style={{ color: "var(--jd-text)", cursor: "pointer", fontSize: 11.8, fontWeight: 800 }}>{quiz.topic}: {quiz.question}</summary><p style={{ color: "var(--jd-text-soft)", fontSize: 11.2, lineHeight: 1.5, margin: "7px 0 0" }}><b style={{ color: accent }}>Answer:</b> {quiz.answer}</p><StarAnswer story={buildStarFrame(quiz.topic, quiz.answer)} accent={accent} label="How to frame it in STAR" /><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}><ChipButton label={learningProgress.completedIds.has(quiz.id) ? "Completed" : "Mark complete"} icon="ti-check" active={learningProgress.completedIds.has(quiz.id)} accent={accent} onClick={() => toggleLearningStatus("completedQuizzes", quiz.id)} /><ChipButton label={learningProgress.bookmarkedIds.has(quiz.id) ? "Bookmarked" : "Bookmark"} icon="ti-bookmark" active={learningProgress.bookmarkedIds.has(quiz.id)} accent="var(--jd-warning)" onClick={() => toggleLearningStatus("bookmarkedQuizzes", quiz.id)} /></div></details>)}</div>
        </div>
      )}

      {activeView === "Saved & Review" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Learning inbox</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 15.5, lineHeight: 1.25 }}>Saved material and due reviews</h3>
            <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5 }}>{savedTutorials.length} saved tutorials · {dueReviewCount} due reviews. Use this as your daily starting point.</p>
          </section>
          {dueTutorials.length > 0 && <section style={{ ...wrap, background: "var(--jd-surface-subtle)", border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 7, padding: 11 }}><strong style={{ color: accent, fontSize: 11.5 }}>Due now</strong>{dueTutorials.map((tutorial) => <div key={tutorial.id} style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}><span style={{ color: "var(--jd-text-soft)", fontSize: 11.2 }}>{tutorial.title}</span><ChipButton label="Open" icon="ti-book-open" active={false} accent={accent} onClick={() => { setActiveView("Tutorial Library"); openTutorial(tutorial); }} /></div>)}</section>}
          <section style={{ display: "grid", gap: 8 }}>{savedTutorials.length ? savedTutorials.map((tutorial) => <JavaDigestTutorialCard key={tutorial.id} tutorial={tutorial} accent={accent} completedIds={learningProgress.completedIds} bookmarkedIds={learningProgress.bookmarkedIds} onToggleStatus={toggleLearningStatus} onOpen={openTutorial} />) : <div style={{ color: "var(--jd-text-muted)", fontSize: 12, padding: 12 }}>Bookmark a tutorial, program, or quiz to build your saved learning inbox.</div>}</section>
        </div>
      )}

      {activeView === "Articles" && (
        <div style={{ display: "grid", gap: 10 }}>
          <Head>
            <title>{selectedArticle ? `${selectedArticle.title} | ShadowUI Java Digest` : "Java Interview Articles | ShadowUI"}</title>
            <meta name="description" content={selectedArticle?.summary || "Original Java, Spring, JVM, concurrency, SQL, and system design interview lessons."} />
            {selectedArticle && <link rel="canonical" href={`${typeof window !== "undefined" ? window.location.origin : ""}${router.pathname}?article=${selectedArticle.id}`} />}
          </Head>
          <section style={{ ...wrap, border: "1px solid var(--jd-border)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
            <span style={{ color: "var(--jd-text-muted)", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Article Filters</span>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
              <ChipButton label="All Articles" icon="ti-layout-grid" active={activeTrack === "all"} accent={accent} onClick={() => { setActiveTrack("all"); setExpandedArticleId(""); }} />
              {JAVA_DIGEST_TRACKS.map((track) => (
                <ChipButton
                  key={track.id}
                  label={track.label}
                  icon={track.icon}
                  active={activeTrack === track.id}
                  accent={accent}
                  onClick={() => { setActiveTrack(track.id); setExpandedArticleId(""); }}
                />
              ))}
            </div>
          </section>
          <div style={responsiveGrid(280, 10)}>
            {articles.map((article, index) => <ArticleCard key={article.id} article={article} accent={accent} expanded={expandedArticleId === article.id} previousArticle={articles[index - 1]} nextArticle={articles[index + 1]} onNavigate={navigateArticle} onAction={onAction} onToggle={() => { const next = expandedArticleId === article.id ? "" : article.id; setExpandedArticleId(next); if (next) router.push({ pathname: router.pathname, query: { ...router.query, article: next } }, undefined, { shallow: true }); }} />)}
          </div>
        </div>
      )}

      {activeView === "Roadmaps" && (
        <div style={responsiveGrid(280, 10)}>
          {JAVA_DIGEST_ROADMAPS.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} accent={accent} expanded={expandedRoadmapId === roadmap.id} onAction={onAction} onToggle={() => setExpandedRoadmapId((current) => current === roadmap.id ? "" : roadmap.id)} />)}
        </div>
      )}
    </section>
  );
}
