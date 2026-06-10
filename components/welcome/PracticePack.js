import { useEffect, useMemo, useState } from "react";
import { getPracticePack } from "../../lib/practicePacks.mjs";
import { loadQuestionMemory, recordQuestionAttempt } from "../../lib/questionMemory.mjs";

function createRoundSeed(sectionKey) {
  return `${sectionKey}-${Date.now()}-${Math.random()}`;
}

const MASTERY_STATUS_LABELS = {
  New: "New",
  "Needs Review": "Needs Review",
  Improving: "Improving",
  Mastered: "Mastered",
};

function buildBeginnerCardGuide(card, pack) {
  const primaryTag = card.tags?.[0] || pack.topic || "this topic";
  const firstPoint = card.answerPoints?.[0] || "Start with a clear definition and one practical example.";
  const firstFollowUp = card.followUps?.[0] || "Explain one trade-off and one edge case.";

  return {
    what: `${primaryTag} is the core idea this practice item is testing. In an interview, first explain it in plain language before jumping into tools or syntax.`,
    why: `It matters because the interviewer wants to see whether you can connect ${primaryTag} to real implementation choices, debugging steps, and trade-offs.`,
    where: `You will use it in ${pack.topic} work, production debugging, code reviews, and design conversations for ${pack.accent}.`,
    interviewReady: [firstPoint, ...card.answerPoints.slice(1)].join(" "),
    practiceFlow: [
      "Restate the question in your own words.",
      "Give the simple definition and one concrete example.",
      "Walk through the main answer points in order.",
      `Close by answering this likely follow-up: ${firstFollowUp}`,
    ],
    confusion: `Do not treat this as memorization. A strong answer explains what ${primaryTag} does, why it matters, what can go wrong, and how you would verify it.`,
  };
}

function getBrowserStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export default function PracticePack({ profile, selectedCat, selectedSub, difficulty, theme, questionMemory: externalQuestionMemory, onQuestionMemoryChange, onPracticeMock }) {
  const [openCard, setOpenCard] = useState(null);
  const sectionKey = `${profile?.stack || "stack"}|${selectedCat || "cat"}|${selectedSub || "sub"}|${difficulty || "difficulty"}`;
  const [roundSeed, setRoundSeed] = useState(() => createRoundSeed(sectionKey));
  const [roundExcludeIds, setRoundExcludeIds] = useState([]);
  const [seenBySection, setSeenBySection] = useState({});
  const [questionMemory, setQuestionMemory] = useState(externalQuestionMemory || null);
  const pack = useMemo(
    () => getPracticePack({
      profile,
      selectedCat,
      selectedSub,
      difficulty,
      seed: roundSeed,
      excludeIds: roundExcludeIds,
      questionMemory,
    }),
    [profile, selectedCat, selectedSub, difficulty, roundSeed, roundExcludeIds, questionMemory],
  );

  useEffect(() => {
    setQuestionMemory(externalQuestionMemory || loadQuestionMemory(getBrowserStorage()));
  }, [externalQuestionMemory]);

  useEffect(() => {
    setOpenCard(null);
    setRoundExcludeIds([]);
    setRoundSeed(createRoundSeed(sectionKey));
  }, [sectionKey]);

  useEffect(() => {
    const currentIds = pack.cards.map((card) => card.id);

    setSeenBySection((previous) => {
      const existing = previous[sectionKey] || [];
      const merged = [...existing];

      currentIds.forEach((id) => {
        if (!merged.includes(id)) merged.push(id);
      });

      if (merged.length === existing.length) return previous;

      return {
        ...previous,
        [sectionKey]: merged.slice(-pack.bankSize),
      };
    });
  }, [pack.cards, pack.bankSize, sectionKey]);

  const showFreshQuestions = () => {
    const seenIds = seenBySection[sectionKey] || [];
    const enoughUnseen = pack.bankSize - seenIds.length >= pack.cards.length;

    setOpenCard(null);
    setRoundExcludeIds(enoughUnseen ? seenIds : []);
    setRoundSeed(createRoundSeed(sectionKey));
  };

  const recordCardAttempt = (card, score) => {
    const storage = getBrowserStorage();
    const nextMemory = recordQuestionAttempt(storage, {
      questionId: card.id,
      question: card.question,
      packId: pack.id,
      topic: pack.topic,
      stack: profile?.stack || "",
      score,
    });

    setQuestionMemory(nextMemory);
    onQuestionMemoryChange?.(nextMemory);
  };

  return (
    <section style={{ width: "100%", maxWidth: 860, display: "grid", gap: 12, marginTop: 22, textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 800 }}>
            <i className={`ti ${pack.icon}`} />{pack.title}
          </div>
          <div style={{ color: "#6b7280", fontSize: 11.5, marginTop: 4 }}>
            {pack.topic} · {pack.difficulty} · {pack.accent}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ border: `1px solid ${theme.accentBorder}`, background: theme.accentMuted, color: theme.accentText, borderRadius: 999, padding: "4px 8px", fontSize: 10.5, fontWeight: 700 }}>
            {pack.bankSize} most asked
          </span>
          <button className="glass-button" onClick={showFreshQuestions} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            <i className="ti ti-refresh" />New Questions
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
        {pack.cards.map((card) => {
          const isOpen = openCard === card.id;
          const beginnerGuide = buildBeginnerCardGuide(card, pack);
          const memoryStatus = MASTERY_STATUS_LABELS[card.masteryStatus] || "New";
          const masteryStatus = memoryStatus;
          const statusTone = memoryStatus === "Mastered"
            ? { color: "#86efac", background: "rgba(34,197,94,.12)", border: "rgba(34,197,94,.28)" }
            : memoryStatus === "Needs Review"
              ? { color: "#fca5a5", background: "rgba(239,68,68,.11)", border: "rgba(239,68,68,.26)" }
              : { color: theme.accentText, background: theme.accentMuted, border: theme.accentBorder };

          return (
            <article key={card.id} className="glass-card" style={{ border: `1px solid ${isOpen ? theme.accentBorder : "rgba(255,255,255,.07)"}`, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ color: statusTone.color, background: statusTone.background, border: `1px solid ${statusTone.border}`, borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 800 }}>
                  {masteryStatus}
                </span>
                {card.tags.slice(0, 3).map((tag) => (
                  <span key={tag} style={{ color: theme.accentStrong, background: theme.accentMuted, border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>
                    {tag}
                  </span>
                ))}
              </div>

              <strong style={{ color: "#e8e8f0", fontSize: 13, lineHeight: 1.45 }}>{card.question}</strong>

              <div style={{ display: "grid", gap: 9 }}>
                <section style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, background: theme.accentMuted, display: "grid", gap: 7, padding: 10 }}>
                  <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Beginner Explanation</div>
                  <p style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#e8e8f0" }}>What is this?</strong> {beginnerGuide.what}</p>
                  <p style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#e8e8f0" }}>Why does it matter?</strong> {beginnerGuide.why}</p>
                  <p style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}><strong style={{ color: "#e8e8f0" }}>Where is it used?</strong> {beginnerGuide.where}</p>
                </section>
                <section style={{ border: "1px solid rgba(167,243,208,.24)", borderRadius: 8, background: "rgba(16,185,129,.06)", padding: 10 }}>
                  <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Interview-ready answer</div>
                  <p style={{ color: "#d1fae5", fontSize: 11.5, lineHeight: 1.55, margin: 0 }}>{beginnerGuide.interviewReady}</p>
                </section>
                <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }}>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 800, marginBottom: 5 }}>Answer points</div>
                    <ul style={{ margin: 0, paddingLeft: 17, color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5 }}>
                      {card.answerPoints.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 800, marginBottom: 5 }}>Practice example</div>
                    <ol style={{ margin: 0, paddingLeft: 17, color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5 }}>
                      {beginnerGuide.practiceFlow.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 800, marginBottom: 5 }}>Follow-ups</div>
                    <ul style={{ margin: 0, paddingLeft: 17, color: "#6b7280", fontSize: 11.5, lineHeight: 1.5 }}>
                      {card.followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#facc15", fontSize: 11, fontWeight: 800, marginBottom: 5 }}>Common confusion</div>
                    <p style={{ color: "#fde68a", fontSize: 11.5, lineHeight: 1.5, margin: 0 }}>{beginnerGuide.confusion}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
                <button className="glass-button" onClick={() => setOpenCard(isOpen ? null : card.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <i className="ti ti-notes" />Full Guide Shown
                </button>
                <button className="glass-button" onClick={() => recordCardAttempt(card, 4)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <i className="ti ti-rotate-clockwise" />Review Again
                </button>
                <button className="glass-button" onClick={() => recordCardAttempt(card, 8)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <i className="ti ti-circle-check" />Got It
                </button>
                <button className="glass-button" onClick={() => onPracticeMock?.({ prompt: card.mockPrompt, question: card.question, card, pack })} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <i className="ti ti-user-question" />Practice as Mock
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
