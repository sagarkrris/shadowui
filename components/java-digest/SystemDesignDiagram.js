import { useId } from "react";

function DiagramNode({ x, y, label, detail, accent }) {
  return <g><rect x={x} y={y} width="138" height="58" rx="9" fill="rgba(255,255,255,.045)" stroke={accent} strokeOpacity=".52" /><text x={x + 69} y={y + 24} fill="var(--jd-text)" fontSize="14" fontWeight="800" textAnchor="middle">{label}</text><text x={x + 69} y={y + 42} fill="var(--jd-text-muted)" fontSize="12" textAnchor="middle">{detail}</text></g>;
}

function Arrow({ x1, y1, x2, y2, accent, label, markerId }) {
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeOpacity=".75" strokeWidth="2" markerEnd={`url(#${markerId})`} />{label ? <text x={(x1 + x2) / 2} y={y1 - 8} fill="var(--jd-text-muted)" fontSize="9" textAnchor="middle">{label}</text> : null}</g>;
}

const DIAGRAMS = {
  javaTimeline: { label: "Java evolution timeline", nodes: [[22, "Java 8", "lambdas + streams"], [210, "Java 11", "modules + HttpClient"], [398, "Java 17", "records + sealed"], [570, "Java 21+", "virtual threads + JVM"]] },
  java8: { label: "Java 8 foundation", nodes: [[22, "Lambda", "behavior as data"], [210, "Stream", "pipeline"], [398, "Optional", "absence explicit"], [570, "Default method", "evolve APIs"]] },
  java911: { label: "Java 9–11 platform", nodes: [[22, "Modules", "explicit boundaries"], [210, "var", "local inference"], [398, "HttpClient", "modern HTTP"], [570, "LTS", "stable baseline"]] },
  java1214: { label: "Java 12–14 language clarity", nodes: [[22, "Switch expr", "value + exhaustiveness"], [210, "Text blocks", "readable literals"], [398, "Helpful NPE", "faster diagnosis"], [570, "Preview", "incubate safely"]] },
  java1517: { label: "Java 15–17 data modeling", nodes: [[22, "Records", "data shape"], [210, "Sealed", "closed hierarchy"], [398, "Pattern match", "less ceremony"], [570, "LTS", "strong baseline"]] },
  java1820: { label: "Java 18–20 concurrency runway", nodes: [[22, "UTF-8", "predictable text"], [210, "Virtual threads", "cheap blocking"], [398, "Structured", "scoped tasks"], [570, "Preview APIs", "iterate"]] },
  java21: { label: "Java 21 LTS", nodes: [[22, "Virtual threads", "scale waiting"], [210, "Pattern switch", "expressive flow"], [398, "Sequenced", "ordered APIs"], [570, "LTS", "production adoption"]] },
  java2224: { label: "Java 22–24 platform acceleration", nodes: [[22, "Unnamed", "remove noise"], [210, "Gatherers", "stream shape"], [398, "FFM", "safe native calls"], [570, "Class-file API", "tooling"]] },
  java2526: { label: "Java 25–26 runtime evolution", nodes: [[22, "Scoped values", "bounded context"], [210, "AOT cache", "faster start"], [398, "HTTP/3", "modern transport"], [570, "JVM", "less overhead"]] },
  pattern: { label: "Pattern collaboration", nodes: [[22, "Context", "client"], [210, "Abstraction", "stable contract"], [398, "Pattern", "vary behavior"], [570, "Test", "prove seam"]] },
  lld: { label: "Low-level design loop", nodes: [[22, "Use case", "requirements"], [210, "Objects", "responsibilities"], [398, "Policy", "invariant"], [570, "Tests", "evolution"]] },
  dsa: { label: "Algorithm reasoning", nodes: [[22, "Input", "shape"], [210, "Invariant", "state"], [398, "Transition", "move"], [570, "Proof", "complexity"]] },
  java: { label: "Production Java boundary", nodes: [[22, "Request", "validated"], [210, "Domain", "invariant"], [398, "Resource", "bounded"], [570, "Telemetry", "evidence"]] },
  sql: { label: "SQL optimization loop", nodes: [[22, "Query", "real params"], [210, "Plan", "explain"], [398, "Index", "selectivity"], [570, "Benchmark", "prove gain"]] },
  distributed: { label: "Distributed delivery", nodes: [[22, "Producer", "local state"], [210, "Network", "delay / dupes"], [398, "Consumer", "idempotent"], [570, "Converge", "recovery"]] },
  communication: { label: "Interview answer structure", nodes: [[22, "Clarify", "assumptions"], [210, "Model", "mechanism"], [398, "Prove", "example"], [570, "Close", "trade-off"]] },
  behavioral: { label: "Evidence-backed story", nodes: [[22, "Situation", "context"], [210, "Task", "ownership"], [398, "Action", "judgement"], [570, "Result", "learning"]] },
  api: { label: "API boundary", nodes: [[22, "Client", "request"], [291, "Gateway", "auth + limits"], [560, "Service", "domain work"]] },
  cache: { label: "Cache-aside read path", nodes: [[22, "Client", "read"], [210, "Cache", "fast / stale"], [398, "Database", "source of truth"], [570, "Refresh", "on miss"]] },
  database: { label: "Storage access path", nodes: [[22, "Query", "access pattern"], [210, "Index", "selective lookup"], [398, "Primary", "durable write"], [570, "Replica", "read scale"]] },
  event: { label: "Durable async path", nodes: [[22, "Request", "commit"], [210, "Outbox", "same tx"], [398, "Queue", "replayable"], [570, "Consumer", "idempotent"]] },
  network: { label: "Request journey", nodes: [[22, "Client", "browser / app"], [210, "DNS", "name → IP"], [398, "Proxy", "route + TLS"], [570, "Service", "HTTP handler"]] },
  scale: { label: "Scale-out path", nodes: [[22, "Traffic", "peak load"], [210, "Load balancer", "health checks"], [398, "Instances", "stateless"], [570, "State", "partitioned"]] },
  reliability: { label: "Failure-aware request", nodes: [[22, "Caller", "deadline"], [210, "Service", "bounded work"], [398, "Dependency", "timeout"], [570, "Fallback", "degraded mode"]] },
  cap: { label: "CAP decision", nodes: [[22, "Partition", "network split"], [210, "Consistency", "fresh data"], [398, "Availability", "respond now"], [570, "Contract", "choose per op"]] },
  observe: { label: "Operational feedback loop", nodes: [[22, "Request", "trace"], [210, "Metrics", "latency + errors"], [398, "Alert", "threshold"], [570, "Action", "mitigate"]] },
  default: { label: "System design reasoning loop", nodes: [[22, "Requirements", "user + target"], [210, "Components", "boundaries"], [398, "Trade-offs", "cost + risk"], [570, "Operate", "measure + recover"]] },
};

export default function SystemDesignDiagram({ kind = "default", concept, accent }) {
  const diagram = DIAGRAMS[kind] || DIAGRAMS.default;
  const markerId = `system-design-arrow-${useId()}`;
  return <figure className="system-design-diagram" style={{ background: "var(--jd-surface-sunken)", border: "1px solid var(--jd-border)", borderRadius: 8, minWidth: 0, margin: "9px 0 0", padding: "9px 8px 6px" }}><figcaption style={{ color: accent, fontSize: 10.5, fontWeight: 900, marginBottom: 4, textTransform: "uppercase" }}>{diagram.label}</figcaption><div role="region" aria-label={`${diagram.label} scrollable diagram`} tabIndex={0} style={{ maxWidth: "100%", overflowX: "auto" }}><svg style={{ minWidth: 720, display: "block" }} role="img" aria-label={`${diagram.label}: ${concept}`} viewBox="0 0 720 82" width="100%" preserveAspectRatio="xMidYMid meet"><defs><marker id={markerId} markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3" viewBox="0 0 7 6"><path d="M0,0 L7,3 L0,6 Z" fill={accent} /></marker></defs>{diagram.nodes.map(([x, label, detail]) => <DiagramNode key={label} x={x} y={12} label={label} detail={detail} accent={accent} />)}{diagram.nodes.slice(0, -1).map(([x], index) => <Arrow key={x} x1={x + 143} y1={41} x2={diagram.nodes[index + 1][0] - 7} y2={41} accent={accent} markerId={markerId} />)}</svg></div></figure>;
}
