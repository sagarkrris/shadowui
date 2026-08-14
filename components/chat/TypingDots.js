import { useEffect, useState } from "react";

const LOADING_STAGES = [
  {
    label: "Getting your answer interview-ready",
    detail: "Straightening the logic, trimming the fluff, and warming up the confidence.",
  },
  {
    label: "Polishing the sharp parts",
    detail: "Keeping the answer crisp enough for an interview and human enough to sound real.",
  },
  {
    label: "Running the last confidence check",
    detail: "Making sure it lands clearly before it walks into the room with you.",
  },
  {
    label: "Adding the final calm",
    detail: "A little less ramble, a little more signal, and a stronger finish.",
  },
];

export default function TypingDots() {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % LOADING_STAGES.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, []);

  const stage = LOADING_STAGES[stageIndex];

  return (
    <div className="typing-status" style={{ display: "grid", gap: 10, minWidth: 0 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 10, minWidth: 0 }}>
        <div
          aria-hidden="true"
          style={{
            alignItems: "center",
            background: "linear-gradient(180deg, rgba(168,85,247,.18), rgba(59,130,246,.08))",
            border: "1px solid rgba(192,132,252,.26)",
            borderRadius: 10,
            display: "grid",
            flexShrink: 0,
            gap: 4,
            height: 50,
            justifyItems: "center",
            padding: 7,
            width: 50,
          }}
        >
          <div style={{ display: "flex", gap: 3 }}>
            <span style={{ background: "rgba(255,255,255,.18)", borderRadius: 4, display: "block", height: 7, width: 9 }} />
            <span style={{ background: "rgba(255,255,255,.26)", borderRadius: 4, display: "block", height: 7, width: 13 }} />
            <span style={{ background: "rgba(255,255,255,.18)", borderRadius: 4, display: "block", height: 7, width: 7 }} />
          </div>
          <div style={{ alignItems: "center", display: "flex", gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="dot" style={{ animationDelay: `${i * 0.2}s`, background: "#c084fc" }} />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <div className="typing-status-kicker" style={{ fontSize: 11.2, fontWeight: 900, lineHeight: 1.3, textTransform: "uppercase" }}>
            InterviewIQ is cooking
          </div>
          <div className="typing-status-label" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
            {stage.label}
          </div>
          <div className="typing-status-detail" style={{ fontSize: 11.4, lineHeight: 1.45 }}>
            {stage.detail}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span className="typing-status-chip" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, fontSize: 10.5, fontWeight: 800, padding: "4px 8px" }}>
          sharpening clarity
        </span>
        <span className="typing-status-chip" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, fontSize: 10.5, fontWeight: 800, padding: "4px 8px" }}>
          removing waffle
        </span>
        <span className="typing-status-chip" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 999, fontSize: 10.5, fontWeight: 800, padding: "4px 8px" }}>
          boosting signal
        </span>
      </div>
    </div>
  );
}
