import { useMemo, useState } from "react";
import {
  DESIGN_LAB_CATALOG,
  buildAgenticAiDesignPrompt,
  buildDesignLabPracticePrompt,
  buildDesignSystemSearchPrompt,
  buildReferencePlaybookPrompt,
  buildReferenceTopicImportPrompt,
  buildUmlClassDesignPrompt,
  listBuildYourOwnTracks,
  listAgenticAiDesignProblems,
  listDesignLabPracticeSystems,
  listInterviewHandbookCheckpoints,
  listReferencePlaybooks,
  listReferenceTopicCatalog,
  listUmlClassPracticeSystems,
  normalizeDesignSystemSearchQuery,
} from "../../lib/designLab.mjs";
import BeginnerGuideBanner from "../BeginnerGuideBanner";

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

const responsiveGrid = (minColumnWidth, gap = 9) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

function LabButton({ label, icon, active, onClick, accent }) {
  return (
    <button
      type="button"
      className={active ? "glass-button" : ""}
      onClick={onClick}
      aria-label={label}
      title={label}
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

function LabPanel({ title, icon, accent, children }) {
  return (
    <section style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, overflow: "hidden", padding: 12 }}>
      <h3 style={{ ...wrap, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 13, gap: 7, marginBottom: 8 }}>
        <i className={`ti ${icon}`} title={title} style={{ color: accent }} />
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

function WorkflowDiagram({ diagram, accent }) {
  if (!diagram?.stages?.length) return null;

  return (
    <section style={{ ...wrap, background: "rgba(139,211,255,.055)", border: `1px solid ${accent}38`, borderRadius: 8, display: "grid", gap: 11, padding: 12 }}>
      <div style={wrap}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Pictorial Workflow</div>
        <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 15, lineHeight: 1.25, marginTop: 4 }}>{diagram.title}</h3>
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{diagram.summary}</p>
      </div>

      <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", minWidth: 0 }}>
        {diagram.stages.map((stage, index) => (
          <article key={stage.title} style={{ ...wrap, background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.085)", borderRadius: 8, display: "grid", gap: 8, minHeight: 176, padding: 10, position: "relative" }}>
            <div style={{ alignItems: "center", display: "flex", gap: 7, minWidth: 0 }}>
              <span style={{ alignItems: "center", background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 8, color: accent, display: "inline-flex", flexShrink: 0, height: 30, justifyContent: "center", width: 30 }}>
                <i className={`ti ${stage.icon}`} title={stage.title} style={{ fontSize: 16 }} />
              </span>
              <div style={wrap}>
                <div style={{ color: accent, fontSize: 10, fontWeight: 900 }}>Step {index + 1}</div>
                <h4 style={{ ...wrap, color: "#f8fbff", fontSize: 12.5, lineHeight: 1.25 }}>{stage.title}</h4>
              </div>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              {stage.nodes.map((node) => (
                <div key={node} style={{ ...wrap, background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#dbeafe", fontSize: 11.2, fontWeight: 800, lineHeight: 1.3, minHeight: 30, padding: "7px 8px" }}>
                  {node}
                </div>
              ))}
            </div>

            <div style={{ ...wrap, alignItems: "center", alignSelf: "end", background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 7, color: "#9fb0c7", display: "flex", fontSize: 10.8, gap: 6, lineHeight: 1.35, padding: "7px 8px" }}>
              <i className="ti ti-arrow-narrow-right" style={{ color: accent, flexShrink: 0, fontSize: 14 }} />
              {stage.signal}
            </div>
          </article>
        ))}
      </div>
    </section>
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
        title={`Practice ${pattern.name}`}
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
    <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
      <WorkflowDiagram diagram={track.workflowDiagram} accent={accent} />
      <div style={responsiveGrid(230)}>
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
    </div>
  );
}

function UmlClassBoard({ systems, accent, onAction }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {systems.map((system) => (
        <LabPanel key={system.id} title={system.title} icon="ti-hierarchy-3" accent={accent}>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45, marginBottom: 9 }}>{system.system}</p>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))", minWidth: 0 }}>
            {system.classes.map((item) => (
              <article key={item.name} style={{ ...wrap, background: "rgba(0,0,0,.16)", border: `1px solid ${accent}30`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ background: `${accent}14`, borderBottom: `1px solid ${accent}28`, color: "#f8fbff", fontSize: 12, fontWeight: 900, padding: "7px 8px" }}>{item.name}</div>
                <div style={{ color: "#9fb0c7", display: "grid", fontSize: 10.8, gap: 5, lineHeight: 1.35, padding: 8 }}>
                  <span><strong style={{ color: "#eaf2ff" }}>Fields:</strong> {item.fields}</span>
                  <span><strong style={{ color: "#eaf2ff" }}>Methods:</strong> {item.methods}</span>
                </div>
              </article>
            ))}
          </div>
          <div style={responsiveGrid(220, 9)}>
            <div>
              <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, margin: "10px 0 6px" }}>Relationships</strong>
              <BulletList items={system.relationships} />
            </div>
            <div>
              <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, margin: "10px 0 6px" }}>Sequence Diagram Steps</strong>
              <BulletList items={system.sequence} />
            </div>
          </div>
          <button type="button" className="glass-button" onClick={() => onAction?.(buildUmlClassDesignPrompt(system.id), { type: "umlClassPractice", system })} title={`Practice ${system.title}`} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, marginTop: 10, padding: "7px 10px" }}>
            <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
            Practice UML
          </button>
        </LabPanel>
      ))}
    </div>
  );
}

function AgenticAiBoard({ problems, accent, onAction }) {
  return (
    <div style={responsiveGrid(250, 10)}>
      {problems.map((problem) => (
        <LabPanel key={problem.id} title={problem.title} icon="ti-sparkles" accent={accent}>
          <div style={{ color: "#a7f3d0", fontSize: 11, fontWeight: 900, marginBottom: 6 }}>{problem.difficulty}</div>
          <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45, marginBottom: 9 }}>{problem.goal}</p>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>Agent Architecture</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "7px 0 10px" }}>
            {problem.architecture.map((node, index) => (
              <span key={node} style={{ alignItems: "center", background: index === 0 ? `${accent}16` : "rgba(255,255,255,.045)", border: `1px solid ${index === 0 ? `${accent}44` : "rgba(255,255,255,.08)"}`, borderRadius: 999, color: "#dbeafe", display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 5, padding: "5px 8px" }}>
                {node}
                {index < problem.architecture.length - 1 && <i className="ti ti-arrow-right" style={{ color: accent }} />}
              </span>
            ))}
          </div>
          <strong style={{ color: "#eaf2ff", fontSize: 11.5 }}>Safety Guardrails</strong>
          <BulletList items={problem.guardrails} color="#fcd34d" />
          <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginTop: 8 }}>Evaluation</strong>
          <BulletList items={problem.evaluation} />
          <button type="button" className="glass-button" onClick={() => onAction?.(buildAgenticAiDesignPrompt(problem.id), { type: "agenticAiDesign", problem })} title={`Practice ${problem.title}`} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, marginTop: 10, padding: "7px 10px" }}>
            <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
            Practice Agent Design
          </button>
        </LabPanel>
      ))}
    </div>
  );
}

function ReferencePlaybookBoard({ playbooks, buildTracks, handbookCheckpoints, topicCatalog, accent, onAction }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <section style={{ ...wrap, background: `linear-gradient(135deg, ${accent}14, rgba(255,255,255,.035))`, border: `1px solid ${accent}30`, borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>Practice Curriculum</div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 16, lineHeight: 1.25, marginTop: 3 }}>Full-context practice maps</h3>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>Use these tracks as complete practice sessions: learn the context, sketch the system, practice the internals, then finish with outcomes you can review.</p>
        </div>
        {playbooks.map((playbook) => (
          <article key={playbook.id} style={{ ...wrap, background: "rgba(0,0,0,.13)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 10, padding: 11 }}>
            <div style={wrap}>
              <h4 style={{ ...wrap, color: "#f8fbff", fontSize: 14, lineHeight: 1.25 }}>{playbook.title}</h4>
              <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{playbook.focus}</p>
            </div>
            <div style={responsiveGrid(230, 10)}>
              <div>
                <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Diagrammatic Drills</strong>
                <BulletList items={playbook.drills} />
              </div>
              <div>
                <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Practice Outcomes</strong>
                <BulletList items={playbook.outcomes} color="#a7f3d0" />
              </div>
            </div>
            <button type="button" className="glass-button" onClick={() => onAction?.(buildReferencePlaybookPrompt(playbook.id), { type: "practiceCurriculum", playbook })} title={`Practice ${playbook.title}`} style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 800, justifySelf: "start", padding: "7px 10px" }}>
              <i className="ti ti-player-play" style={{ color: accent, marginRight: 6 }} />
              Practice Track
            </button>
          </article>
        ))}
      </section>
      <div style={responsiveGrid(260, 10)}>
        <LabPanel title="Build-from-Scratch Tracks" icon="ti-tools" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {buildTracks.map((track) => (
              <div key={track.title} style={{ ...wrap, color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{track.title}</strong>
                <div>{track.buildLoop.join(" -> ")}</div>
                <div style={{ color: "#a7f3d0", marginTop: 2 }}>{track.interviewTransfer}</div>
              </div>
            ))}
          </div>
        </LabPanel>
        <LabPanel title="Handbook Sprint Checklist" icon="ti-list-check" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {handbookCheckpoints.map((checkpoint) => (
              <div key={checkpoint.title} style={{ ...wrap, color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{checkpoint.title}</strong>
                <div>{checkpoint.actions.join(" -> ")}</div>
              </div>
            ))}
          </div>
        </LabPanel>
        <LabPanel title="Primer Topic Map" icon="ti-map" accent={accent}>
          <BulletList items={[
            "Foundations: scalability, latency, throughput, availability, consistency.",
            "Edge: DNS, CDN, load balancing, reverse proxy, routing.",
            "Data: replication, sharding, denormalization, SQL tuning, NoSQL choices.",
            "Async: queues, task workers, back pressure, retries, and observability.",
          ]} />
        </LabPanel>
      </div>
      <section style={{ ...wrap, border: `1px solid ${accent}30`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>Practice Topic Maps</div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 16, lineHeight: 1.25, marginTop: 3 }}>Full context by practice area</h3>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>Each map is meant to become a session, not a flashcard: read the context, choose the topics, perform the drills, and review the outcomes.</p>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {topicCatalog.map((group) => (
            <article key={group.title} style={{ ...wrap, background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 10, padding: 11 }}>
              <div style={wrap}>
                <strong style={{ ...wrap, color: "#f8fbff", display: "block", fontSize: 13 }}>{group.title}</strong>
                <p style={{ ...wrap, color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>{group.focus}</p>
                <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45, marginTop: 5 }}>{group.practiceContext}</p>
              </div>
              <div style={responsiveGrid(230, 10)}>
                <div>
                  <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Start Here</strong>
                  <BulletList items={group.startHere} />
                </div>
                <div>
                  <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Visual Flow</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, minWidth: 0 }}>
                    {group.visualFlow.map((step, index) => (
                      <span key={`${group.title}-${step}`} style={{ alignItems: "center", background: index === 0 ? `${accent}18` : "rgba(255,255,255,.045)", border: `1px solid ${index === 0 ? `${accent}40` : "rgba(255,255,255,.08)"}`, borderRadius: 7, color: "#dbeafe", display: "inline-flex", fontSize: 10.5, fontWeight: 850, gap: 5, lineHeight: 1.25, padding: "5px 7px" }}>
                        {step}
                        {index < group.visualFlow.length - 1 && <i className="ti ti-arrow-right" style={{ color: accent, fontSize: 12 }} />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Beginner Explainer</strong>
                <div style={responsiveGrid(220, 8)}>
                  {group.beginnerExplainers.map((item) => (
                    <div key={`${group.title}-${item.topic}`} style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 5, padding: 8 }}>
                      <strong style={{ color: "#f8fbff", fontSize: 11.5 }}>{item.topic}</strong>
                      <span style={{ color: "#cbd5e1", fontSize: 11, lineHeight: 1.4 }}>{item.what}</span>
                      <span style={{ color: "#9fb0c7", fontSize: 10.8, lineHeight: 1.4 }}>{item.why}</span>
                      <span style={{ color: "#a7f3d0", fontSize: 10.8, lineHeight: 1.4 }}>{item.whereUsed}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={responsiveGrid(230, 10)}>
                <div>
                  <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Difficulty Path</strong>
                  <div style={{ display: "grid", gap: 7 }}>
                    {group.difficultyPath.map((item) => (
                      <div key={`${group.title}-${item.level}`} style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, color: "#9fb0c7", fontSize: 11, lineHeight: 1.4, padding: 8 }}>
                        <strong style={{ color: "#eaf2ff" }}>{item.level}</strong>: {item.goal}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Try This Practice</strong>
                  <div style={{ ...wrap, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, padding: 8 }}>
                    <strong style={{ color: "#f8fbff", display: "block", fontSize: 11.5, marginBottom: 6 }}>{group.guidedPractice.title}</strong>
                    <BulletList items={group.guidedPractice.steps} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, minWidth: 0 }}>
                {group.topics.map((topic) => (
                  <span key={`${group.title}-${topic}`} style={{ ...wrap, background: `${accent}12`, border: `1px solid ${accent}2f`, borderRadius: 7, color: "#dbeafe", fontSize: 10.5, fontWeight: 800, lineHeight: 1.25, padding: "4px 6px" }}>
                    {topic}
                  </span>
                ))}
              </div>
              <div style={responsiveGrid(230, 10)}>
                <div>
                  <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Practice Drills</strong>
                  <BulletList items={group.practiceDrills} />
                </div>
                <div>
                  <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Practice Outcomes</strong>
                  <BulletList items={group.outcomes} color="#a7f3d0" />
                </div>
              </div>
              <div>
                <strong style={{ color: "#eaf2ff", display: "block", fontSize: 11.5, marginBottom: 6 }}>Common Confusions</strong>
                <BulletList items={group.commonConfusions} color="#fcd34d" />
              </div>
            </article>
          ))}
          <button type="button" className="glass-button" onClick={() => onAction?.(buildReferenceTopicImportPrompt(), { type: "referenceTopicPlan", topicCatalog })} title="Build a topic-based practice plan" style={{ border: `1px solid ${accent}55`, borderRadius: 7, color: "#f8fbff", fontSize: 11, fontWeight: 850, justifySelf: "start", padding: "7px 10px" }}>
            <i className="ti ti-calendar-plus" style={{ color: accent, marginRight: 6 }} />
            Build Topic Plan
          </button>
        </div>
      </section>
    </div>
  );
}

function DesignSearchPanel({ query, onQueryChange, onSubmit, accent, accentBorder }) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        alignItems: "end",
        border: `1px solid ${accentBorder}`,
        borderRadius: 8,
        display: "grid",
        gap: 9,
        gridTemplateColumns: "minmax(0, 1fr) auto",
        minWidth: 0,
        padding: 10,
      }}
    >
      <label style={{ ...wrap, display: "grid", gap: 5 }}>
        <span style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Search Any System</span>
        <span style={{ alignItems: "center", background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, display: "flex", gap: 8, minWidth: 0, padding: "0 9px" }}>
          <i className="ti ti-search" title="Search" style={{ color: accent, flexShrink: 0, fontSize: 15 }} />
          <input
            aria-label="Search any design system"
            className="glass-input"
            maxLength={120}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search a system: URL shortener, food delivery, design system platform..."
            style={{
              background: "transparent",
              border: "none",
              color: "#f8fbff",
              fontSize: 12,
              minHeight: 36,
              minWidth: 0,
              outline: "none",
              width: "100%",
            }}
            value={query}
          />
        </span>
      </label>
      <button
        type="submit"
        className="glass-button"
        disabled={!normalizeDesignSystemSearchQuery(query)}
        title="Generate interview-ready HLD, LLD, and architecture answer"
        style={{
          border: `1px solid ${accent}55`,
          borderRadius: 7,
          color: "#f8fbff",
          cursor: normalizeDesignSystemSearchQuery(query) ? "pointer" : "not-allowed",
          fontSize: 11,
          fontWeight: 900,
          minHeight: 36,
          opacity: normalizeDesignSystemSearchQuery(query) ? 1 : 0.48,
          padding: "8px 11px",
          whiteSpace: "nowrap",
        }}
      >
        <i className="ti ti-sparkles" title="Generate Answer" style={{ color: accent, marginRight: 6 }} />
        Generate Answer
      </button>
    </form>
  );
}

export default function DesignLab({ theme = {}, onAction, beginnerMode = false, beginnerStep = "watch", onBeginnerStepChange }) {
  const [activeTab, setActiveTab] = useState("Patterns");
  const [searchQuery, setSearchQuery] = useState("");
  const practiceSystems = useMemo(() => listDesignLabPracticeSystems(), []);
  const umlSystems = useMemo(() => listUmlClassPracticeSystems(), []);
  const agenticProblems = useMemo(() => listAgenticAiDesignProblems(), []);
  const referencePlaybooks = useMemo(() => listReferencePlaybooks(), []);
  const buildTracks = useMemo(() => listBuildYourOwnTracks(), []);
  const handbookCheckpoints = useMemo(() => listInterviewHandbookCheckpoints(), []);
  const topicCatalog = useMemo(() => listReferenceTopicCatalog(), []);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";

  const tabs = [
    { label: "Patterns", icon: "ti-puzzle" },
    { label: "HLD", icon: "ti-sitemap" },
    { label: "LLD", icon: "ti-code" },
    { label: "OOD / UML", icon: "ti-hierarchy-3" },
    { label: "Agentic AI", icon: "ti-sparkles" },
    { label: "Curriculum", icon: "ti-book-2" },
    { label: "Practice", icon: "ti-target-arrow" },
  ];
  const handleDesignSearch = (event) => {
    event.preventDefault();
    const query = normalizeDesignSystemSearchQuery(searchQuery);
    if (!query) return;

    onAction?.(buildDesignSystemSearchPrompt(query), {
      type: "designSystemSearch",
      query,
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
        detail="For design: watch one pattern, predict the trade-off, explain the API shape, practice a design prompt, then review the missing constraint."
      />

      <header style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Design Lab</div>
          <h2 style={{ ...wrap, color: "#f8fbff", fontSize: 19, lineHeight: 1.25, marginTop: 4 }}>Patterns, HLD, LLD, and interview practice</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minWidth: 0 }}>
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

      <DesignSearchPanel
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSubmit={handleDesignSearch}
        accent={accent}
        accentBorder={accentBorder}
      />

      {activeTab === "Patterns" && (
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(DESIGN_LAB_CATALOG.patterns.groups).map(([intent, patterns]) => (
            <section key={intent} style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 10, minWidth: 0, padding: 12 }}>
              <h3 style={{ color: "#f8fbff", fontSize: 13, textTransform: "capitalize" }}>{intent} Patterns</h3>
              <div style={responsiveGrid(260, 10)}>
                {patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} accent={accent} onAction={onAction} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {activeTab === "HLD" && <TrackPanel track={DESIGN_LAB_CATALOG.hld} icon="ti-sitemap" accent={accent} />}
      {activeTab === "LLD" && <TrackPanel track={DESIGN_LAB_CATALOG.lld} icon="ti-code" accent={accent} />}
      {activeTab === "OOD / UML" && <UmlClassBoard systems={umlSystems} accent={accent} onAction={onAction} />}
      {activeTab === "Agentic AI" && <AgenticAiBoard problems={agenticProblems} accent={accent} onAction={onAction} />}
      {activeTab === "Curriculum" && <ReferencePlaybookBoard playbooks={referencePlaybooks} buildTracks={buildTracks} handbookCheckpoints={handbookCheckpoints} topicCatalog={topicCatalog} accent={accent} onAction={onAction} />}

      {activeTab === "Practice" && (
        <div style={responsiveGrid(245, 10)}>
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
                title={`Start ${system.title} practice`}
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
