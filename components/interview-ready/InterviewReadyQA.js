import { useEffect, useMemo, useState } from "react";
import BeginnerGuideBanner from "../BeginnerGuideBanner";
import { loadVersionedState, saveVersionedState } from "../../lib/localStateStore.mjs";
import {
  INTERVIEW_READY_QA_CATEGORIES,
  INTERVIEW_READY_QA_DIFFICULTIES,
  buildInterviewReadyMockPrompt,
  buildInterviewReadyTailorPrompt,
  getInterviewReadyCategory,
  getInterviewReadyQuestion,
  listInterviewReadyQuestions,
} from "../../lib/interviewReadyQa.mjs";
import {
  INTERVIEW_READY_PRACTICE_STORAGE_KEY,
  INTERVIEW_READY_PRACTICE_STORAGE_VERSION,
  buildInterviewReadyCompanyPack,
  createInterviewReadyPracticeState,
  evaluateInterviewReadyAnswer,
  saveInterviewReadyAnswer,
  setInterviewReadyCompany,
  setInterviewReadySelectedQuestion,
} from "../../lib/interviewReadyPractice.mjs";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const TIMER_OPTIONS = [60, 90, 120];
const TEXT_SCALE_MIN = 0.9;
const TEXT_SCALE_MAX = 1.2;
const TEXT_SCALE_STEP = 0.1;

const responsiveGrid = (minColumnWidth, gap = 10) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

function SectionToggle({ title, eyebrow, open, accent, onToggle, children, compact = false, defaultOpenNote = "" }) {
  return (
    <section style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: open ? (compact ? 8 : 12) : 0, padding: compact ? 8 : 12 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ alignItems: "center", background: "transparent", border: "none", color: "#f8fbff", cursor: "pointer", display: "flex", gap: 10, justifyContent: "space-between", padding: 0, textAlign: "left", width: "100%" }}
      >
        <div style={{ minWidth: 0 }}>
          {eyebrow ? <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{eyebrow}</div> : null}
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25, marginTop: eyebrow ? 4 : 0 }}>{title}</h3>
          {!open && defaultOpenNote ? <p style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45, margin: "4px 0 0" }}>{defaultOpenNote}</p> : null}
        </div>
        <span style={{ alignItems: "center", border: `1px solid ${accent}44`, borderRadius: 999, color: accent, display: "inline-flex", flexShrink: 0, fontSize: 10.5, fontWeight: 900, gap: 5, padding: "4px 8px" }}>
          <i className={`ti ${open ? "ti-chevron-up" : "ti-chevron-down"}`} />
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? children : null}
    </section>
  );
}

function formatTimer(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function FilterChip({ label, icon, active, accent, onClick }) {
  return (
    <button
      type="button"
      className={active ? "glass-button" : ""}
      onClick={onClick}
      aria-label={label}
      style={{
        alignItems: "center",
        background: active ? "rgba(139,211,255,.12)" : "rgba(255,255,255,.035)",
        border: `1px solid ${active ? accent : "rgba(255,255,255,.08)"}`,
        borderRadius: 7,
        color: active ? "#f8fbff" : "#9fb0c7",
        cursor: "pointer",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 800,
        gap: 6,
        minHeight: 31,
        padding: "7px 10px",
      }}
    >
      {icon ? <i className={`ti ${icon}`} style={{ color: active ? accent : "#9fb0c7", fontSize: 14 }} /> : null}
      {label}
    </button>
  );
}

function HighlightedText({ text, query }) {
  const needle = query?.trim();
  if (!needle) return text;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "ig")).map((part, index) => part.toLowerCase() === needle.toLowerCase()
    ? <mark key={`${part}-${index}`} style={{ background: "#fde68a", color: "#172033", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
    : part);
}

function AnswerList({ title, icon, items, accent, color = "#cbd5e1" }) {
  return (
    <section style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 10 }}>
      <h4 style={{ ...wrap, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 12, gap: 6, marginBottom: 7 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h4>
      <ul style={{ ...wrap, color, display: "grid", fontSize: 11.4, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function RubricPanel({ evaluation, accent }) {
  if (!evaluation) return null;

  return (
    <section style={{ ...wrap, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Practice feedback</div>
          <h3 style={{ color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25, marginTop: 4 }}>Interview answer score: {evaluation.overall}/10</h3>
        </div>
        <span style={{ border: `1px solid ${accent}55`, borderRadius: 999, color: accent, fontSize: 10.5, fontWeight: 900, padding: "4px 8px" }}>
          Local rubric
        </span>
      </div>
      <div style={responsiveGrid(150, 8)}>
        {evaluation.rubric.map((item) => (
          <div key={item.key} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 4, padding: 9 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase" }}>{item.label}</span>
            <strong style={{ color: "#f8fbff", fontSize: 16 }}>{item.score}/10</strong>
          </div>
        ))}
      </div>
      <div style={responsiveGrid(220, 9)}>
        <AnswerList title="What is working" icon="ti-sparkles" items={evaluation.strengths.length ? evaluation.strengths : ["Build one clearer example and one trade-off to strengthen this answer."]} accent="#86efac" color="#d1fae5" />
        <AnswerList title="What to improve" icon="ti-target-arrow" items={evaluation.gaps.length ? evaluation.gaps : ["No major gaps detected. Rehearse delivery and keep the answer natural."]} accent="#facc15" color="#fef3c7" />
        <AnswerList title="Too robotic?" icon="ti-cpu" items={evaluation.roboticSignals.length ? evaluation.roboticSignals : ["This answer does not currently read as overly scripted."]} accent="#c4b5fd" />
        <AnswerList title="Too vague?" icon="ti-focus-2" items={evaluation.vagueSignals.length ? evaluation.vagueSignals : ["The answer has enough concrete detail for a first pass."]} accent="#fca5a5" color="#fecaca" />
      </div>
      <p style={{ color: "#dbeafe", fontSize: 11.6, lineHeight: 1.55, margin: 0 }}>{evaluation.suggestedNextStep}</p>
    </section>
  );
}

function CompanyPackPanel({ companyPack, accent, onUsePackPrompt, onSelectQuestion }) {
  return (
    <section style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Company-wise packs</div>
          <h3 style={{ color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25, marginTop: 4 }}>{companyPack.company} prep packs</h3>
        </div>
        <span style={{ border: `1px solid ${accent}55`, borderRadius: 999, color: accent, fontSize: 10.5, fontWeight: 900, padding: "4px 8px" }}>{companyPack.company}</span>
      </div>
      <p style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.5, margin: 0 }}>{companyPack.caveat}</p>
      <div style={responsiveGrid(240, 10)}>
        {companyPack.packs.map((pack) => (
          <article key={pack.id} style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
            <strong style={{ color: "#f8fbff", fontSize: 12.5 }}>{pack.label}</strong>
            <div style={{ display: "grid", gap: 7 }}>
              {pack.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUsePackPrompt(item)}
                  style={{ alignItems: "flex-start", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, color: "#dbeafe", cursor: "pointer", display: "grid", gap: 4, padding: "8px 9px", textAlign: "left" }}
                >
                  <span style={{ color: accent, fontSize: 10.2, fontWeight: 900, textTransform: "uppercase" }}>{item.type}</span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.45 }}>{item.title}</span>
                </button>
              ))}
            </div>
            <button type="button" className="glass-button" onClick={() => onSelectQuestion(pack.items[0])} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 10.8, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
              <i className="ti ti-edit" style={{ color: accent, marginRight: 6 }} />
              Use first prompt in practice studio
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function InterviewAnswerCard({ question, accent, profile, onAction, onActivity, questionFirstMode, onPractice, searchQuery, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copied, setCopied] = useState(false);
  const category = getInterviewReadyCategory(question.categoryId);
  const revealAnswer = () => {
    setExpanded((value) => !value);
    if (!expanded) {
      onActivity?.({
        workspaceId: "interviewReady",
        type: "reveal",
        label: "Revealed interview-ready answer",
        detail: question.question,
      });
    }
  };
  const tailorAnswer = () => {
    onAction?.(buildInterviewReadyTailorPrompt(question.id, profile || {}), {
      type: "interviewReadyTailor",
      question,
      category,
    });
  };
  const runMock = () => {
    onAction?.(buildInterviewReadyMockPrompt(question.id), {
      type: "interviewReadyMock",
      question,
      category,
    });
  };
  const copyAnswer = async () => {
    const text = [
      "Interview-ready answer",
      question.answer.polished,
      "Strong example",
      question.answer.example,
      "Likely follow-ups",
      ...question.answer.followUps.map((item) => `- ${item}`),
    ].join("\n\n");
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      onActivity?.({ workspaceId: "interviewReady", type: "copy", label: "Copied interview-ready answer", detail: question.question });
    } catch {
      onActivity?.({ workspaceId: "interviewReady", type: "copyFailed", label: "Could not copy interview-ready answer", detail: question.question });
    }
  };

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: compact ? 6 : 10, padding: compact ? 8 : 12 }}>
      <header style={{ alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {category.label} · {question.frequency}
          </div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15.5, lineHeight: 1.3, marginTop: 4 }}><HighlightedText text={question.question} query={searchQuery} /></h3>
        </div>
        <span style={{ border: "1px solid rgba(250,204,21,.28)", borderRadius: 999, color: "#fde68a", flexShrink: 0, fontSize: 10.5, fontWeight: 900, padding: "3px 7px", whiteSpace: "nowrap" }}>
          {question.difficulty}
        </span>
      </header>

      <section style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Why interviewers ask this</div>
        <p style={{ color: "#dbeafe", fontSize: 11.6, lineHeight: 1.55, margin: 0 }}>{question.whyItIsAsked}</p>
        <p style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.5, margin: 0 }}>Best fit: {question.stage}</p>
      </section>

      {questionFirstMode && !expanded ? (
        <section style={{ ...wrap, background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
          <div style={{ color: "#f8fbff", fontSize: 12, fontWeight: 800 }}>Question-first mode is on.</div>
          <p style={{ color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>
            Try answering out loud first, then reveal the polished version and compare your structure, depth, and trade-off coverage.
          </p>
        </section>
      ) : null}

      {(expanded || !questionFirstMode) && (
        <section style={{ ...wrap, background: "rgba(0,0,0,.18)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 10, padding: 10 }}>
          <div style={wrap}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Direct answer</div>
            <p style={{ color: "#e5eefb", fontSize: 11.8, lineHeight: 1.55, margin: "5px 0 0" }}>{question.answer.direct}</p>
          </div>
          <div style={wrap}>
            <div style={{ color: "#a7f3d0", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Interview-ready polished answer</div>
            <p style={{ color: "#d1fae5", fontSize: 11.8, lineHeight: 1.62, margin: "5px 0 0" }}>{question.answer.polished}</p>
          </div>
          <div style={wrap}>
            <div style={{ color: "#facc15", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Strong example</div>
            <p style={{ color: "#fef3c7", fontSize: 11.6, lineHeight: 1.55, margin: "5px 0 0" }}>{question.answer.example}</p>
          </div>
          <div style={responsiveGrid(220, 9)}>
            <AnswerList title="Key Points" icon="ti-list-check" items={question.answer.keyPoints} accent={accent} />
            <AnswerList title="Ace Signals" icon="ti-rosette-discount-check" items={question.answer.aceSignals} accent="#86efac" color="#d1fae5" />
            <AnswerList title="Common Mistakes" icon="ti-alert-triangle" items={question.answer.mistakes} accent="#fca5a5" color="#fecaca" />
            <AnswerList title="Likely Follow-up Questions" icon="ti-message-question" items={question.answer.followUps} accent="#c4b5fd" />
          </div>
        </section>
      )}

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
        <button type="button" className="glass-button" onClick={revealAnswer} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className={`ti ${expanded ? "ti-eye-off" : "ti-eye"}`} style={{ color: accent, marginRight: 6 }} />
          {expanded ? "Hide polished answer" : "Reveal polished answer"}
        </button>
        <button type="button" className="glass-button" onClick={() => onPractice(question)} style={{ border: "1px solid rgba(250,204,21,.32)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-edit" style={{ color: "#facc15", marginRight: 6 }} />
          Practice this answer
        </button>
        <button type="button" className="glass-button" onClick={copyAnswer} style={{ border: "1px solid rgba(139,211,255,.32)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-copy" style={{ color: accent, marginRight: 6 }} />
          {copied ? "Copied" : "Copy answer"}
        </button>
        <button type="button" className="glass-button" onClick={tailorAnswer} style={{ border: "1px solid rgba(134,239,172,.35)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-magic-wand" style={{ color: "#86efac", marginRight: 6 }} />
          Tailor with AI
        </button>
        <button type="button" className="glass-button" onClick={runMock} style={{ border: "1px solid rgba(196,181,253,.35)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
          Mock follow-up
        </button>
      </div>
      <div style={{ alignItems: "center", color: "#9fb0c7", display: "flex", flexWrap: "wrap", fontSize: 11, gap: 8 }}>
        <span>Was this answer useful?</span>
        <button type="button" aria-label="Answer was useful" className="glass-button" onClick={() => { setFeedback("Thanks for the feedback."); onActivity?.({ workspaceId: "interviewReady", type: "feedback", label: "Marked answer useful", detail: question.question }); }} style={{ border: "1px solid rgba(134,239,172,.3)", borderRadius: 999, color: "#d1fae5", padding: "4px 8px" }}><i className="ti ti-thumb-up" /></button>
        <button type="button" aria-label="Answer needs improvement" className="glass-button" onClick={() => { setFeedback("Thanks — we’ll use that signal to improve this answer."); onActivity?.({ workspaceId: "interviewReady", type: "feedback", label: "Marked answer for improvement", detail: question.question }); }} style={{ border: "1px solid rgba(252,165,165,.3)", borderRadius: 999, color: "#fecaca", padding: "4px 8px" }}><i className="ti ti-thumb-down" /></button>
        {feedback ? <span role="status" style={{ color: "#86efac" }}>{feedback}</span> : null}
      </div>
      <p style={{ color: "#9fb0c7", fontSize: 10.5, lineHeight: 1.4, margin: 0 }}><i className="ti ti-sparkles" style={{ marginRight: 5 }} />AI-generated coaching content. Verify important technical details against your team’s standards.</p>
    </article>
  );
}

export default function InterviewReadyQA({
  theme = {},
  profile = null,
  onAction,
  beginnerMode = false,
  beginnerStep = "watch",
  onBeginnerStepChange,
  onActivity,
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("All");
  const [searchDraft, setSearchDraft] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [customQuestionError, setCustomQuestionError] = useState("");
  const [compactMode, setCompactMode] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [answerStyle, setAnswerStyle] = useState("balanced");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [bookmarkNotice, setBookmarkNotice] = useState("");
  const [collectionName, setCollectionName] = useState("My interview questions");
  const [offline, setOffline] = useState(false);
  const [lastCustomPrompt, setLastCustomPrompt] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [questionFirstMode, setQuestionFirstMode] = useState(true);
  const [practiceState, setPracticeState] = useState(() => createInterviewReadyPracticeState());
  const [draftAnswer, setDraftAnswer] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [timerRemaining, setTimerRemaining] = useState(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const [practiceStudioOpen, setPracticeStudioOpen] = useState(true);
  const [companyPackOpen, setCompanyPackOpen] = useState(false);
  const [questionBankOpen, setQuestionBankOpen] = useState(true);
  const [customPracticeItem, setCustomPracticeItem] = useState(null);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";
  const questions = useMemo(() => listInterviewReadyQuestions({
    categoryId: activeCategory,
    difficulty,
    search: searchDraft,
  }).filter((question) => !savedOnly || bookmarkedIds.includes(question.id)), [activeCategory, difficulty, searchDraft, savedOnly, bookmarkedIds]);
  const activeQuestionId = practiceState.selectedQuestionId || questions[0]?.id || "";
  const activeQuestion = useMemo(() => getInterviewReadyQuestion(activeQuestionId) || questions[0] || null, [activeQuestionId, questions]);
  const activePracticeKey = customPracticeItem ? `company-pack:${practiceState.company}:${customPracticeItem.id}` : activeQuestion?.id || "";
  const activeSavedAnswer = activePracticeKey ? practiceState.answers[activePracticeKey] || null : null;
  const evaluation = useMemo(() => (activeQuestion || customPracticeItem)
    ? evaluateInterviewReadyAnswer(draftAnswer, customPracticeItem ? { question: customPracticeItem.prompt } : activeQuestion)
    : null, [activeQuestion, customPracticeItem, draftAnswer]);
  const companyPack = useMemo(() => buildInterviewReadyCompanyPack(practiceState.company), [practiceState.company]);
  const activePracticeTitle = customPracticeItem
    ? `${customPracticeItem.type}: ${customPracticeItem.title}`
    : activeQuestion?.question || "Choose a question to practice";
  const activePracticePromptDetail = customPracticeItem?.prompt || "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPracticeState(loadVersionedState(window.localStorage, {
      key: INTERVIEW_READY_PRACTICE_STORAGE_KEY,
      version: INTERVIEW_READY_PRACTICE_STORAGE_VERSION,
      fallback: createInterviewReadyPracticeState(),
      normalize: createInterviewReadyPracticeState,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setBookmarkedIds(JSON.parse(window.localStorage.getItem("interviewiq_interview_ready_bookmarks") || "[]")); } catch { setBookmarkedIds([]); }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("interviewiq_interview_ready_bookmarks", JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setAnswerHistory(JSON.parse(window.localStorage.getItem("interviewiq_interview_ready_history") || "[]")); } catch { setAnswerHistory([]); }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("interviewiq_interview_ready_history", JSON.stringify(answerHistory.slice(0, 10)));
  }, [answerHistory]);

  useEffect(() => {
    const update = () => setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  useEffect(() => {
    const onShortcut = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector('[aria-label="Ask your own interview question"]')?.focus();
      }
      if (event.key.toLowerCase() === "b" && activeQuestion?.id) {
        event.preventDefault();
        setBookmarkedIds((ids) => ids.includes(activeQuestion.id) ? ids.filter((id) => id !== activeQuestion.id) : [...ids, activeQuestion.id]);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [activeQuestion]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    saveVersionedState(window.localStorage, {
      key: INTERVIEW_READY_PRACTICE_STORAGE_KEY,
      version: INTERVIEW_READY_PRACTICE_STORAGE_VERSION,
      value: practiceState,
      normalize: createInterviewReadyPracticeState,
    });
  }, [practiceState]);

  useEffect(() => {
    if (!activeQuestion) return;
    setDraftAnswer(activeSavedAnswer?.draft || "");
  }, [activeQuestionId, activeSavedAnswer, activeQuestion]);

  useEffect(() => {
    setTimerRemaining(timerSeconds);
  }, [timerSeconds]);

  useEffect(() => {
    if (!timerRunning) return undefined;

    const timer = window.setInterval(() => {
      setTimerRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          onActivity?.({
            workspaceId: "interviewReady",
            type: "timerEnd",
            label: "Finished timed interview answer",
            detail: activeQuestion?.question || "Interview answer timer",
          });
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerRunning, activeQuestion, onActivity]);

  useEffect(() => {
    if (!practiceState.selectedQuestionId && questions[0]?.id) {
      setPracticeState((previous) => setInterviewReadySelectedQuestion(previous, questions[0].id));
    }
  }, [practiceState.selectedQuestionId, questions]);

  const selectPracticeQuestion = (question) => {
    if (!question?.id) return;
    setCustomPracticeItem(null);
    setPracticeState((previous) => setInterviewReadySelectedQuestion(previous, question.id));
    setPracticeStudioOpen(true);
    onActivity?.({
      workspaceId: "interviewReady",
      type: "select",
      label: "Selected interview-ready question",
      detail: question.question,
    });
  };

  const saveCurrentAnswer = () => {
    if (!activePracticeKey) return;
    setPracticeState((previous) => saveInterviewReadyAnswer(previous, {
      questionId: activePracticeKey,
      draft: draftAnswer,
      company: practiceState.company,
      evaluation,
      durationSeconds: timerSeconds - timerRemaining,
    }));
    onActivity?.({
      workspaceId: "interviewReady",
      type: "save",
      label: "Saved personal interview answer",
      detail: activePracticeTitle,
    });
    setLastSavedAt(new Date());
    setAnswerHistory((history) => [{ id: Date.now(), title: activePracticeTitle, draft: draftAnswer, savedAt: new Date().toISOString() }, ...history].slice(0, 10));
  };

  const toggleBookmark = (questionId) => {
    setBookmarkedIds((ids) => ids.includes(questionId) ? ids.filter((id) => id !== questionId) : [...ids, questionId]);
    setBookmarkNotice(bookmarkedIds.includes(questionId) ? "Removed from your saved collection." : "Saved to your local collection.");
    window.setTimeout(() => setBookmarkNotice(""), 2200);
    onActivity?.({ workspaceId: "interviewReady", type: "bookmark", label: "Updated saved interview collection", detail: questionId });
  };

  const exportBookmarks = () => {
    const blob = new Blob([JSON.stringify({ version: 1, name: collectionName, bookmarkedIds }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "interviewiq-saved-questions.json"; link.click(); URL.revokeObjectURL(url);
    setBookmarkNotice("Saved collection exported.");
  };

  const importBookmarks = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const data = JSON.parse(reader.result); const ids = Array.isArray(data.bookmarkedIds) ? data.bookmarkedIds.filter((id) => typeof id === "string") : []; setBookmarkedIds(ids); if (typeof data.name === "string" && data.name.trim()) setCollectionName(data.name.trim().slice(0, 60)); setBookmarkNotice(`${ids.length} saved questions imported.`); } catch { setBookmarkNotice("That collection file could not be imported."); } };
    reader.readAsText(file); event.target.value = "";
  };

  const runCompanyPrompt = (item) => {
    const prompt = [
      `Turn this ${companyPack.company} interview prompt into an interview-ready answer I can say naturally.`,
      `Prompt type: ${item.type}.`,
      `Prompt title: ${item.title}.`,
      `Prompt detail: ${item.prompt}.`,
      "Give me a polished answer, what points to include, one strong example, and the follow-up the interviewer is likely to ask.",
    ].join("\n");

    onAction?.(prompt, {
      type: "interviewReadyCompanyPack",
      company: companyPack.company,
      item,
    });
  };

  const useCompanyPromptInStudio = (item) => {
    setCustomPracticeItem(item);
    setDraftAnswer("");
    setPracticeStudioOpen(true);
    setPracticeState((previous) => setInterviewReadyCompany(previous, companyPack.company));
    onActivity?.({
      workspaceId: "interviewReady",
      type: "companyPack",
      label: "Loaded company pack prompt into practice studio",
      detail: `${companyPack.company}: ${item.title}`,
    });
  };

  const askCustomQuestion = () => {
    const question = customQuestion.trim();
    if (!question) {
      setCustomQuestionError("Enter an interview question first.");
      return;
    }
    if (question.length < 8) {
      setCustomQuestionError("Add a little more detail so the answer can be specific.");
      return;
    }
    if (offline) {
      setCustomQuestionError("You are offline. Reconnect before sending an AI question.");
      return;
    }
    setCustomQuestionError("");
    const prompt = [
      "Turn the following question into an interview-ready answer I can say naturally.",
      `Question: ${question}`,
      "Use this structure: direct answer first, key points, one concrete example, trade-offs or caveats, and likely follow-up questions.",
      `Answer style preset: ${answerStyle}.`,
      "Adapt the answer to my selected role and technology stack when that context is available. Keep it practical and avoid inventing personal experience.",
    ].join("\n");
    setLastCustomPrompt(prompt);
    onAction?.(prompt, {
      type: "interviewReadyCustomQuestion",
      question,
    });
    onActivity?.({ workspaceId: "interviewReady", type: "customQuestion", label: "Asked a custom interview question", detail: question });
  };

  const sendFeedback = () => {
    if (typeof window !== "undefined") window.location.href = "mailto:feedback@interviewiq.app?subject=InterviewIQ%20UI%20feedback";
  };

  return (
    <section
      className={`glass-card interview-ready-qa${compactMode ? " is-compact" : ""}`}
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        color: "#eef4ff",
        display: "grid",
        gap: compactMode ? 8 : 12,
        minWidth: 0,
        padding: compactMode ? 10 : 14,
        width: "100%",
        zoom: textScale,
      }}
    >
      <BeginnerGuideBanner
        enabled={beginnerMode}
        accent={accent}
        currentStep={beginnerStep}
        onStepSelect={onBeginnerStepChange}
        detail="For Interview Ready Q&A: hear the question, answer in your own words, reveal the polished version, score the gaps, then rehearse the follow-up under a timer."
      />

      <header style={{ alignItems: "flex-start", display: "grid", gap: 10 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Interview Ready Q&A</div>
          <h2 style={{ ...wrap, color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Most-asked questions with polished answers built to land well in interviews</h2>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.8, lineHeight: 1.55, marginTop: 6 }}>
            This is a rehearsal room now, not just a reference list. Practice your own answer, save it, score it, pressure-test it with a timer, and switch into company-specific packs without leaving the workspace.
          </p>
          <div style={{ alignItems: "center", color: "#9fb0c7", display: "flex", flexWrap: "wrap", fontSize: 10.8, gap: 10, marginTop: 8 }}>
            <span><i className="ti ti-command" /> K ask · ⌘ B bookmark</span>
            <button type="button" className="glass-button" aria-pressed={compactMode} onClick={() => setCompactMode((value) => !value)} style={{ border: "1px solid rgba(139,211,255,.3)", borderRadius: 999, color: "#dbeafe", padding: "4px 8px" }}>{compactMode ? "Comfortable mode" : "Compact mode"}</button>
            {lastSavedAt ? <span role="status">Saved locally {lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : null}
            <button type="button" className="glass-button" aria-label="Decrease text size" disabled={textScale === TEXT_SCALE_MIN} onClick={() => setTextScale((value) => Math.max(TEXT_SCALE_MIN, Number((value - TEXT_SCALE_STEP).toFixed(1))))} style={{ borderRadius: 999, padding: "3px 7px" }}>A−</button>
            <button type="button" className="glass-button" aria-label="Increase text size" disabled={textScale === TEXT_SCALE_MAX} onClick={() => setTextScale((value) => Math.min(TEXT_SCALE_MAX, Number((value + TEXT_SCALE_STEP).toFixed(1))))} style={{ borderRadius: 999, padding: "3px 7px" }}>A+</button>
            <span aria-live="polite" style={{ color: "#9fb0c7", fontSize: 10.5 }}>Text {Math.round(textScale * 100)}%</span>
            <button type="button" className="glass-button" onClick={sendFeedback} style={{ borderRadius: 999, color: "#dbeafe", padding: "4px 8px" }}><i className="ti ti-message-report" /> Send feedback</button>
          </div>
        </div>
        <section style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 8, padding: 12 }}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Ace-the-interview checklist</div>
          <div style={responsiveGrid(210, 8)}>
            {[
              "Lead with the direct answer in the first sentence.",
              "Add the trade-off or decision rule, not just the definition.",
              "Use one realistic example from backend work.",
              "Close with the caveat or follow-up angle interviewers often probe.",
            ].map((item) => (
              <div key={item} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#dbeafe", fontSize: 11.4, lineHeight: 1.45, padding: 9 }}>
                {item}
              </div>
            ))}
          </div>
        </section>
      </header>

      <section style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }} aria-label="Answer style presets">
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Answer style</div>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
          {[['concise', 'Concise'], ['balanced', 'Balanced'], ['senior', 'Senior-level'], ['star', 'STAR format'], ['design', 'System-design depth']].map(([value, label]) => <FilterChip key={value} label={label} active={answerStyle === value} accent={accent} onClick={() => setAnswerStyle(value)} />)}
          <span style={{ color: "#9fb0c7", fontSize: 10.8 }}>Preset applies to your next AI answer.</span>
        </div>
      </section>

      <section style={{ ...wrap, alignItems: "center", background: "rgba(134,239,172,.06)", border: "1px solid rgba(134,239,172,.2)", borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", padding: "8px 10px" }} aria-label="Privacy and storage information">
        <span style={{ color: "#d1fae5", fontSize: 11 }}><i className="ti ti-shield-lock" style={{ marginRight: 6 }} />Privacy: practice drafts and saved questions stay on this device unless cloud sync is enabled.</span>
        {bookmarkNotice ? <span role="status" style={{ color: "#86efac", fontSize: 11 }}>{bookmarkNotice}</span> : null}
      </section>

      {offline ? <div role="status" style={{ ...wrap, background: "rgba(250,204,21,.1)", border: "1px solid rgba(250,204,21,.3)", borderRadius: 8, color: "#fde68a", fontSize: 11.5, padding: "8px 10px" }}><i className="ti ti-wifi-off" style={{ marginRight: 6 }} />Offline mode: local practice remains available, but AI requests are paused until you reconnect.</div> : null}

      <section style={{ ...wrap, display: "flex", flexWrap: "wrap", gap: 7 }} aria-label="Saved collection tools">
        <input aria-label="Saved collection name" value={collectionName} onChange={(event) => setCollectionName(event.target.value.slice(0, 60))} className="glass-input" style={{ border: "1px solid rgba(139,211,255,.24)", borderRadius: 7, color: "#dbeafe", fontSize: 11.5, padding: "6px 8px", width: 190 }} />
        <strong style={{ color: "#dbeafe", fontSize: 11.5, padding: "7px 0" }}>{bookmarkedIds.length} saved</strong>
        <button type="button" className="glass-button" onClick={exportBookmarks} disabled={!bookmarkedIds.length} style={{ border: "1px solid rgba(139,211,255,.3)", borderRadius: 7, color: "#dbeafe", fontSize: 11, padding: "6px 9px", opacity: bookmarkedIds.length ? 1 : .45 }}><i className="ti ti-download" /> Export collection</button>
        <label className="glass-button" style={{ border: "1px solid rgba(139,211,255,.3)", borderRadius: 7, color: "#dbeafe", cursor: "pointer", fontSize: 11, padding: "6px 9px" }}><i className="ti ti-upload" /> Import collection<input type="file" accept="application/json,.json" onChange={importBookmarks} style={{ display: "none" }} /></label>
        <button type="button" className="glass-button danger-action" onClick={() => { if (window.confirm("Clear all saved interview questions?")) { setBookmarkedIds([]); setBookmarkNotice("Saved collection cleared."); } }} disabled={!bookmarkedIds.length} style={{ borderRadius: 7, fontSize: 11, opacity: bookmarkedIds.length ? 1 : .45, padding: "6px 9px" }}>Clear all</button>
        <button type="button" className="glass-button" onClick={() => setSavedOnly((value) => !value)} style={{ border: "1px solid rgba(250,204,21,.3)", borderRadius: 7, color: savedOnly ? "#fde68a" : "#dbeafe", fontSize: 11, padding: "6px 9px" }}><i className="ti ti-bookmark" /> {savedOnly ? "Showing saved" : "Show saved only"}</button>
        {answerHistory.length ? <span style={{ color: "#9fb0c7", fontSize: 11, padding: "7px 0" }}>Version history: {answerHistory.length} saved draft{answerHistory.length === 1 ? "" : "s"}</span> : null}
      </section>

      <section className="interview-ready-custom-question" style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}44`, borderRadius: 10, display: "grid", gap: 9, padding: 12 }} aria-labelledby="custom-question-heading">
        <div>
          <div style={{ alignItems: "center", color: accent, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 6, textTransform: "uppercase" }}>
            <i className="ti ti-message-question" /> Ask your own question
          </div>
          <h3 id="custom-question-heading" style={{ color: "#f8fbff", fontSize: 15, lineHeight: 1.3, marginTop: 4 }}>Get a structured Interview Ready Answer</h3>
          <p style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.5, margin: "4px 0 0" }}>The response will include the direct answer, key points, example, trade-offs, and likely follow-ups.</p>
        </div>
        <div style={{ alignItems: "stretch", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            type="text"
            value={customQuestion}
            onChange={(event) => { setCustomQuestion(event.target.value); setCustomQuestionError(""); }}
            onKeyDown={(event) => { if (event.key === "Enter") askCustomQuestion(); }}
            placeholder="e.g. How would you design a rate limiter?"
            aria-label="Ask your own interview question"
            className="glass-input"
            style={{ border: `1px solid ${accentBorder}`, borderRadius: 7, color: "#f8fbff", flex: "1 1 280px", fontSize: 12.5, minWidth: 0, outline: "none", padding: "9px 10px" }}
          />
          <button type="button" className="glass-button" onClick={askCustomQuestion} style={{ border: `1px solid ${accent}66`, borderRadius: 7, color: "#f8fbff", fontSize: 11.5, fontWeight: 900, padding: "8px 12px" }}>
            <i className="ti ti-sparkles" style={{ color: accent, marginRight: 6 }} />
            Generate answer
          </button>
        </div>
        {customQuestionError ? <p role="alert" style={{ color: "#fca5a5", fontSize: 11.5, margin: 0 }}>{customQuestionError}</p> : null}
        {lastCustomPrompt && !offline ? <button type="button" className="glass-button" onClick={() => onAction?.(lastCustomPrompt, { type: "interviewReadyCustomQuestionRetry", question: customQuestion })} style={{ border: "1px solid rgba(196,181,253,.35)", borderRadius: 7, color: "#dbeafe", fontSize: 11, justifySelf: "start", padding: "6px 9px" }}><i className="ti ti-refresh" /> Regenerate last answer</button> : null}
      </section>

      <section aria-label="Interview preparation progress" style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}><span style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Practice progress</span><strong style={{ color: "#dbeafe", fontSize: 11 }}>{activeSavedAnswer ? "1 / 1 complete" : "0 / 1 complete"}</strong></div>
        <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 999, height: 6, overflow: "hidden" }}><span style={{ background: "#86efac", borderRadius: 999, display: "block", height: "100%", transition: "width .2s ease", width: activeSavedAnswer ? "100%" : "12%" }} /></div>
        <span style={{ color: "#9fb0c7", fontSize: 10.8 }}>Save one answer to mark this practice step complete.</span>
      </section>

      <SectionToggle
        title={activePracticeTitle}
        eyebrow="Practice studio"
        open={practiceStudioOpen}
        accent={accent}
        onToggle={() => setPracticeStudioOpen((value) => !value)}
        compact={compactMode}
        defaultOpenNote={activeSavedAnswer?.practicedAt ? `Saved locally on ${new Date(activeSavedAnswer.practicedAt).toLocaleDateString()}` : "Write, time, and score your own version here."}
      >
        {customPracticeItem ? (
          <section style={{ ...wrap, background: `${accent}10`, border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Company practice prompt</div>
            <p style={{ color: "#dbeafe", fontSize: 11.6, lineHeight: 1.55, margin: 0 }}>{activePracticePromptDetail}</p>
          </section>
        ) : null}

        <div style={responsiveGrid(220, 8)}>
          <label style={{ ...wrap, display: "grid", gap: 6 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Target company</span>
            <input
              type="text"
              value={practiceState.company}
              onChange={(event) => setPracticeState((previous) => setInterviewReadyCompany(previous, event.target.value))}
              className="glass-input"
              style={{ border: `1px solid ${accentBorder}`, borderRadius: 7, color: "#f8fbff", fontSize: 12, outline: "none", padding: "8px 9px", width: "100%" }}
            />
          </label>
          <label style={{ ...wrap, display: "grid", gap: 6 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Answer timer</span>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
              {TIMER_OPTIONS.map((option) => (
                <FilterChip key={option} label={`${option}s`} active={timerSeconds === option} accent={accent} onClick={() => {
                  setTimerSeconds(option);
                  setTimerRunning(false);
                }} />
              ))}
              <button type="button" className="glass-button" onClick={() => setTimerRunning((value) => !value)} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
                <i className={`ti ${timerRunning ? "ti-player-pause" : "ti-player-play"}`} style={{ color: accent, marginRight: 6 }} />
                {timerRunning ? "Pause" : "Start"}
              </button>
              <button type="button" onClick={() => {
                setTimerRunning(false);
                setTimerRemaining(timerSeconds);
              }} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#cbd5e1", cursor: "pointer", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
                Reset
              </button>
              <span style={{ color: timerRemaining <= 15 ? "#fda4af" : accent, fontSize: 14, fontWeight: 900 }}>{formatTimer(timerRemaining)}</span>
            </div>
          </label>
        </div>

        <textarea
          value={draftAnswer}
          onChange={(event) => setDraftAnswer(event.target.value)}
          placeholder="Write the answer in your own words. Lead with the answer, add why, trade-offs, and one concrete example."
          className="glass-input interview-ready-answer-input"
          style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, color: "#f8fbff", fontSize: 12.5, lineHeight: 1.6, minHeight: 150, outline: "none", overflowY: "auto", padding: 12, width: "100%" }}
        />

        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
          <button type="button" className="glass-button" onClick={saveCurrentAnswer} disabled={!activePracticeKey || !draftAnswer.trim()} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", cursor: !activePracticeKey || !draftAnswer.trim() ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 800, opacity: !activePracticeKey || !draftAnswer.trim() ? .45 : 1, padding: "7px 10px" }}>
            <i className="ti ti-device-floppy" style={{ color: accent, marginRight: 6 }} />
            Save my answer
          </button>
          {(activeQuestion || customPracticeItem) ? (
            <button type="button" className="glass-button" onClick={() => {
              if (customPracticeItem) {
                runCompanyPrompt(customPracticeItem);
                return;
              }

              onAction?.(buildInterviewReadyTailorPrompt(activeQuestion.id, profile || {}), {
                type: "interviewReadyTailor",
                question: activeQuestion,
              });
            }} style={{ border: "1px solid rgba(134,239,172,.35)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
              <i className="ti ti-magic-wand" style={{ color: "#86efac", marginRight: 6 }} />
              Improve with AI
            </button>
          ) : null}
          {(activeQuestion || customPracticeItem) ? (
            <button type="button" className="glass-button" onClick={() => {
              if (customPracticeItem) {
                onAction?.([
                  `Run a focused mock interview for ${companyPack.company}.`,
                  `Prompt type: ${customPracticeItem.type}.`,
                  `First question: ${customPracticeItem.title}.`,
                  `Prompt detail: ${customPracticeItem.prompt}.`,
                  "Ask one question at a time, wait for my answer, then score clarity, depth, trade-offs, and communication.",
                ].join("\n"), {
                  type: "interviewReadyCompanyPackMock",
                  company: companyPack.company,
                  item: customPracticeItem,
                });
                return;
              }

              onAction?.(buildInterviewReadyMockPrompt(activeQuestion.id), {
                type: "interviewReadyMock",
                question: activeQuestion,
              });
            }} style={{ border: "1px solid rgba(196,181,253,.35)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
              <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
              Run mock on this answer
            </button>
          ) : null}
        </div>

        <RubricPanel evaluation={evaluation} accent={accent} />
      </SectionToggle>

      <SectionToggle
        title={`${companyPack.company} prep packs`}
        eyebrow="Company-wise packs"
        open={companyPackOpen}
        accent={accent}
        onToggle={() => setCompanyPackOpen((value) => !value)}
        compact={compactMode}
        defaultOpenNote="Open when you want company-specific behavioral, coding, and design prompts."
      >
        <CompanyPackPanel companyPack={companyPack} accent={accent} onUsePackPrompt={runCompanyPrompt} onSelectQuestion={useCompanyPromptInStudio} />
      </SectionToggle>

      <SectionToggle
        title={`${questions.length} interview-ready question${questions.length === 1 ? "" : "s"} found`}
        eyebrow="Question bank"
        open={questionBankOpen}
        accent={accent}
        onToggle={() => setQuestionBankOpen((value) => !value)}
        compact={compactMode}
        defaultOpenNote="Search, filter, and open polished answers when you need them."
      >
        <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: compactMode ? 6 : 10, padding: compactMode ? 8 : 12 }}>
          <div style={{ ...wrap, display: "grid", gap: 6 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Search question bank</span>
            <div style={{ alignItems: "center", background: "rgba(0,0,0,.16)", border: `1px solid ${accentBorder}`, borderRadius: 8, display: "flex", gap: 8, minWidth: 0, padding: "8px 10px" }}>
              <i className="ti ti-search" style={{ color: accent, flexShrink: 0, fontSize: 15 }} />
              <input
                type="search"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search HashMap, idempotency, race condition, N+1, index..."
                className="glass-input"
                style={{ background: "transparent", border: "none", color: "#f8fbff", flex: 1, fontSize: 13, minWidth: 0, outline: "none", padding: 0 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Categories</span>
            <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7 }}>
              <FilterChip label="All Categories" icon="ti-layout-grid" active={activeCategory === "all"} accent={accent} onClick={() => setActiveCategory("all")} />
              {INTERVIEW_READY_QA_CATEGORIES.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.label}
                  icon={category.icon}
                  active={activeCategory === category.id}
                  accent={accent}
                  onClick={() => setActiveCategory(category.id)}
                />
              ))}
            </div>
          </div>

          <div style={responsiveGrid(220, 8)}>
            <label style={{ ...wrap, display: "grid", gap: 6 }}>
              <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="glass-input"
                style={{ border: `1px solid ${accentBorder}`, borderRadius: 7, color: "#f8fbff", fontSize: 12, outline: "none", padding: "8px 9px", width: "100%" }}
              >
                {INTERVIEW_READY_QA_DIFFICULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label style={{ ...wrap, alignItems: "center", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#dbeafe", cursor: "pointer", display: "flex", gap: 9, minHeight: 42, padding: "0 12px" }}>
              <input
                type="checkbox"
                checked={questionFirstMode}
                onChange={(event) => setQuestionFirstMode(event.target.checked)}
                style={{ accentColor: accent, height: 14, width: 14 }}
              />
              <span style={{ fontSize: 11.5, fontWeight: 700 }}>Question-first mode</span>
            </label>
          </div>
        </section>

        <section style={{ ...wrap, alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }}>
          <span style={{ color: "#cbd5e1", fontSize: 11.5 }}>{questions.length} interview-ready question{questions.length === 1 ? "" : "s"} found</span>
          <span style={{ color: "#9fb0c7", fontSize: 11 }}>Reveal answer, save your version, score it, then run the follow-up.</span>
        </section>

        {questions.length ? (
          <div style={responsiveGrid(320, 10)}>
            {questions.map((question) => (
              <div key={question.id} style={{ display: "grid", gap: compactMode ? 5 : 10 }}>
                <button type="button" className="glass-button" onClick={() => toggleBookmark(question.id)} aria-label={bookmarkedIds.includes(question.id) ? "Remove bookmark" : "Bookmark answer"} style={{ border: "1px solid rgba(250,204,21,.3)", borderRadius: 999, color: bookmarkedIds.includes(question.id) ? "#fde68a" : "#9fb0c7", justifySelf: "end", padding: "4px 8px" }}><i className={`ti ${bookmarkedIds.includes(question.id) ? "ti-bookmark-filled" : "ti-bookmark"}`} /> {bookmarkedIds.includes(question.id) ? "Saved" : "Save"}</button>
                <InterviewAnswerCard question={question} accent={accent} profile={profile} onAction={(prompt, metadata = {}) => onAction?.(prompt, { ...metadata, answerStyle })} onActivity={onActivity} questionFirstMode={questionFirstMode} onPractice={selectPracticeQuestion} searchQuery={searchDraft} compact={compactMode} />
              </div>
            ))}
          </div>
        ) : (
          <section style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#cbd5e1", display: "grid", gap: 6, padding: 14 }}>
            <div style={{ color: "#f8fbff", fontSize: 12.5, fontWeight: 800 }}>No questions match this filter yet.</div>
            <p style={{ fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
              Try a broader keyword or switch the category and difficulty filters. Broad terms like concurrency, API, SQL, or ownership work best.
            </p>
            <button type="button" className="glass-button" onClick={() => { setSearchDraft(""); setActiveCategory("all"); setDifficulty("All"); }} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
              Clear filters
            </button>
          </section>
        )}
      </SectionToggle>
    </section>
  );
}
