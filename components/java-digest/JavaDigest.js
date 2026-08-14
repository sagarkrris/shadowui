import { useEffect, useMemo, useState } from "react";
import {
  CSES_JAVA_PARTS,
  FRESHER_DSA_PLAYBOOK,
  JAVA_DIGEST_ROADMAPS,
  JAVA_DIGEST_TRACKS,
  JAVA_DIGEST_VERSION,
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
import MessageContent from "../chat/MessageContent";

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
  "Java Curriculum": {
    title: "Competitive Programming in Java",
    description: "A complete Java practice curriculum for algorithms, data structures, graphs, and advanced topics.",
  },
  "Senior Refresher": {
    title: "Senior Java Interview Refresher",
    description: "Practice Java 21, JVM, concurrency, architecture, and production judgement.",
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

function ArticleCard({ article, accent, expanded, onAction, onToggle }) {
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
          <section style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}2f`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <div style={{ color: accent, fontSize: 10.8, fontWeight: 900, textTransform: "uppercase" }}>Beginner Explainer</div>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>What is this?</strong> {beginnerContext.what}</p>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>Why does it matter?</strong> {beginnerContext.why}</p>
            <p style={{ color: "var(--jd-text-soft)", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "var(--jd-text)" }}>Where is it used?</strong> {beginnerContext.where}</p>
          </section>

          <div style={responsiveGrid(220, 9)}>
            <DetailList title="What To Learn" icon="ti-list-check" items={article.learn} accent={accent} />
            <DetailList title="Interview Questions" icon="ti-message-question" items={article.questions} accent="var(--jd-accent-alt)" />
          </div>

          <InterviewDrillCard article={article} accent={accent} onAction={onAction} />
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
        <p style={{ ...wrap, color: "var(--jd-text-muted)", fontSize: 11.6, lineHeight: 1.5, margin: "6px 0 0" }}>Use this before every problem: understand the constraints, name the pattern, prove the invariant, code the smallest correct version, and test the edges.</p>
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

export default function JavaDigest({ theme = {}, onAction, onRefresherProgressChange, profile = null, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange, onActivity, progress = {} }) {
  const [activeTrack, setActiveTrack] = useState("all");
  const [activeView, setActiveView] = useState("Java Curriculum");
  const [expandedPartId, setExpandedPartId] = useState(CSES_JAVA_PARTS[0]?.id || "");
  const [expandedChapterId, setExpandedChapterId] = useState("");
  const [expandedArticleId, setExpandedArticleId] = useState("");
  const [expandedRoadmapId, setExpandedRoadmapId] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [refresherQuestions, setRefresherQuestions] = useState([]);
  const [refresherLoading, setRefresherLoading] = useState(false);
  const [refresherError, setRefresherError] = useState("");
  const [refresherFilter, setRefresherFilter] = useState("");
  const [selectedRefresherSection, setSelectedRefresherSection] = useState("all");
  const [randomQuestionId, setRandomQuestionId] = useState("");
  const [expandedRefresherQuestionId, setExpandedRefresherQuestionId] = useState("");
  const [practiceQuestionId, setPracticeQuestionId] = useState("");
  const [practiceResponse, setPracticeResponse] = useState("");
  const [practiceAnswerRevealed, setPracticeAnswerRevealed] = useState(false);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";
  const articles = useMemo(() => listJavaDigestArticles(activeTrack), [activeTrack]);
  const viewMetadata = VIEW_METADATA[activeView] || VIEW_METADATA["Java Curriculum"];
  const competencySummary = useMemo(
    () => buildJavaDigestCompetencySummary({ progress, selectedTrackId: activeTrack }),
    [progress, activeTrack],
  );
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
    { label: "Senior Refresher", icon: "ti-bolt" },
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
    generateAnswer(searchDraft);
  };
  const toggleExpandedChapter = (chapterId) => setExpandedChapterId((current) => current === chapterId ? "" : chapterId);
  const toggleExpandedPart = (partId) => {
    setExpandedPartId((current) => current === partId ? "" : partId);
    setExpandedChapterId("");
  };
  const toggleRefresherStatus = (field, questionId) => {
    onRefresherProgressChange?.((previous = {}) => {
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
    onRefresherProgressChange?.((previous = {}) => ({
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

      {activeView === "Senior Refresher" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "var(--jd-accent-surface)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 7, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Java 21 · JVM · Concurrency</div>
            <h3 style={{ ...wrap, color: "var(--jd-text)", fontSize: 16, lineHeight: 1.25 }}>Complete Java Senior Refresher</h3>
            <p style={{ ...wrap, color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.55, margin: 0 }}>
              The PDF&apos;s senior interview questions and answer blocks are presented below verbatim as searchable study cards. The guide itself is not embedded.
            </p>
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
              <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Verbatim Q&A Bank</div>
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
                  <p style={{ color: "var(--jd-text-soft)", fontSize: 11.7, lineHeight: 1.58, margin: "6px 0 0" }}>{entry.answer}</p>
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

      {activeView === "Articles" && (
        <div style={{ display: "grid", gap: 10 }}>
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
            {articles.map((article) => <ArticleCard key={article.id} article={article} accent={accent} expanded={expandedArticleId === article.id} onAction={onAction} onToggle={() => setExpandedArticleId((current) => current === article.id ? "" : article.id)} />)}
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
