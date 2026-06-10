import { useEffect, useMemo, useState } from "react";
import {
  buildCanvasMockPrompt,
  buildCanvasReviewPrompt,
  buildSystemDesignDiagramBoard,
  buildSystemDesignDiagramEvaluationPrompt,
  buildSystemDesignReferenceRoadmap,
  buildSystemDesignStudioBlueprint,
  buildSystemDesignStudioPrompt,
  createSystemDesignCanvasState,
  exportSystemDesignCanvasMarkdown,
  SYSTEM_DESIGN_LEARNING_CATALOG,
  SYSTEM_DESIGN_PATTERN_LIBRARY,
  SYSTEM_DESIGN_CANVAS_SECTIONS,
} from "../../lib/systemDesignCanvas.mjs";
import BeginnerGuideBanner from "../BeginnerGuideBanner";

const wrappingTextStyle = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const wrappingCodeStyle = {
  ...wrappingTextStyle,
  display: "block",
  maxWidth: "100%",
  whiteSpace: "pre-wrap",
};

const responsiveGrid = (minColumnWidth, gap = 9) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

function ActionButton({ icon, label, onClick, tone = "#8bd3ff" }) {
  return (
    <button
      type="button"
      className="glass-button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        alignItems: "center",
        border: `1px solid ${tone}55`,
        borderRadius: 7,
        color: "#f8fbff",
        display: "inline-flex",
        fontSize: 11,
        fontWeight: 700,
        gap: 6,
        lineHeight: 1,
        maxWidth: "100%",
        minHeight: 30,
        padding: "7px 10px",
        whiteSpace: "nowrap",
      }}
    >
      <i className={`ti ${icon}`} style={{ color: tone, fontSize: 14 }} />
      {label}
    </button>
  );
}

function ListPanel({ title, icon, items, accent, children }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: 11, background: "rgba(255,255,255,.035)", minWidth: 0, overflow: "hidden" }}>
      <h3 style={{ ...wrappingTextStyle, alignItems: "center", color: "#f8fbff", display: "flex", fontSize: 12.5, gap: 7, marginBottom: 8 }}>
        <i className={`ti ${icon}`} style={{ color: accent }} />
        {title}
      </h3>
      {children || (
        <ul style={{ ...wrappingTextStyle, color: "#9fb0c7", display: "grid", fontSize: 11.5, gap: 6, lineHeight: 1.45, margin: 0, paddingLeft: 17 }}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </section>
  );
}

function buildArchitectureFlow(blueprint) {
  const serviceNames = (blueprint?.hld?.services || []).map((service) => service.name);
  const storage = (blueprint?.lld?.schema || []).length ? "Primary DB" : "Storage";
  return [
    { id: "client", label: "Client", icon: "ti-device-laptop", detail: "User request enters the system." },
    { id: "gateway", label: "Gateway", icon: "ti-shield-lock", detail: "Auth, routing, rate limit, and request shaping." },
    { id: "service", label: serviceNames[0] || "API Service", icon: "ti-server", detail: "Validates and orchestrates the core workflow." },
    { id: "cache", label: "Cache", icon: "ti-bolt", detail: "Hot reads, locks, sessions, or derived projections." },
    { id: "db", label: storage, icon: "ti-database", detail: "Durable source of truth and indexes." },
    { id: "queue", label: "Queue", icon: "ti-messages", detail: "Async fanout, retries, and slow side effects." },
  ];
}

function ArchitectureFlow({ blueprint, activeIndex, accent }) {
  const steps = buildArchitectureFlow(blueprint);
  const active = steps[activeIndex % steps.length] || steps[0];
  const bottleneck = blueprint?.hld?.risks?.[0] || "Watch the highest-contention write path.";
  const tradeoff = blueprint?.hld?.scaling?.[0] || "Use cache and queues carefully; keep critical writes durable.";

  return (
    <section style={{ border: `1px solid ${accent}30`, borderRadius: 8, background: "rgba(0,0,0,.16)", display: "grid", gap: 11, padding: 11 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Animated Architecture Flow</div>
          <p style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45, marginTop: 4 }}>Request path with bottleneck and trade-off callouts.</p>
        </div>
        <span style={{ color: "#a7f3d0", fontSize: 10.8, fontWeight: 900 }}>{active.label}</span>
      </div>

      <div style={{ alignItems: "stretch", display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))" }}>
        {steps.map((step, index) => {
          const isActive = index === activeIndex % steps.length;
          return (
            <div key={step.id} style={{ background: isActive ? `${accent}18` : "rgba(255,255,255,.035)", border: `1px solid ${isActive ? accent : "rgba(255,255,255,.075)"}`, borderRadius: 8, display: "grid", gap: 6, minHeight: 98, padding: 9, transform: isActive ? "translateY(-3px)" : "translateY(0)", transition: "transform .25s ease, border-color .25s ease, background .25s ease" }}>
              <i className={`ti ${step.icon}`} style={{ color: isActive ? accent : "#9fb0c7", fontSize: 17 }} />
              <strong style={{ color: "#f8fbff", fontSize: 11.5, lineHeight: 1.3 }}>{step.label}</strong>
              <span style={{ color: "#9fb0c7", fontSize: 10.5, lineHeight: 1.35 }}>{step.detail}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
        <div style={{ border: "1px solid rgba(250,204,21,.22)", borderRadius: 8, color: "#fde68a", fontSize: 11.2, lineHeight: 1.45, padding: 9 }}>
          <strong style={{ display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Bottleneck</strong>
          {bottleneck}
        </div>
        <div style={{ border: "1px solid rgba(167,243,208,.22)", borderRadius: 8, color: "#d1fae5", fontSize: 11.2, lineHeight: 1.45, padding: 9 }}>
          <strong style={{ display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Trade-off</strong>
          {tradeoff}
        </div>
      </div>
    </section>
  );
}

function DiagramBoard({ board, roadmap, accent, onEvaluate }) {
  if (!board?.lanes?.length) return null;

  return (
    <section style={{ border: `1px solid ${accent}34`, borderRadius: 8, background: "rgba(0,0,0,.16)", display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 9, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={wrappingTextStyle}>
          <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Interactive Whiteboard</div>
          <h3 style={{ ...wrappingTextStyle, color: "#f8fbff", fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>{board.title}</h3>
          <p style={{ ...wrappingTextStyle, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>Diagram the system in layers, then ask for AI evaluation on missing boxes, arrows, and trade-offs.</p>
        </div>
        <ActionButton icon="ti-sparkles" label="Evaluate Diagram" onClick={onEvaluate} tone={accent} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", minWidth: 0 }}>
        {board.lanes.map((lane, laneIndex) => (
          <article key={lane.title} style={{ ...wrappingTextStyle, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.085)", borderRadius: 8, display: "grid", gap: 9, minHeight: 210, padding: 10 }}>
            <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
              <span style={{ alignItems: "center", background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 8, color: accent, display: "inline-flex", flexShrink: 0, fontSize: 11, fontWeight: 950, height: 30, justifyContent: "center", width: 30 }}>
                {laneIndex + 1}
              </span>
              <div style={wrappingTextStyle}>
                <h4 style={{ color: "#f8fbff", fontSize: 12.5, lineHeight: 1.25 }}>{lane.title}</h4>
                <p style={{ color: "#9fb0c7", fontSize: 10.7, lineHeight: 1.35, marginTop: 2 }}>{lane.intent}</p>
              </div>
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {lane.nodes.map((node, index) => (
                <div key={`${lane.title}-${node}`} style={{ ...wrappingTextStyle, alignItems: "center", background: index === 0 ? `${accent}12` : "rgba(0,0,0,.16)", border: `1px solid ${index === 0 ? `${accent}44` : "rgba(255,255,255,.075)"}`, borderRadius: 8, color: "#eaf2ff", display: "flex", fontSize: 11.3, fontWeight: 850, gap: 7, justifyContent: "space-between", lineHeight: 1.3, minHeight: 34, padding: "7px 8px" }}>
                  <span>{node}</span>
                  {index < lane.nodes.length - 1 && <i className="ti ti-arrow-down" style={{ color: accent, flexShrink: 0, fontSize: 14 }} />}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div style={responsiveGrid(220)}>
        <ListPanel title="Diagram Edges" icon="ti-route" items={board.edges} accent={accent} />
        <ListPanel title="AI Evaluation Rubric" icon="ti-clipboard-check" accent={accent}>
          <div style={{ display: "grid", gap: 7 }}>
            {board.evaluationRubric.map((item) => (
              <div key={item.label} style={{ color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{item.label}</strong>: {item.check}
              </div>
            ))}
          </div>
        </ListPanel>
        <ListPanel title="Whiteboard Prompts" icon="ti-chalkboard" items={board.whiteboardPrompts} accent={accent} />
        <ListPanel title="Reference Moves" icon="ti-book-2" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {board.referenceMoves.map((item) => (
              <div key={item.source} style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{item.source}</strong>: {item.moves.join(" -> ")}
              </div>
            ))}
          </div>
        </ListPanel>
      </div>

      <div style={responsiveGrid(230)}>
        <ListPanel title="Primer Topic Map" icon="ti-map" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {roadmap.topicGroups.map((group) => (
              <div key={group.title} style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{group.title}</strong>
                <div>{group.concepts.join(", ")}</div>
                <div style={{ color: "#a7f3d0", marginTop: 2 }}>{group.diagramCue}</div>
              </div>
            ))}
          </div>
        </ListPanel>
        <ListPanel title="Sample Design Boards" icon="ti-layout-board" accent={accent}>
          <div style={{ display: "grid", gap: 8 }}>
            {roadmap.sampleBoards.slice(0, 4).map((boardItem) => (
              <div key={boardItem.title} style={{ color: "#9fb0c7", fontSize: 11.2, lineHeight: 1.45 }}>
                <strong style={{ color: "#eaf2ff" }}>{boardItem.title}</strong>
                <div>{boardItem.diagramFocus.join(" -> ")}</div>
              </div>
            ))}
          </div>
        </ListPanel>
      </div>
    </section>
  );
}

export default function SystemDesignCanvas({
  initialState,
  onChange,
  onReview,
  onMock,
  onExport,
  onAction,
  theme = {},
  beginnerMode = false,
  beginnerStep = "watch",
  onBeginnerStepChange,
}) {
  const normalizedInitialState = useMemo(
    () => createSystemDesignCanvasState(initialState),
    [initialState],
  );
  const [canvasState, setCanvasState] = useState(normalizedInitialState);
  const [blueprint, setBlueprint] = useState(() => buildSystemDesignStudioBlueprint(normalizedInitialState));
  const [studioTab, setStudioTab] = useState("Diagram");
  const [flowIndex, setFlowIndex] = useState(0);
  const accent = theme.accentStrong || "#8bd3ff";
  const accentBorder = theme.accentBorder || "rgba(139, 211, 255, .26)";
  const diagramBoard = useMemo(() => buildSystemDesignDiagramBoard(canvasState), [canvasState]);
  const referenceRoadmap = useMemo(() => buildSystemDesignReferenceRoadmap(canvasState.problem), [canvasState.problem]);

  useEffect(() => {
    setCanvasState(normalizedInitialState);
    setBlueprint(buildSystemDesignStudioBlueprint(normalizedInitialState));
  }, [normalizedInitialState]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFlowIndex((value) => (value + 1) % 6);
    }, 1500);

    return () => window.clearInterval(timer);
  }, []);

  const commitState = (nextState) => {
    const normalized = createSystemDesignCanvasState(nextState);
    setCanvasState(normalized);
    onChange?.(normalized);
  };

  const updateProblem = (event) => {
    commitState({ ...canvasState, problem: event.target.value });
  };

  const generateStudio = () => {
    const nextBlueprint = buildSystemDesignStudioBlueprint(canvasState);
    setBlueprint(nextBlueprint);
    setStudioTab("Diagram");
  };

  const askStudioAI = () => {
    const prompt = buildSystemDesignStudioPrompt(canvasState);
    onAction?.(prompt, { type: "studio", canvasState, blueprint });
  };

  const evaluateDiagram = () => {
    const prompt = buildSystemDesignDiagramEvaluationPrompt(canvasState);
    onAction?.(prompt, { type: "diagramEvaluation", canvasState, diagramBoard });
  };

  const updateSection = (key, value) => {
    commitState({
      ...canvasState,
      sections: {
        ...canvasState.sections,
        [key]: value,
      },
    });
  };

  const reviewCanvas = () => {
    const prompt = buildCanvasReviewPrompt(canvasState);
    onReview?.(prompt, canvasState);
    onAction?.(prompt, { type: "review", canvasState });
  };

  const mockCanvas = () => {
    const prompt = buildCanvasMockPrompt(canvasState);
    onMock?.(prompt, canvasState);
    onAction?.(prompt, { type: "mock", canvasState });
  };

  const exportCanvas = async () => {
    const markdown = exportSystemDesignCanvasMarkdown(canvasState);
    onExport?.(markdown, canvasState);

    if (!onExport && typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
    }
  };

  return (
    <section
      className="glass-card"
      style={{
        background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        boxShadow: "0 18px 46px rgba(0,0,0,.24)",
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
        detail="For system design: capture requirements, predict the request flow, explain one trade-off, practice a mock question, then review missing scale and failure details."
      />

      <header
        style={{
          alignItems: "start",
          ...responsiveGrid(260, 10),
        }}
      >
        <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
          <span style={{ color: "#9fb0c7", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            System Design Canvas + Studio
          </span>
          <textarea
            value={canvasState.problem}
            onChange={updateProblem}
            placeholder="Problem, e.g. Implement Ticket Booking System"
            rows={2}
            style={{
              background: "rgba(255,255,255,.06)",
              border: `1px solid ${accentBorder}`,
              borderRadius: 7,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.45,
              minHeight: 56,
              outline: "none",
              padding: "8px 10px",
              resize: "vertical",
              minWidth: 0,
              width: "100%",
            }}
          />
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "flex-start", minWidth: 0 }}>
          <ActionButton icon="ti-wand" label="Generate HLD + LLD" onClick={generateStudio} tone="#a7f3d0" />
          <ActionButton icon="ti-robot" label="Ask AI for full design" onClick={askStudioAI} tone="#c4b5fd" />
          <ActionButton icon="ti-sparkles" label="Review" onClick={reviewCanvas} tone={accent} />
          <ActionButton icon="ti-player-play" label="Mock" onClick={mockCanvas} tone="#a7f3d0" />
          <ActionButton icon="ti-download" label="Export" onClick={exportCanvas} tone="#facc15" />
        </div>
      </header>

      <section style={{ border: `1px solid ${accentBorder}`, borderRadius: 8, display: "grid", gap: 11, minWidth: 0, padding: 12, background: "rgba(139,211,255,.045)" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ ...wrappingTextStyle }}>
            <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>HLD / LLD Blueprint</div>
            <h2 style={{ ...wrappingTextStyle, color: "#f8fbff", fontSize: 18, lineHeight: 1.25, marginTop: 4 }}>{blueprint.title}</h2>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
            {["Diagram", "HLD", "LLD", "Guide", "Patterns", "Interview"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={studioTab === tab ? "glass-button" : ""}
                onClick={() => setStudioTab(tab)}
                style={{
                  border: `1px solid ${studioTab === tab ? accent : "rgba(255,255,255,.08)"}`,
                  borderRadius: 7,
                  color: studioTab === tab ? "#f8fbff" : "#9fb0c7",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "7px 10px",
                  background: studioTab === tab ? "rgba(139,211,255,.12)" : "rgba(0,0,0,.14)",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {studioTab === "Diagram" && (
          <DiagramBoard board={diagramBoard} roadmap={referenceRoadmap} accent={accent} onEvaluate={evaluateDiagram} />
        )}

        {studioTab === "HLD" && (
          <div style={{ display: "grid", gap: 11 }}>
            <ArchitectureFlow blueprint={blueprint} activeIndex={flowIndex} accent={accent} />
            <div style={responsiveGrid(220)}>
              <ListPanel title="Functional Requirements" icon="ti-list-check" items={blueprint.hld.requirements} accent={accent} />
              <ListPanel title="Non-Functional Requirements" icon="ti-gauge" items={blueprint.hld.nonFunctional} accent={accent} />
              <ListPanel title="Services" icon="ti-topology-star" accent={accent}>
                <div style={{ display: "grid", gap: 7 }}>
                  {blueprint.hld.services.map((service) => (
                    <div key={service.name} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                      <strong style={{ color: "#eaf2ff" }}>{service.name}</strong>: {service.responsibility}
                    </div>
                  ))}
                </div>
              </ListPanel>
              <ListPanel title="APIs" icon="ti-api" accent={accent}>
                <div style={{ display: "grid", gap: 7 }}>
                  {blueprint.hld.apis.map((api) => (
                    <div key={`${api.method}-${api.path}`} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                      <strong style={{ color: "#a7f3d0" }}>{api.method}</strong> <span style={{ color: "#eaf2ff" }}>{api.path}</span> - {api.purpose}
                    </div>
                  ))}
                </div>
              </ListPanel>
              <ListPanel title="Scaling & Reliability" icon="ti-chart-arrows" items={blueprint.hld.scaling} accent={accent} />
              <ListPanel title="Risks / Trade-offs" icon="ti-alert-triangle" items={blueprint.hld.risks} accent={accent} />
            </div>
          </div>
        )}

        {studioTab === "LLD" && (
          <div style={responsiveGrid(230)}>
            <ListPanel title="Classes / Components" icon="ti-box" accent={accent}>
              <div style={{ display: "grid", gap: 7 }}>
                {blueprint.lld.classes.map((item) => (
                  <div key={item.name} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                    <strong style={{ color: "#eaf2ff" }}>{item.name}</strong>: {item.responsibility}
                  </div>
                ))}
              </div>
            </ListPanel>
            <ListPanel title="Interfaces" icon="ti-plug-connected" items={blueprint.lld.interfaces} accent={accent} />
            <ListPanel title="Schema / Indexes" icon="ti-database" accent={accent}>
              <div style={{ display: "grid", gap: 7 }}>
                {blueprint.lld.schema.map((line) => (
                  <code key={line} style={{ ...wrappingCodeStyle, color: "#d1fae5", fontSize: 11, lineHeight: 1.45 }}>{line}</code>
                ))}
              </div>
            </ListPanel>
            <ListPanel title="Testing Strategy" icon="ti-test-pipe" items={blueprint.lld.testing} accent={accent} />
          </div>
        )}

        {studioTab === "Guide" && (
          <div style={responsiveGrid(240)}>
            {Object.values(SYSTEM_DESIGN_LEARNING_CATALOG).map((track) => (
              <ListPanel key={track.label} title={track.label} icon={track.label === "System Design" ? "ti-sitemap" : "ti-code"} accent={accent}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Core Concepts</div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {track.coreConcepts.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Key Technologies</div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {track.keyTechnologies.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>Common Patterns</div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {track.commonPatterns.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div style={{ color: "#eaf2ff", fontSize: 11, fontWeight: 900, marginBottom: 5, textTransform: "uppercase" }}>
                      {track.questionBreakdowns ? "Question Breakdowns" : "Practice Tasks"}
                    </div>
                    <ul style={{ color: "#9fb0c7", display: "grid", fontSize: 11.3, gap: 5, lineHeight: 1.45, margin: 0, paddingLeft: 16 }}>
                      {(track.questionBreakdowns || track.practiceTasks).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              </ListPanel>
            ))}
          </div>
        )}

        {studioTab === "Patterns" && (
          <div style={responsiveGrid(220)}>
            {Object.entries(SYSTEM_DESIGN_PATTERN_LIBRARY).map(([intent, patterns]) => (
              <ListPanel key={intent} title={`${intent.charAt(0).toUpperCase()}${intent.slice(1)} Patterns`} icon="ti-puzzle" accent={accent}>
                <div style={{ display: "grid", gap: 9 }}>
                  {patterns.map((pattern) => (
                    <div key={pattern.name} style={{ ...wrappingTextStyle, color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45 }}>
                      <strong style={{ color: "#eaf2ff" }}>{pattern.name}</strong>
                      <div>{pattern.intent}</div>
                      <div style={{ color: "#a7f3d0", marginTop: 3 }}>{pattern.useCase}</div>
                      <code style={{ ...wrappingCodeStyle, color: "#d1fae5", marginTop: 3 }}>{pattern.example}</code>
                    </div>
                  ))}
                </div>
              </ListPanel>
            ))}
            <ListPanel title="Recommended For This System" icon="ti-target-arrow" accent={accent}>
              <div style={{ display: "grid", gap: 7 }}>
                {blueprint.lld.patterns.map((pattern) => (
                  <div key={pattern.pattern} style={{ color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45 }}>
                    <strong style={{ color: "#eaf2ff" }}>{pattern.pattern}</strong>: {pattern.reason}
                  </div>
                ))}
              </div>
            </ListPanel>
          </div>
        )}

        {studioTab === "Interview" && (
          <div style={responsiveGrid(230)}>
            <ListPanel title="Clarify First" icon="ti-message-question" items={blueprint.interviewBreakdown.clarify} accent={accent} />
            <ListPanel title="Deep-Dive Map" icon="ti-route" items={blueprint.interviewBreakdown.deepDives} accent={accent} />
            <ListPanel title="Likely Follow-ups" icon="ti-messages" items={blueprint.interviewBreakdown.questions} accent={accent} />
          </div>
        )}
      </section>

      <div
        style={{
          ...responsiveGrid(210),
        }}
      >
        {SYSTEM_DESIGN_CANVAS_SECTIONS.map((section) => (
          <label
            key={section.key}
            style={{
              background: "rgba(255,255,255,.045)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 8,
              display: "grid",
              gap: 7,
              minHeight: 146,
              minWidth: 0,
              padding: 10,
            }}
          >
            <span style={{ alignItems: "center", color: "#eaf2ff", display: "flex", fontSize: 12, fontWeight: 800, gap: 6 }}>
              <i className="ti ti-layout-kanban" style={{ color: accent, fontSize: 13 }} />
              {section.label}
            </span>
            <textarea
              value={canvasState.sections[section.key]}
              onChange={(event) => updateSection(section.key, event.target.value)}
              placeholder={section.placeholder}
              rows={4}
              style={{
                background: "rgba(0,0,0,.16)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 7,
                color: "#f7fbff",
                fontSize: 12,
                lineHeight: 1.45,
                minHeight: 92,
                minWidth: 0,
                outline: "none",
                padding: 9,
                resize: "vertical",
                width: "100%",
              }}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
