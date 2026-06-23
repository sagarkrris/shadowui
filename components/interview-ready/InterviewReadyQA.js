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

const responsiveGrid = (minColumnWidth, gap = 10) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

function SectionToggle({ title, eyebrow, open, accent, onToggle, children, defaultOpenNote = "" }) {
  return (
    <section style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: open ? 12 : 0, padding: 12 }}>
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

function InterviewAnswerCard({ question, accent, profile, onAction, onActivity, questionFirstMode, onPractice }) {
  const [expanded, setExpanded] = useState(false);
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

  return (
    <article style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <header style={{ alignItems: "flex-start", display: "flex", gap: 10, justifyContent: "space-between", minWidth: 0 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>
            {category.label} · {question.frequency}
          </div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15.5, lineHeight: 1.3, marginTop: 4 }}>{question.question}</h3>
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
        <button type="button" className="glass-button" onClick={tailorAnswer} style={{ border: "1px solid rgba(134,239,172,.35)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-magic-wand" style={{ color: "#86efac", marginRight: 6 }} />
          Tailor with AI
        </button>
        <button type="button" className="glass-button" onClick={runMock} style={{ border: "1px solid rgba(196,181,253,.35)", borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, padding: "7px 10px" }}>
          <i className="ti ti-player-play" style={{ color: "#c4b5fd", marginRight: 6 }} />
          Mock follow-up
        </button>
      </div>
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
  }), [activeCategory, difficulty, searchDraft]);
  const activeQuestionId = practiceState.selectedQuestionId || questions[0]?.id || "";
  const activeQuestion = getInterviewReadyQuestion(activeQuestionId) || questions[0] || null;
  const activePracticeKey = customPracticeItem ? `company-pack:${practiceState.company}:${customPracticeItem.id}` : activeQuestion?.id || "";
  const activeSavedAnswer = activePracticeKey ? practiceState.answers[activePracticeKey] || null : null;
  const evaluation = (activeQuestion || customPracticeItem)
    ? evaluateInterviewReadyAnswer(draftAnswer, customPracticeItem ? { question: customPracticeItem.prompt } : activeQuestion)
    : null;
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

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        color: "#eef4ff",
        display: "grid",
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
        detail="For Interview Ready Q&A: hear the question, answer in your own words, reveal the polished version, score the gaps, then rehearse the follow-up under a timer."
      />

      <header style={{ alignItems: "flex-start", display: "grid", gap: 10 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Interview Ready Q&A</div>
          <h2 style={{ ...wrap, color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Most-asked questions with polished answers built to land well in interviews</h2>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.8, lineHeight: 1.55, marginTop: 6 }}>
            This is a rehearsal room now, not just a reference list. Practice your own answer, save it, score it, pressure-test it with a timer, and switch into company-specific packs without leaving the workspace.
          </p>
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

      <SectionToggle
        title={activePracticeTitle}
        eyebrow="Practice studio"
        open={practiceStudioOpen}
        accent={accent}
        onToggle={() => setPracticeStudioOpen((value) => !value)}
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
        defaultOpenNote="Search, filter, and open polished answers when you need them."
      >
        <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
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
              <InterviewAnswerCard
                key={question.id}
                question={question}
                accent={accent}
                profile={profile}
                onAction={onAction}
                onActivity={onActivity}
                questionFirstMode={questionFirstMode}
                onPractice={selectPracticeQuestion}
              />
            ))}
          </div>
        ) : (
          <section style={{ ...wrap, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#cbd5e1", display: "grid", gap: 6, padding: 14 }}>
            <div style={{ color: "#f8fbff", fontSize: 12.5, fontWeight: 800 }}>No questions match this filter yet.</div>
            <p style={{ fontSize: 11.6, lineHeight: 1.5, margin: 0 }}>
              Try a broader keyword or switch the category and difficulty filters. Broad terms like concurrency, API, SQL, or ownership work best.
            </p>
          </section>
        )}
      </SectionToggle>
    </section>
  );
}
