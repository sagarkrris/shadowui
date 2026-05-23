import { useEffect, useMemo, useState } from "react";
import { getPracticePack } from "../../lib/practicePacks.mjs";

function createRoundSeed(sectionKey) {
  return `${sectionKey}-${Date.now()}-${Math.random()}`;
}

export default function PracticePack({ profile, selectedCat, selectedSub, difficulty, theme, onPracticeMock }) {
  const [openCard, setOpenCard] = useState(null);
  const sectionKey = `${profile?.stack || "stack"}|${selectedCat || "cat"}|${selectedSub || "sub"}|${difficulty || "difficulty"}`;
  const [roundSeed, setRoundSeed] = useState(() => createRoundSeed(sectionKey));
  const [roundExcludeIds, setRoundExcludeIds] = useState([]);
  const [seenBySection, setSeenBySection] = useState({});
  const pack = useMemo(
    () => getPracticePack({
      profile,
      selectedCat,
      selectedSub,
      difficulty,
      seed: roundSeed,
      excludeIds: roundExcludeIds,
    }),
    [profile, selectedCat, selectedSub, difficulty, roundSeed, roundExcludeIds],
  );

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

          return (
            <article key={card.id} className="glass-card" style={{ border: `1px solid ${isOpen ? theme.accentBorder : "rgba(255,255,255,.07)"}`, borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {card.tags.slice(0, 3).map((tag) => (
                  <span key={tag} style={{ color: theme.accentStrong, background: theme.accentMuted, border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>
                    {tag}
                  </span>
                ))}
              </div>

              <strong style={{ color: "#e8e8f0", fontSize: 13, lineHeight: 1.45 }}>{card.question}</strong>

              {isOpen && (
                <div style={{ display: "grid", gap: 9 }}>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 800, marginBottom: 5 }}>Answer points</div>
                    <ul style={{ margin: 0, paddingLeft: 17, color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5 }}>
                      {card.answerPoints.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 800, marginBottom: 5 }}>Follow-ups</div>
                    <ul style={{ margin: 0, paddingLeft: 17, color: "#6b7280", fontSize: 11.5, lineHeight: 1.5 }}>
                      {card.followUps.map((followUp) => <li key={followUp}>{followUp}</li>)}
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: "auto", flexWrap: "wrap" }}>
                <button className="glass-button" onClick={() => setOpenCard(isOpen ? null : card.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                  <i className={`ti ${isOpen ? "ti-eye-off" : "ti-eye"}`} />{isOpen ? "Hide Guide" : "Show Guide"}
                </button>
                <button className="glass-button" onClick={() => onPracticeMock?.({ prompt: card.mockPrompt, question: card.question })} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.accentBorder}`, color: theme.accentText, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
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
