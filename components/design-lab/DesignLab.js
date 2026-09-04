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
import AnswerAtAGlance from "../learning/AnswerAtAGlance";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

// Keep Design Lab's instructional hierarchy in the blue/violet family. The
// previous mint treatment looked washed out against the light workspace theme.
const CODE_TEXT_TONE = "#bfdbfe";
const DETAIL_TONE = "#c4b5fd";

const codeStyle = {
  ...wrap,
  background: "rgba(0,0,0,.18)",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 7,
  color: CODE_TEXT_TONE,
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

const END_TO_END_WORKFLOWS = [
  {
    id: "read-cache-hit",
    label: "Read: cache hit",
    title: "User reads hot data from cache",
    summary: "Use this when the interviewer asks how a read-heavy API stays fast under repeated traffic.",
    steps: [
      {
        node: "User",
        icon: "ti-user",
        tone: "#93c5fd",
        action: "Browser or mobile app requests a product, feed, profile, or order status.",
        teach: "Start from the user action, not from the database. The user only cares about latency and correctness.",
      },
      {
        node: "Edge",
        icon: "ti-shield-check",
        tone: "#8bd3ff",
        action: "CDN, API gateway, auth, routing, and rate limiting accept the request.",
        teach: "The edge protects services and rejects bad requests before they spend backend capacity.",
      },
      {
        node: "Service",
        icon: "ti-server",
        tone: "#c4b5fd",
        action: "Application service validates the request and builds a cache key.",
        teach: "The service owns business meaning: who is asking, what can they read, and what key represents it.",
      },
      {
        node: "Cache",
        icon: "ti-bolt",
        tone: "#facc15",
        action: "Redis returns the cached response or cached projection.",
        teach: "A cache hit avoids database work. Say the TTL, key shape, and invalidation rule.",
      },
      {
        node: "Response",
        icon: "ti-arrow-back-up",
        tone: DETAIL_TONE,
        action: "Service returns the response with low latency.",
        teach: "Mention freshness: fast is useful only if the returned data is acceptably current.",
      },
      {
        node: "Observability",
        icon: "ti-chart-line",
        tone: "#fda4af",
        action: "Metrics record cache hit rate, p95 latency, errors, and rate-limit decisions.",
        teach: "Every workflow answer should end with how you would know it is working.",
      },
    ],
  },
  {
    id: "read-cache-miss",
    label: "Read: cache miss",
    title: "User reads data, cache misses, DB fills cache",
    summary: "Use this when explaining cache-aside and why the DB remains source of truth.",
    steps: [
      {
        node: "User",
        icon: "ti-user",
        tone: "#93c5fd",
        action: "User requests data that is not currently hot in cache.",
        teach: "Name whether this read can tolerate slightly stale data or must be fully fresh.",
      },
      {
        node: "Edge",
        icon: "ti-shield-check",
        tone: "#8bd3ff",
        action: "Gateway checks auth, throttles abusive traffic, and routes to the service.",
        teach: "Rate limiting matters because cache misses are more expensive than hits.",
      },
      {
        node: "Service",
        icon: "ti-server",
        tone: "#c4b5fd",
        action: "Service checks cache first and receives a miss.",
        teach: "Cache-aside means the service decides when to read-through and fill the cache.",
      },
      {
        node: "Database",
        icon: "ti-database",
        tone: DETAIL_TONE,
        action: "Primary DB or read replica loads the row, aggregate, or projection.",
        teach: "Call out indexes and read replicas when latency or QPS becomes the bottleneck.",
      },
      {
        node: "Cache Fill",
        icon: "ti-bolt",
        tone: "#facc15",
        action: "Service stores the computed response in cache with TTL and size limits.",
        teach: "Never say cache without saying key, TTL, eviction, and invalidation.",
      },
      {
        node: "Response",
        icon: "ti-arrow-back-up",
        tone: DETAIL_TONE,
        action: "Response returns to the user and later requests become cache hits.",
        teach: "This is where you mention stampede protection for many simultaneous misses.",
      },
      {
        node: "Observability",
        icon: "ti-chart-line",
        tone: "#fda4af",
        action: "Dashboards track miss rate, DB query latency, cache fill failures, and hot keys.",
        teach: "Miss-rate spikes usually mean key churn, eviction pressure, or a broken invalidation path.",
      },
    ],
  },
  {
    id: "write-db-mq-cache",
    label: "Write: DB + MQ + cache",
    title: "User writes data, DB commits, MQ fans out, cache updates",
    summary: "Use this when explaining checkout, booking, comment creation, payment, or any state-changing workflow.",
    steps: [
      {
        node: "User",
        icon: "ti-user-plus",
        tone: "#93c5fd",
        action: "User submits a command such as place order, reserve seat, publish comment, or update profile.",
        teach: "A write workflow begins with idempotency and validation, not with inserting a row.",
      },
      {
        node: "Edge",
        icon: "ti-shield-lock",
        tone: "#8bd3ff",
        action: "Gateway authenticates, checks rate limits, and forwards an idempotency key.",
        teach: "The idempotency key protects the system from double-clicks and client retries.",
      },
      {
        node: "Service",
        icon: "ti-server-cog",
        tone: "#c4b5fd",
        action: "Command handler validates rules and starts a transaction.",
        teach: "The service coordinates the use case; domain rules decide whether the write is legal.",
      },
      {
        node: "Database",
        icon: "ti-database",
        tone: DETAIL_TONE,
        action: "DB writes the source-of-truth state and an outbox event in the same transaction.",
        teach: "The outbox pattern prevents the classic bug: DB commit succeeds but event publish fails.",
      },
      {
        node: "Message Queue",
        icon: "ti-message-2-share",
        tone: "#facc15",
        action: "Outbox publisher sends a durable event to Kafka, SQS, RabbitMQ, or a stream.",
        teach: "MQ decouples slow side effects from the user-facing transaction.",
      },
      {
        node: "Workers",
        icon: "ti-settings-automation",
        tone: "#fb923c",
        action: "Consumers send email, update search index, build read model, emit analytics, or call vendors.",
        teach: "Consumers must be idempotent because queues can deliver at least once.",
      },
      {
        node: "Cache",
        icon: "ti-bolt",
        tone: "#facc15",
        action: "Service deletes stale cache keys or workers refresh derived cache/read models.",
        teach: "For writes, invalidation is usually safer than trying to mutate every cached copy.",
      },
      {
        node: "Response",
        icon: "ti-arrow-back-up",
        tone: DETAIL_TONE,
        action: "User receives success once the critical write is committed; async work may continue.",
        teach: "Be explicit about what is synchronous versus eventually consistent.",
      },
      {
        node: "Observability",
        icon: "ti-chart-line",
        tone: "#fda4af",
        action: "Track DB commit latency, queue lag, consumer failures, DLQ count, cache invalidation misses, and p95 latency.",
        teach: "A production workflow is incomplete until you can detect stuck messages and stale reads.",
      },
    ],
  },
];

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

function EndToEndWorkflowSimulator({ accent }) {
  const [workflowId, setWorkflowId] = useState("write-db-mq-cache");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const workflow = END_TO_END_WORKFLOWS.find((item) => item.id === workflowId) || END_TO_END_WORKFLOWS[0];
  const activeStep = workflow.steps[Math.min(activeStepIndex, workflow.steps.length - 1)] || workflow.steps[0];
  const selectWorkflow = (nextWorkflowId) => {
    setWorkflowId(nextWorkflowId);
    setActiveStepIndex(0);
  };
  const previousStep = () => setActiveStepIndex((value) => Math.max(0, value - 1));
  const nextStep = () => setActiveStepIndex((value) => Math.min(workflow.steps.length - 1, value + 1));

  return (
    <section style={{ ...wrap, background: "rgba(15,23,42,.44)", border: `1px solid ${accent}36`, borderRadius: 8, display: "grid", gap: 12, padding: 12 }}>
      <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 950, textTransform: "uppercase" }}>End-to-End Workflow Simulator</div>
          <h3 style={{ ...wrap, color: "#f8fbff", fontSize: 16, lineHeight: 1.25, marginTop: 4 }}>User to DB, cache, MQ, workers, and back</h3>
          <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.5, lineHeight: 1.45, marginTop: 5 }}>
            Practice the full backend story as a moving request path: what is synchronous, what is cached, what is durable, and what happens asynchronously.
          </p>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          <button type="button" aria-label="Previous workflow step" onClick={previousStep} disabled={activeStepIndex === 0} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: activeStepIndex === 0 ? "#64748b" : "#dbeafe", cursor: activeStepIndex === 0 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 900, minHeight: 30, padding: "6px 8px" }}>
            <i className="ti ti-arrow-left" />
          </button>
          <span style={{ color: accent, fontSize: 10.5, fontWeight: 900, whiteSpace: "nowrap" }}>Step {activeStepIndex + 1}/{workflow.steps.length}</span>
          <button type="button" aria-label="Next workflow step" onClick={nextStep} disabled={activeStepIndex >= workflow.steps.length - 1} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: activeStepIndex >= workflow.steps.length - 1 ? "#64748b" : "#dbeafe", cursor: activeStepIndex >= workflow.steps.length - 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 900, minHeight: 30, padding: "6px 8px" }}>
            <i className="ti ti-arrow-right" />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {END_TO_END_WORKFLOWS.map((item) => {
          const active = item.id === workflow.id;
          return (
            <button
              key={item.id}
              type="button"
              className={active ? "glass-button" : ""}
              onClick={() => selectWorkflow(item.id)}
              style={{
                background: active ? `${accent}1f` : "rgba(255,255,255,.035)",
                border: `1px solid ${active ? accent : "rgba(255,255,255,.075)"}`,
                borderRadius: 7,
                color: active ? "#f8fbff" : "#9fb0c7",
                cursor: "pointer",
                fontSize: 10.8,
                fontWeight: 850,
                padding: "7px 9px",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ background: `${accent}0e`, border: `1px solid ${accent}2d`, borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
        <strong style={{ color: "#f8fbff", fontSize: 13.5, lineHeight: 1.3 }}>{workflow.title}</strong>
        <span style={{ color: "#cbd5e1", fontSize: 11.5, lineHeight: 1.45 }}>{workflow.summary}</span>
      </div>

      <div style={{ display: "grid", gap: 7, gridTemplateColumns: `repeat(${Math.min(workflow.steps.length, 9)}, minmax(94px, 1fr))`, minWidth: 0, overflowX: "auto", paddingBottom: 2 }}>
        {workflow.steps.map((step, index) => {
          const active = index === activeStepIndex;
          return (
            <button
              key={`${workflow.id}-${step.node}`}
              type="button"
              onClick={() => setActiveStepIndex(index)}
              style={{
                ...wrap,
                background: active ? `${step.tone}1d` : `${step.tone}0d`,
                border: `1px solid ${active ? step.tone : `${step.tone}33`}`,
                borderRadius: 8,
                color: "#dbeafe",
                cursor: "pointer",
                display: "grid",
                gap: 6,
                minHeight: 96,
                minWidth: 94,
                padding: 8,
                position: "relative",
                textAlign: "left",
              }}
            >
              <span style={{ alignItems: "center", background: `${step.tone}18`, border: `1px solid ${step.tone}44`, borderRadius: 8, color: step.tone, display: "inline-flex", height: 28, justifyContent: "center", width: 28 }}>
                <i className={`ti ${step.icon}`} title={step.node} style={{ fontSize: 15 }} />
              </span>
              <strong style={{ color: "#f8fbff", fontSize: 11.2, lineHeight: 1.25 }}>{step.node}</strong>
              <span style={{ color: "#9fb0c7", fontSize: 10.4, lineHeight: 1.3 }}>Step {index + 1}</span>
              {index < workflow.steps.length - 1 ? (
                <i className="ti ti-arrow-right" style={{ color: step.tone, fontSize: 15, position: "absolute", right: -12, top: 38, zIndex: 1 }} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))" }}>
        <section style={{ background: "rgba(0,0,0,.16)", border: `1px solid ${activeStep?.tone || accent}35`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
          <div style={{ alignItems: "center", color: activeStep?.tone || accent, display: "flex", fontSize: 10.5, fontWeight: 900, gap: 7, textTransform: "uppercase" }}>
            <i className={`ti ${activeStep?.icon || "ti-route"}`} />
            Active node
          </div>
          <strong style={{ color: "#f8fbff", fontSize: 13, lineHeight: 1.35 }}>{activeStep?.node}</strong>
          <span style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.45 }}>{activeStep?.action}</span>
        </section>

        <section style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Teacher narration</div>
          <span style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.45 }}>{activeStep?.teach}</span>
          <span style={{ color: "#facc15", fontSize: 11, lineHeight: 1.4 }}>
            Interview cue: say whether this step is synchronous, asynchronous, cached, durable, or observable.
          </span>
        </section>
      </div>

      <section style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>What to mention in interview</div>
        <div style={responsiveGrid(150, 7)}>
          {["Auth and rate limits", "Cache key and TTL", "DB source of truth", "Outbox or transaction boundary", "MQ retry and DLQ", "Worker idempotency", "Cache invalidation", "Metrics and tracing"].map((item) => (
            <span key={item} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, color: "#dbeafe", fontSize: 10.8, fontWeight: 850, lineHeight: 1.35, padding: "7px 8px" }}>
              {item}
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}

const PATTERN_VISUALS = {
  "Factory Method": {
    title: "Factory Method Real-Time Flow",
    scenario: "Notification channel selection",
    roles: [
      { label: "Client", detail: "Calls notify()", tone: "#93c5fd" },
      { label: "Creator", detail: "NotificationService", tone: "#8bd3ff" },
      { label: "Factory Method", detail: "createSender(channel)", tone: "#facc15" },
      { label: "Product Interface", detail: "NotificationSender", tone: DETAIL_TONE },
      { label: "Concrete Products", detail: "EmailSender / PushSender", tone: "#c4b5fd" },
    ],
    flow: ["Client requests send", "Creator asks factory method", "Concrete sender is created", "Client uses sender interface"],
    teacher: "The caller depends on the sender interface. The factory method owns the decision of which concrete sender to create.",
  },
  Builder: {
    title: "Builder Real-Time Flow",
    scenario: "Booking summary assembly",
    roles: [
      { label: "Client", detail: "BookingController", tone: "#93c5fd" },
      { label: "Builder", detail: "BookingSummaryBuilder", tone: "#facc15" },
      { label: "Steps", detail: "reservation -> payment -> tickets", tone: "#8bd3ff" },
      { label: "Validation", detail: "build()", tone: DETAIL_TONE },
      { label: "Product", detail: "BookingSummary", tone: "#c4b5fd" },
    ],
    flow: ["Collect required data", "Set optional pieces", "Validate in build", "Return immutable result"],
    teacher: "Use Builder when construction has many meaningful parts and you want valid, readable object creation.",
  },
  Adapter: {
    title: "Adapter Real-Time Flow",
    scenario: "Payment provider integration",
    roles: [
      { label: "Domain Service", detail: "PaymentService", tone: "#93c5fd" },
      { label: "Internal Port", detail: "PaymentGateway", tone: DETAIL_TONE },
      { label: "Adapter", detail: "StripePaymentAdapter", tone: "#facc15" },
      { label: "External API", detail: "StripeClient", tone: "#c4b5fd" },
      { label: "Mapped Result", detail: "PaymentResult", tone: "#8bd3ff" },
    ],
    flow: ["Domain sends clean request", "Adapter maps request", "Vendor API is called", "Adapter maps errors/result back"],
    teacher: "The adapter protects your domain from vendor naming, error formats, SDK objects, and transport details.",
  },
  Facade: {
    title: "Facade Real-Time Flow",
    scenario: "Booking workflow",
    roles: [
      { label: "Controller", detail: "One entrypoint", tone: "#93c5fd" },
      { label: "Facade", detail: "BookingFacade", tone: "#facc15" },
      { label: "Inventory", detail: "hold seats", tone: "#8bd3ff" },
      { label: "Payment", detail: "capture money", tone: DETAIL_TONE },
      { label: "Tickets", detail: "issue ticket", tone: "#c4b5fd" },
    ],
    flow: ["Controller calls facade", "Facade coordinates services", "Each subsystem does one job", "Facade returns workflow result"],
    teacher: "Facade gives the application one clean workflow API while keeping subsystem responsibilities separate.",
  },
  Strategy: {
    title: "Strategy Real-Time Flow",
    scenario: "Pricing policy selection",
    roles: [
      { label: "Context", detail: "PricingService", tone: "#93c5fd" },
      { label: "Selector", detail: "choose strategy", tone: "#facc15" },
      { label: "Strategy Interface", detail: "PricingStrategy", tone: DETAIL_TONE },
      { label: "Concrete Strategy", detail: "Surge / EarlyBird", tone: "#c4b5fd" },
      { label: "Result", detail: "Money quote", tone: "#8bd3ff" },
    ],
    flow: ["Context receives request", "Select policy", "Execute strategy", "Return quote without switch sprawl"],
    teacher: "Strategy turns changing algorithms or policies into replaceable objects with the same method shape.",
  },
  State: {
    title: "State Real-Time Flow",
    scenario: "Reservation lifecycle",
    roles: [
      { label: "Entity", detail: "Reservation", tone: "#93c5fd" },
      { label: "Current State", detail: "HELD", tone: "#facc15" },
      { label: "Transition Rule", detail: "confirm()", tone: DETAIL_TONE },
      { label: "Next State", detail: "CONFIRMED", tone: "#8bd3ff" },
      { label: "Rejected Path", detail: "invalid transition", tone: "#fda4af" },
    ],
    flow: ["Read current status", "Check allowed transition", "Persist next status", "Reject impossible lifecycle moves"],
    teacher: "State makes lifecycle rules explicit so invalid transitions are not hidden inside scattered if statements.",
  },
  Observer: {
    title: "Observer Real-Time Flow",
    scenario: "Booking confirmed event",
    roles: [
      { label: "Publisher", detail: "BookingService", tone: "#93c5fd" },
      { label: "Event", detail: "BookingConfirmed", tone: "#facc15" },
      { label: "Listener A", detail: "TicketIssuer", tone: DETAIL_TONE },
      { label: "Listener B", detail: "EmailNotifier", tone: "#8bd3ff" },
      { label: "Listener C", detail: "AuditLogger", tone: "#c4b5fd" },
    ],
    flow: ["Core command succeeds", "Event is published", "Listeners react independently", "Side effects stay decoupled"],
    teacher: "Observer lets multiple workflows react to the same fact without hard-wiring each reaction into the command.",
  },
};

function patternVisualFor(pattern) {
  return PATTERN_VISUALS[pattern.name] || {
    title: `${pattern.name} Real-Time Flow`,
    scenario: "Backend service collaboration",
    roles: [
      { label: "Client", detail: "Calls stable API", tone: "#93c5fd" },
      { label: "Pattern Role", detail: pattern.name, tone: "#facc15" },
      { label: "Interface", detail: "Stable contract", tone: DETAIL_TONE },
      { label: "Concrete Class", detail: "Implementation detail", tone: "#c4b5fd" },
    ],
    flow: ["Client calls interface", "Pattern object handles variation", "Concrete class does the work", "Client stays decoupled"],
    teacher: pattern.intent,
  };
}

function PatternVisualDiagram({ pattern, accent }) {
  const visual = patternVisualFor(pattern);
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [activeFlowIndex, setActiveFlowIndex] = useState(0);
  const activeRole = visual.roles[Math.min(activeRoleIndex, visual.roles.length - 1)] || visual.roles[0];
  const activeFlow = visual.flow[Math.min(activeFlowIndex, visual.flow.length - 1)] || visual.flow[0];
  const codeLines = String(pattern.javaExample || "").split("\n");
  const cueLine = Math.min(activeRoleIndex, Math.max(codeLines.length - 1, 0));
  const previousStep = () => setActiveFlowIndex((value) => Math.max(0, value - 1));
  const nextStep = () => setActiveFlowIndex((value) => Math.min(visual.flow.length - 1, value + 1));

  return (
    <section style={{ ...wrap, background: "rgba(139,211,255,.045)", border: `1px solid ${accent}30`, borderRadius: 8, display: "grid", gap: 9, padding: 10 }}>
      <div style={{ alignItems: "start", display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={wrap}>
          <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Interactive Real-Time Diagram</div>
          <strong style={{ ...wrap, color: "#f8fbff", display: "block", fontSize: 12.5, lineHeight: 1.35, marginTop: 4 }}>{visual.title}</strong>
          <span style={{ color: "#9fb0c7", display: "block", fontSize: 11, lineHeight: 1.4, marginTop: 3 }}>{visual.scenario}</span>
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          <button type="button" aria-label="Previous diagram step" onClick={previousStep} disabled={activeFlowIndex === 0} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: activeFlowIndex === 0 ? "#64748b" : "#dbeafe", cursor: activeFlowIndex === 0 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 900, minHeight: 30, padding: "6px 8px" }}>
            <i className="ti ti-arrow-left" />
          </button>
          <span style={{ color: accent, fontSize: 10.5, fontWeight: 900, whiteSpace: "nowrap" }}>Step {activeFlowIndex + 1}/{visual.flow.length}</span>
          <button type="button" aria-label="Next diagram step" onClick={nextStep} disabled={activeFlowIndex >= visual.flow.length - 1} style={{ background: "rgba(255,255,255,.045)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: activeFlowIndex >= visual.flow.length - 1 ? "#64748b" : "#dbeafe", cursor: activeFlowIndex >= visual.flow.length - 1 ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 900, minHeight: 30, padding: "6px 8px" }}>
            <i className="ti ti-arrow-right" />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 7, gridTemplateColumns: `repeat(${Math.min(visual.roles.length, 5)}, minmax(96px, 1fr))`, minWidth: 0, overflowX: "auto" }}>
        {visual.roles.map((role, index) => {
          const active = index === activeRoleIndex;
          return (
          <button key={`${pattern.id}-${role.label}`} type="button" onClick={() => setActiveRoleIndex(index)} style={{ ...wrap, background: active ? `${role.tone}1d` : `${role.tone}10`, border: `1px solid ${active ? role.tone : `${role.tone}3d`}`, borderRadius: 8, cursor: "pointer", display: "grid", gap: 5, minHeight: 88, minWidth: 96, padding: 8, position: "relative", textAlign: "left" }}>
            <span style={{ alignItems: "center", background: `${role.tone}18`, border: `1px solid ${role.tone}44`, borderRadius: 999, color: role.tone, display: "inline-grid", fontSize: 10, fontWeight: 900, height: 22, placeItems: "center", width: 22 }}>{index + 1}</span>
            <strong style={{ color: "#f8fbff", fontSize: 11.3, lineHeight: 1.25 }}>{role.label}</strong>
            <span style={{ color: "#cbd5e1", fontSize: 10.6, lineHeight: 1.35 }}>{role.detail}</span>
            {index < visual.roles.length - 1 ? (
              <i className="ti ti-arrow-right" style={{ color: role.tone, fontSize: 16, position: "absolute", right: -12, top: 34, zIndex: 1 }} />
            ) : null}
          </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {visual.flow.map((step, index) => (
          <button key={step} type="button" onClick={() => setActiveFlowIndex(index)} style={{ alignItems: "start", background: index === activeFlowIndex ? `${accent}12` : "transparent", border: `1px solid ${index === activeFlowIndex ? `${accent}36` : "transparent"}`, borderRadius: 7, cursor: "pointer", display: "grid", gap: 7, gridTemplateColumns: "20px 1fr", padding: "5px 6px", textAlign: "left" }}>
            <span style={{ background: `${accent}18`, border: `1px solid ${accent}44`, borderRadius: 999, color: accent, display: "inline-grid", fontSize: 10, fontWeight: 900, height: 20, placeItems: "center", width: 20 }}>{index + 1}</span>
            <span style={{ color: "#dbeafe", fontSize: 11, lineHeight: 1.4 }}>{step}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(190px, 100%), 1fr))" }}>
        <div style={{ background: "rgba(0,0,0,.14)", border: `1px solid ${activeRole?.tone || accent}30`, borderRadius: 7, color: "#dbeafe", display: "grid", gap: 5, fontSize: 11.2, lineHeight: 1.45, padding: 8 }}>
          <strong style={{ color: activeRole?.tone || accent, fontSize: 10.5, textTransform: "uppercase" }}>Active role</strong>
          <span>{activeRole?.label}: {activeRole?.detail}</span>
          <span style={{ color: "#93a4bf" }}>Current flow: {activeFlow}</span>
        </div>
        <div style={{ background: "rgba(0,0,0,.14)", border: "1px solid rgba(255,255,255,.075)", borderRadius: 7, color: "#dbeafe", fontSize: 11.2, lineHeight: 1.45, padding: 8 }}>
          <strong style={{ color: accent, display: "block", fontSize: 10.5, marginBottom: 4, textTransform: "uppercase" }}>Teacher note</strong>
          {visual.teacher}
        </div>
      </div>

      <pre style={{ ...codeStyle, marginTop: 0 }}>
        <code>
          {codeLines.map((line, index) => {
            const active = index === cueLine;
            return (
              <span key={`${line}-${index}`} style={{ background: active ? `${accent}1f` : "transparent", borderLeft: active ? `3px solid ${accent}` : "3px solid transparent", display: "block", padding: "0 7px" }}>
                <span style={{ color: active ? accent : "#64748b", display: "inline-block", marginRight: 8, minWidth: 18, textAlign: "right" }}>{index + 1}</span>
                {line || " "}
              </span>
            );
          })}
        </code>
      </pre>
      <div style={{ color: "#93a4bf", fontSize: 10.8, lineHeight: 1.4 }}>
        Code sync: selecting a role highlights the nearest Java line so the diagram and implementation stay connected.
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
        <PatternVisualDiagram pattern={pattern} accent={accent} />
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
      {track.label === "HLD" ? <EndToEndWorkflowSimulator accent={accent} /> : null}
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
          <div style={{ color: DETAIL_TONE, fontSize: 11, fontWeight: 900, marginBottom: 6 }}>{problem.difficulty}</div>
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
                <BulletList items={playbook.outcomes} color={DETAIL_TONE} />
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
                <div style={{ color: DETAIL_TONE, marginTop: 2 }}>{track.interviewTransfer}</div>
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
                      <span style={{ color: DETAIL_TONE, fontSize: 10.8, lineHeight: 1.4 }}>{item.whereUsed}</span>
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
                  <BulletList items={group.outcomes} color={DETAIL_TONE} />
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
      className="glass-card design-lab"
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
      <AnswerAtAGlance category="HLD LLD Design" takeaway="Start with the user request, split responsibilities into boundaries, then prove the design under scale and failure." complexity="Compare latency, throughput, consistency, operability, and cost before choosing a pattern." edgeCases="Retries, duplicate commands, partial failure, stale data, hot keys, and versioned contracts." />

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
              <div style={{ color: DETAIL_TONE, fontSize: 11, fontWeight: 800, marginBottom: 5 }}>{system.difficulty}</div>
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
