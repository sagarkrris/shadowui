import { useMemo, useState } from "react";
import {
  DESIGN_LAB_CATALOG,
  buildDesignLabPracticePrompt,
  listDesignLabPracticeSystems,
} from "../../lib/designLab.mjs";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const codeStyle = {
  ...wrap,
  background: "rgba(0,0,0,.18)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 7,
  color: "#d1fae5",
  display: "block",
  fontSize: 11,
  lineHeight: 1.45,
  marginTop: 6,
  maxWidth: "100%",
  padding: 8,
  whiteSpace: "pre-wrap",
};

function LabButton({ label, icon, active, onClick, accent }) {
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
        minHeight: 31,
        padding: "7px 10px",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: active ? accent : "#9fb0c7", fontSize: 14 }} />
      {label}
    </button>
  );
}

function LabPanel({ title, icon, accent, children }) {
  return (
    <section style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, overflow: "hidden", padding: 12 }}>
      <h3 style={{ ...wrap, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 13, gap: 7, marginBottom: 8 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function BulletList({ items, color = "#9fb0c7" }) {
  return (
    <ul style={{ ...wrap, color, display: "grid", fontSize: 11.5, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function PatternCard({ pattern, accent, onAction }) {
  const prompt = [
    `Teach and quiz me on the ${pattern.name} design pattern.`,
    `Intent: ${pattern.intent}`,
    `Practice: ${pattern.practicePrompt}`,
    "Include Java code, Spring Boot usage, when not to use it, and interview traps.",
  ].join("\n");

  return (
    <LabPanel title={pattern.name} icon="ti-puzzle" accent={accent}>
      <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45, marginBottom: 8 }}>{pattern.intent}</p>
      <div style={{ display: "grid", gap: 9 }}>
        <div>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>When To Use</strong>
          <BulletList items={pattern.whenToUse} />
        </div>
        <div>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>When Not To Use</strong>
          <BulletList items={pattern.whenNotToUse} />
        </div>
        <div>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>Java Example</strong>
          <code style={codeStyle}>{pattern.javaExample}</code>
        </div>
        <div>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>Spring Boot Example</strong>
          <code style={codeStyle}>{pattern.springBootExample}</code>
        </div>
        <div>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>Interview Traps</strong>
          <BulletList items={pattern.interviewTraps} color="#fca5a5" />
        </div>
      </div>
      <button
        type="button"
        className="glass-button"
        onClick={() => onAction?.(prompt, { type: "designPattern", pattern })}
        style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, marginTop: 10, padding: "7px 10px" }}
      >
        <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
        Practice Pattern
      </button>
    </LabPanel>
  );
}

function TrackPanel({ track, icon, accent }) {
  return (
    <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
      <LabPanel title="Core Concepts" icon={icon} accent={accent}>
        <BulletList items={track.coreConcepts} />
      </LabPanel>
      <LabPanel title="Key Technologies" icon="ti-stack-2" accent={accent}>
        <BulletList items={track.keyTechnologies} />
      </LabPanel>
      <LabPanel title="Common Patterns" icon="ti-route" accent={accent}>
        <BulletList items={track.commonPatterns} />
      </LabPanel>
      <LabPanel title={track.questionBreakdowns ? "Question Breakdowns" : "Practice Tasks"} icon="ti-message-question" accent={accent}>
        <BulletList items={track.questionBreakdowns || track.practiceTasks} />
      </LabPanel>
    </div>
  );
}

export default function DesignLab({ theme = {}, onAction }) {
  const [activeTab, setActiveTab] = useState("Patterns");
  const practiceSystems = useMemo(() => listDesignLabPracticeSystems(), []);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";

  const tabs = [
    { label: "Patterns", icon: "ti-puzzle" },
    { label: "HLD", icon: "ti-sitemap" },
    { label: "LLD", icon: "ti-code" },
    { label: "Practice", icon: "ti-target-arrow" },
  ];

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
        padding: 14,
        width: "100%",
      }}
    >
      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Design Lab</div>
          <h2 style={{ color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Patterns, HLD, LLD, and interview practice</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {tabs.map((tab) => (
            <LabButton
              key={tab.label}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.label}
              accent={accent}
              onClick={() => setActiveTab(tab.label)}
            />
          ))}
        </div>
      </header>

      {activeTab === "Patterns" && (
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(DESIGN_LAB_CATALOG.patterns.groups).map(([intent, patterns]) => (
            <section key={intent} style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
              <h3 style={{ color: "#f8fbff", fontSize: 13, textTransform: "capitalize" }}>{intent} Patterns</h3>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                {patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} accent={accent} onAction={onAction} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {activeTab === "HLD" && <TrackPanel track={DESIGN_LAB_CATALOG.hld} icon="ti-sitemap" accent={accent} />}
      {activeTab === "LLD" && <TrackPanel track={DESIGN_LAB_CATALOG.lld} icon="ti-code" accent={accent} />}

      {activeTab === "Practice" && (
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))" }}>
          {practiceSystems.map((system) => (
            <LabPanel key={system.id} title={system.title} icon="ti-target-arrow" accent={accent}>
              <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45, marginBottom: 8 }}>{system.focus}</p>
              <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 800, marginBottom: 5 }}>{system.difficulty}</div>
              <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>HLD Angles</strong>
              <BulletList items={system.hldAngles} />
              <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginTop: 8 }}>LLD Angles</strong>
              <BulletList items={system.lldAngles} />
              <div style={{ color: "#c4b5fd", fontSize: 11.3, lineHeight: 1.45, marginTop: 8 }}>
                Patterns: {system.patterns.join(", ")}
              </div>
              <button
                type="button"
                className="glass-button"
                onClick={() => onAction?.(buildDesignLabPracticePrompt(system.id), { type: "designLabPractice", system })}
                style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, marginTop: 10, padding: "7px 10px" }}
              >
                <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
                Start Practice
              </button>
            </LabPanel>
          ))}
        </div>
      )}
    </section>
  );
}
