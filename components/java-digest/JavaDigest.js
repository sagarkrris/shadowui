import { useMemo, useState } from "react";
import {
  CSES_JAVA_PARTS,
  JAVA_DIGEST_ROADMAPS,
  JAVA_DIGEST_TRACKS,
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

function ChipButton({ label, icon, active, onClick, accent }) {
  return (
    <button
      type="button"
      className={active ? "glass-button" : ""}
      onClick={onClick}
      aria-label={label}
      style={{
        alignItems: "center",
        background: active ? "rgba(139,211,255,.12)" : "rgba(0,0,0,.14)",
        border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
        borderRadius: 7,
        color: active ? "#f8fbff" : "#9fb0c7",
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
      <i className={`ti ${icon}`} style={{ color: active ? accent : "#9fb0c7", fontSize: 14 }} />
      {label}
    </button>
  );
}

function DetailList({ title, icon, items, accent }) {
  return (
    <section style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 10 }}>
      <h4 style={{ ...wrap, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 12, gap: 6, marginBottom: 7 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h4>
      <ul style={{ ...wrap, color: "#9fb0c7", display: "grid", fontSize: 11.4, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
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
    <section style={{ ...wrap, background: "rgba(0,0,0,.16)", border: `1px solid ${accent}28`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Interview Drill Card</div>
      <div style={responsiveGrid(170, 8)}>
        <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 8 }}>
          <strong style={{ color: "#a7f3d0", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Explain</strong>
          <span style={{ color: "#dbeafe", fontSize: 11.2, lineHeight: 1.4 }}>{drill.explain}</span>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 8 }}>
          <strong style={{ color: "#facc15", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Trap</strong>
          <span style={{ color: "#dbeafe", fontSize: 11.2, lineHeight: 1.4 }}>{drill.trap}</span>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 8 }}>
          <strong style={{ color: "#c4b5fd", display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Follow-up</strong>
          <span style={{ color: "#dbeafe", fontSize: 11.2, lineHeight: 1.4 }}>{drill.followUp}</span>
        </div>
      </div>
      <code style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, color: "#d1fae5", display: "block", fontSize: 11, lineHeight: 1.45, padding: 8, whiteSpace: "pre-wrap" }}>{drill.snippet}</code>
      <button type="button" className="glass-button" onClick={start} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
        <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
        Start Drill Card
      </button>
    </section>
  );
}

function GeneratedAnswerPanel({ answer, error, loading, query, accent, onRetry }) {
  const hasQuery = Boolean(query.trim());

  return (
    <section style={{ ...wrap, background: "rgba(255,255,255,.045)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>AI Interview Explainer</div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>
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
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 12, lineHeight: 1.55 }}>
          Type a topic like interface, deserialization, segment tree, dynamic programming, Spring transactions, or Java memory model, then press Enter.
        </p>
      )}

      {loading && !answer && (
        <p style={{ ...wrap, color: "#cbd5e1", fontSize: 12, lineHeight: 1.55 }}>
          Building a polished answer with direct explanation, interview framing, examples, traps, follow-ups, and DSA/competitive-programming angles where relevant.
        </p>
      )}

      {answer && (
        <div className="glass-card" style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 12 }}>
          <MessageContent content={answer} />
        </div>
      )}

      {error && (
        <div role="alert" style={{ ...wrap, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", borderRadius: 8, color: "#fecaca", display: "grid", fontSize: 12, gap: 8, lineHeight: 1.45, padding: 10 }}>
          {error}
          {hasQuery && (
            <button type="button" className="glass-button" onClick={onRetry} style={{ border: "1px solid rgba(248,113,113,.32)", borderRadius: 7, color: "#fee2e2", fontSize: 11, fontWeight: 900, justifySelf: "start", padding: "7px 10px" }}>
              <i className="ti ti-refresh" style={{ marginRight: 6 }} />
              Retry
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function ArticleCard({ article, accent, onAction }) {
  const track = getJavaDigestTrack(article.trackId);
  const coach = () => {
    onAction?.(buildJavaDigestCoachPrompt(article.id), { type: "javaDigestCoach", article, track });
  };
  const mock = () => {
    onAction?.(buildJavaDigestMockPrompt(article.id), { type: "javaDigestMock", article, track });
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {track.label} · {article.format}
          </div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25, marginTop: 4 }}>{article.title}</h3>
        </div>
        <span style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 999, color: "#cbd5e1", flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: "3px 7px", whiteSpace: "nowrap" }}>
          {article.readMinutes} min
        </span>
      </div>

      <p style={{ ...wrap, color: "#cbd5e1", fontSize: 12, lineHeight: 1.55 }}>{article.summary}</p>

      <div style={responsiveGrid(220, 9)}>
        <DetailList title="What To Learn" icon="ti-list-check" items={article.learn} accent={accent} />
        <DetailList title="Interview Questions" icon="ti-message-question" items={article.questions} accent="#c4b5fd" />
      </div>

      <InterviewDrillCard article={article} accent={accent} onAction={onAction} />

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
        <span style={{ border: "1px solid rgba(250,204,21,.3)", borderRadius: 999, color: "#fde68a", fontSize: 10.5, fontWeight: 900, padding: "3px 7px" }}>{article.level}</span>
        <button type="button" className="glass-button" onClick={coach} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-school" style={{ color: accent, marginRight: 6 }} />
          Coach Me
        </button>
        <button type="button" className="glass-button" onClick={mock} style={{ border: "1px solid rgba(196,181,253,.38)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
          Mock Drill
        </button>
      </div>
    </article>
  );
}

function RoadmapCard({ roadmap, accent, onAction }) {
  const start = () => {
    onAction?.(buildJavaDigestRoadmapPrompt(roadmap.id), { type: "javaDigestRoadmap", roadmap });
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={wrap}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{roadmap.audience}</div>
        <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15, lineHeight: 1.25, marginTop: 4 }}>{roadmap.title}</h3>
      </div>
      <ol style={{ ...wrap, color: "#9fb0c7", display: "grid", fontSize: 11.5, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 18 }}>
        {roadmap.days.map((day) => <li key={day}>{day}</li>)}
      </ol>
      <button type="button" className="glass-button" onClick={start} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
        <i className="ti ti-calendar-stats" style={{ color: accent, marginRight: 6 }} />
        Build My Plan
      </button>
    </article>
  );
}

function CsesChapterCard({ chapter, accent, onAction }) {
  const [expanded, setExpanded] = useState(chapter.id === "time-complexity-java");
  const detail = getCsesJavaChapterDetail(chapter);
  const startPractice = () => {
    onAction?.(buildCsesJavaPracticePrompt(chapter.id), { type: "csesJavaTrack", csesTrack: chapter });
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.085)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "flex-start", display: "grid", gap: 9, gridTemplateColumns: "auto 1fr auto", minWidth: 0 }}>
        <span style={{ alignItems: "center", background: "rgba(139,211,255,.1)", border: `1px solid ${accent}44`, borderRadius: 7, color: accent, display: "inline-flex", fontSize: 12, fontWeight: 950, height: 34, justifyContent: "center", minWidth: 38 }}>
          {chapter.chapter}
        </span>
        <div style={{ ...wrap, alignSelf: "center" }}>
          <div style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            Part {chapter.part} · {chapter.partTitle}
          </div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25, marginTop: 3 }}>{chapter.title}</h3>
        </div>
        <span style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 999, color: "#cbd5e1", flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
          {chapter.difficulty}
        </span>
      </div>

      <div style={responsiveGrid(230, 9)}>
        <DetailList title="Book Sections" icon="ti-book" items={chapter.sections} accent={accent} />
        <DetailList title="Java Drills" icon="ti-cup" items={chapter.javaDrills} accent="#a7f3d0" />
      </div>

      <section style={{ ...wrap, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
        <div style={wrap}>
          <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Detailed Explanation</h4>
          <p style={{ ...wrap, color: "#dbeafe", fontSize: 11.7, lineHeight: 1.55, margin: 0 }}>{detail.explanation}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>How To Think About It</h4>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.reasoning}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Java Implementation Notes</h4>
          <p style={{ ...wrap, color: "#d1fae5", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.javaApproach}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Worked Example</h4>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.workedExample}</p>
        </div>
        <div style={wrap}>
          <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Java Sketch</h4>
          <code style={{ ...wrap, color: "#d1fae5", display: "block", fontSize: 11.2, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{detail.codeSketch}</code>
        </div>
        {expanded && (
          <div style={{ ...wrap, background: "rgba(139,211,255,.055)", border: `1px solid ${accent}22`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
            <div style={wrap}>
              <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Deep Study Path</h4>
              <ol style={{ ...wrap, color: "#cbd5e1", display: "grid", fontSize: 11.5, gap: 5, lineHeight: 1.5, margin: 0, paddingLeft: 18 }}>
                {detail.stepByStep.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
            <div style={wrap}>
              <h4 style={{ color: "#f8fbff", fontSize: 12, marginBottom: 6 }}>Interview Answer</h4>
              <p style={{ ...wrap, color: "#dbeafe", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{detail.interviewAnswer}</p>
            </div>
            <div style={responsiveGrid(220, 9)}>
              <DetailList title="Common Mistakes" icon="ti-alert-triangle" items={detail.commonMistakes} accent="#fca5a5" />
              <DetailList title="Practice Tasks" icon="ti-target-arrow" items={detail.practiceTasks} accent="#c4b5fd" />
            </div>
          </div>
        )}
      </section>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" className="glass-button" onClick={() => setExpanded((value) => !value)} style={{ border: "1px solid rgba(255,255,255,.16)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className={`ti ${expanded ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ color: accent, marginRight: 6 }} />
          {expanded ? "Show Less" : "Explain More"}
        </button>
        <button type="button" className="glass-button" onClick={startPractice} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
          Study Chapter in Java
        </button>
      </div>
    </article>
  );
}

function CsesPartSection({ part, accent, onAction }) {
  return (
    <section style={{ ...wrap, border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ ...wrap, alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between" }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>Part {part.part}</div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 17, lineHeight: 1.25, marginTop: 3 }}>{part.title}</h3>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.7, lineHeight: 1.5, marginTop: 6 }}>{part.summary}</p>
        </div>
        <span style={{ border: `1px solid ${accent}44`, borderRadius: 999, color: accent, flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
          {part.chapters.length} chapters
        </span>
      </header>
      <div style={responsiveGrid(330, 10)}>
        {part.chapters.map((chapter) => (
          <CsesChapterCard key={chapter.id} chapter={{ ...chapter, part: part.part, partTitle: part.title }} accent={accent} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

export default function JavaDigest({ theme = {}, onAction, profile = null, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange, onActivity }) {
  const [activeTrack, setActiveTrack] = useState("all");
  const [activeView, setActiveView] = useState("Handbook Java");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedAnswer, setGeneratedAnswer] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";
  const articles = useMemo(() => listJavaDigestArticles(activeTrack), [activeTrack]);
  const tabs = [
    { label: "Handbook Java", icon: "ti-book-2" },
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

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        color: "#eef4ff",
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
          <h2 style={{ ...wrap, color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Competitive Programmer&apos;s Handbook for Java</h2>
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

      <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
        <form onSubmit={submitSearch} style={{ ...wrap, display: "grid", gap: 6 }}>
          <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Search Interview Topic</span>
          <div style={{ alignItems: "center", background: "rgba(0,0,0,.16)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "flex", gap: 8, minWidth: 0, padding: "8px 10px" }}>
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
              style={{ background: "transparent", border: "none", color: "#f8fbff", flex: 1, fontSize: 13, minWidth: 0, outline: "none", padding: 0 }}
            />
            <button
              type="submit"
              disabled={searchLoading || !searchDraft.trim()}
              className="glass-button"
              style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", cursor: searchLoading || !searchDraft.trim() ? "not-allowed" : "pointer", flexShrink: 0, fontSize: 11, fontWeight: 900, opacity: searchLoading || !searchDraft.trim() ? .45 : 1, padding: "6px 9px" }}
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

      {activeView === "Handbook Java" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, background: "rgba(139,211,255,.055)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Competitive Programmer&apos;s Handbook · Java Adaptation</div>
            <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25 }}>Book-style table of contents, rewritten as Java practice chapters</h3>
            <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.6, lineHeight: 1.5 }}>
              This follows the public CSES handbook structure at a high level: Basic Techniques, Graph Algorithms, and Advanced Topics. Each chapter adds Java implementation checkpoints, complexity prompts, and a study action.
            </p>
            <a href="https://cses.fi/book/book.pdf" target="_blank" rel="noreferrer" style={{ color: accent, fontSize: 11.5, fontWeight: 900, justifySelf: "start", textDecoration: "none" }}>
              Open original CSES PDF
            </a>
          </section>
          {CSES_JAVA_PARTS.map((part) => <CsesPartSection key={part.id} part={part} accent={accent} onAction={onAction} />)}
        </div>
      )}

      {activeView === "Articles" && (
        <div style={{ display: "grid", gap: 10 }}>
          <section style={{ ...wrap, border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Article Filters</span>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
              <ChipButton label="All Articles" icon="ti-layout-grid" active={activeTrack === "all"} accent={accent} onClick={() => setActiveTrack("all")} />
              {JAVA_DIGEST_TRACKS.map((track) => (
                <ChipButton
                  key={track.id}
                  label={track.label}
                  icon={track.icon}
                  active={activeTrack === track.id}
                  accent={accent}
                  onClick={() => setActiveTrack(track.id)}
                />
              ))}
            </div>
          </section>
          <div style={responsiveGrid(280, 10)}>
            {articles.map((article) => <ArticleCard key={article.id} article={article} accent={accent} onAction={onAction} />)}
          </div>
        </div>
      )}

      {activeView === "Roadmaps" && (
        <div style={responsiveGrid(280, 10)}>
          {JAVA_DIGEST_ROADMAPS.map((roadmap) => <RoadmapCard key={roadmap.id} roadmap={roadmap} accent={accent} onAction={onAction} />)}
        </div>
      )}
    </section>
  );
}
