const ROLE_PACKS = [
  {
    id: "java-backend-sde-ii",
    title: "Java Backend SDE II",
    aliases: ["java", "spring", "spring boot", "backend", "sde ii", "software development engineer ii"],
    focusTopics: [
      "Spring Boot REST APIs",
      "JPA/Hibernate query behavior",
      "Kafka event flows",
      "SQL indexing and transactions",
      "Service resilience and observability",
      "Object-oriented design in Java",
    ],
    rounds: [
      {
        name: "Backend coding",
        signals: ["Clean Java implementation", "Correct edge cases", "Readable tests"],
      },
      {
        name: "API and system design",
        signals: ["Production constraints", "Data model clarity", "Failure-mode thinking"],
      },
      {
        name: "Spring Boot deep dive",
        signals: ["Security and validation", "Persistence trade-offs", "Operational debugging"],
      },
      {
        name: "Behavioral ownership",
        signals: ["Incident learning", "Cross-team communication", "Measured impact"],
      },
    ],
    priorityDrills: [
      "Debug an N+1 query and explain the fix.",
      "Design idempotent retries for a Kafka consumer.",
      "Model a REST API with validation, auth, pagination, and errors.",
      "Compare optimistic and pessimistic locking for a write-heavy flow.",
      "Tell an incident story with detection, mitigation, and prevention.",
    ],
    scoringEmphasis: [
      "Production readiness over framework trivia.",
      "Clear trade-offs around data consistency and latency.",
      "Tests that protect the riskiest behavior.",
      "Operational maturity in logging, metrics, rollback, and security.",
    ],
    actionPrompts: [
      "Prepare one incident story with a metric, decision, and follow-up prevention.",
      "Write a 90-second Spring Boot API architecture walkthrough.",
      "Practice explaining one database performance bug from symptom to verified fix.",
    ],
  },
  {
    id: "react-frontend-senior",
    title: "React Frontend Senior",
    aliases: ["react", "frontend", "front end", "next", "next.js", "typescript", "senior frontend"],
    focusTopics: [
      "React rendering performance",
      "Component boundaries and state ownership",
      "Accessible UI patterns",
      "TypeScript API contracts",
      "Next.js routing and data fetching",
      "Frontend testing strategy",
    ],
    rounds: [
      {
        name: "Frontend coding",
        signals: ["Composable components", "State clarity", "Accessible markup"],
      },
      {
        name: "React architecture",
        signals: ["Render-boundary reasoning", "Data-flow trade-offs", "Maintainable abstractions"],
      },
      {
        name: "Product debugging",
        signals: ["Profiler evidence", "User impact framing", "Small verified fixes"],
      },
      {
        name: "Senior collaboration",
        signals: ["Design-system judgment", "Mentoring examples", "Quality ownership"],
      },
    ],
    priorityDrills: [
      "Profile a slow form and decide where state should live.",
      "Design a reusable table with sorting, empty states, and keyboard access.",
      "Explain when memoization helps and when it hides a design problem.",
      "Write a testing plan for a critical checkout or onboarding flow.",
      "Review a component API for long-term maintainability.",
    ],
    scoringEmphasis: [
      "User-perceived performance and accessibility.",
      "Simple component APIs that survive product change.",
      "Evidence-led debugging with React DevTools or browser tooling.",
      "Senior-level communication around trade-offs and ownership.",
    ],
    actionPrompts: [
      "Prepare a before-and-after performance story with a measured result.",
      "Sketch a component boundary map for one complex UI you built.",
      "Practice explaining an accessibility fix without jargon.",
    ],
  },
  {
    id: "full-stack-lead",
    title: "Full Stack Lead",
    aliases: ["full stack", "fullstack", "lead", "tech lead", "architecture", "node", "react"],
    focusTopics: [
      "End-to-end architecture",
      "API contract design",
      "Frontend/backend data ownership",
      "Release strategy and risk management",
      "Observability across the stack",
      "Technical leadership and mentoring",
    ],
    rounds: [
      {
        name: "Architecture design",
        signals: ["Clear boundaries", "Incremental delivery", "Risk sequencing"],
      },
      {
        name: "Full-stack implementation",
        signals: ["API/UI contract fit", "Data validation", "Test pyramid judgment"],
      },
      {
        name: "Leadership deep dive",
        signals: ["Stakeholder alignment", "Mentoring", "Decision records"],
      },
      {
        name: "Operational readiness",
        signals: ["Monitoring", "Rollback", "Security and privacy defaults"],
      },
    ],
    priorityDrills: [
      "Design a feature from UI state through API, database, and rollout.",
      "Create a migration plan that protects users and unblocks teams.",
      "Explain a technical decision you changed after new evidence.",
      "Review an API contract for versioning, errors, and client ergonomics.",
      "Build a 30-60-90 day plan for stabilizing a product area.",
    ],
    scoringEmphasis: [
      "Systems thinking across product, code, data, and operations.",
      "Leadership through clarity rather than authority.",
      "Pragmatic sequencing under imperfect constraints.",
      "Ability to coach others while still delivering technical depth.",
    ],
    actionPrompts: [
      "Prepare one architecture story with alternatives you rejected.",
      "Write a concise rollout plan with metrics and rollback triggers.",
      "Practice translating a technical risk into product and business impact.",
    ],
  },
  {
    id: "python-backend",
    title: "Python Backend",
    aliases: ["python", "django", "fastapi", "flask", "celery", "backend"],
    focusTopics: [
      "FastAPI and Django service design",
      "Python concurrency and async I/O",
      "ORM modeling and query performance",
      "Task queues and background jobs",
      "Testing with realistic boundaries",
      "API security and data validation",
    ],
    rounds: [
      {
        name: "Python coding",
        signals: ["Readable idioms", "Edge-case handling", "Complexity awareness"],
      },
      {
        name: "Backend design",
        signals: ["API boundaries", "Persistence choices", "Failure handling"],
      },
      {
        name: "Framework deep dive",
        signals: ["FastAPI/Django trade-offs", "Validation", "Deployment awareness"],
      },
      {
        name: "Debugging and operations",
        signals: ["Logs and traces", "Queue behavior", "Database diagnosis"],
      },
    ],
    priorityDrills: [
      "Design a FastAPI endpoint with validation, auth, and error responses.",
      "Debug a slow ORM query with query-plan evidence.",
      "Explain async I/O versus threads for a high-latency integration.",
      "Plan retries and idempotency for a Celery job.",
      "Write tests that cover API, service, and persistence boundaries.",
    ],
    scoringEmphasis: [
      "Correct, idiomatic Python under interview pressure.",
      "Practical framework trade-offs without hand-waving.",
      "Database and queue reliability thinking.",
      "Security-minded validation and error handling.",
    ],
    actionPrompts: [
      "Prepare a Python debugging story with logs, root cause, and verification.",
      "Practice a concise FastAPI/Django architecture walkthrough.",
      "Review two Python edge cases around mutability, exceptions, or async.",
    ],
  },
  {
    id: "sap-consultant",
    title: "SAP Consultant",
    aliases: ["sap", "abap", "s/4hana", "hana", "odata", "fiori", "consultant"],
    focusTopics: [
      "S/4HANA business process mapping",
      "ABAP enhancements and debugging",
      "OData services and Fiori integration",
      "Data migration and cutover planning",
      "Authorization and transport management",
      "Stakeholder discovery and fit-gap analysis",
    ],
    rounds: [
      {
        name: "Functional discovery",
        signals: ["Process mapping", "Fit-gap clarity", "Stakeholder language"],
      },
      {
        name: "Technical configuration",
        signals: ["ABAP/OData fluency", "Transport discipline", "Debugging approach"],
      },
      {
        name: "Implementation scenario",
        signals: ["Migration planning", "Testing phases", "Cutover risk control"],
      },
      {
        name: "Client leadership",
        signals: ["Expectation management", "Clear trade-offs", "Escalation judgment"],
      },
    ],
    priorityDrills: [
      "Walk through a fit-gap analysis for a standard versus custom SAP process.",
      "Explain how you would debug an ABAP enhancement impacting a Fiori app.",
      "Design a data migration validation checklist for a go-live.",
      "Prepare a cutover plan with rollback and stakeholder checkpoints.",
      "Describe an authorization issue from symptom to resolution.",
    ],
    scoringEmphasis: [
      "Business-process understanding tied to SAP implementation detail.",
      "Structured discovery before proposing customization.",
      "Risk control across transports, testing, migration, and cutover.",
      "Client-ready communication with crisp assumptions and next steps.",
    ],
    actionPrompts: [
      "Prepare one fit-gap story with the final recommendation and outcome.",
      "Practice explaining an SAP technical issue to a non-technical stakeholder.",
      "Write a final-day checklist for transport, data, testing, and sign-off.",
    ],
  },
  {
    id: "rust-systems",
    title: "Rust Systems",
    aliases: ["rust", "systems", "tokio", "embedded", "wasm", "low latency"],
    focusTopics: [
      "Ownership and borrowing",
      "Lifetimes and API design",
      "Concurrency with Send/Sync",
      "Tokio async systems",
      "Memory safety and performance",
      "Error handling and observability",
    ],
    rounds: [
      {
        name: "Rust coding",
        signals: ["Ownership clarity", "Type-driven design", "Error handling"],
      },
      {
        name: "Systems design",
        signals: ["Latency trade-offs", "Resource control", "Failure isolation"],
      },
      {
        name: "Concurrency deep dive",
        signals: ["Send/Sync reasoning", "Async boundaries", "Backpressure"],
      },
      {
        name: "Performance debugging",
        signals: ["Measurement first", "Allocation awareness", "Safe optimization"],
      },
    ],
    priorityDrills: [
      "Explain an ownership error and three ways to redesign the API.",
      "Design a Tokio worker with backpressure, cancellation, and metrics.",
      "Compare channels, locks, and atomics for a shared-state problem.",
      "Debug a memory or latency spike without abandoning safety.",
      "Model error handling with thiserror/anyhow style boundaries.",
    ],
    scoringEmphasis: [
      "Precise ownership reasoning instead of memorized compiler phrases.",
      "Systems-level trade-offs around latency, memory, and safety.",
      "Concurrency correctness with clear failure semantics.",
      "Performance claims backed by measurement.",
    ],
    actionPrompts: [
      "Prepare a story where Rust's type system prevented or exposed a bug.",
      "Practice explaining ownership using a concrete API redesign.",
      "Review one async backpressure design and its operational metrics.",
    ],
  },
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function scorePack(pack, text) {
  return pack.aliases.reduce((score, alias) => {
    return text.includes(alias) ? score + alias.length : score;
  }, 0);
}

function findPack(roleText) {
  const text = normalize(roleText);
  const exact = ROLE_PACKS.find((pack) => normalize(pack.title) === text || pack.id === text);
  if (exact) return exact;

  return ROLE_PACKS.reduce(
    (best, pack) => {
      const score = scorePack(pack, text);
      if (score > best.score) return { pack, score };
      return best;
    },
    { pack: ROLE_PACKS[2], score: 0 },
  ).pack;
}

export function listRolePacks() {
  return clone(ROLE_PACKS).map(({ aliases, ...pack }) => pack);
}

export function getRolePack({ role = "", profile = {} } = {}) {
  const roleText = [
    role,
    profile.position,
    profile.stack,
    profile.experience,
  ].filter(Boolean).join(" ");

  const pack = findPack(roleText);
  const cloned = clone(pack);
  delete cloned.aliases;
  return cloned;
}

export function buildRolePack(options = {}) {
  return getRolePack(options);
}
