import { getDisplayName } from "./personalization.mjs";
import { getTechTheme } from "./techTheme.mjs";

const DEFAULT_DIFFICULTY = "Mid";
const DEFAULT_VISIBLE_CARDS = 5;
const TARGET_BANK_SIZE = 50;

const EXPERIENCE_GUIDES = {
  Entry: {
    level: "Entry",
    lens: "fundamentals, definitions, simple examples, and clear trade-offs",
    signal: "show that the candidate understands the basics and can explain them simply",
  },
  Mid: {
    level: "Mid",
    lens: "hands-on implementation, debugging, testing, and practical trade-offs",
    signal: "show that the candidate can build and maintain this in real project work",
  },
  Senior: {
    level: "Senior",
    lens: "production design, failure modes, scalability, security, and team-level decisions",
    signal: "show that the candidate can make durable engineering choices under constraints",
  },
  Lead: {
    level: "Lead",
    lens: "architecture, cross-team impact, migration strategy, risk management, and mentoring",
    signal: "show that the candidate can lead the decision and explain the organizational trade-offs",
  },
};

const QUESTION_TEMPLATES = [
  {
    id: "explain",
    question: ({ topic, guide }) => `Explain ${topic} at a ${guide.level.toLowerCase()} interview level. What details matter most?`,
    points: ({ topic, guide }) => [
      `Define ${topic} clearly before adding implementation detail.`,
      `Focus on ${guide.lens}.`,
      "Use one concrete example from a real application.",
      `Close with the interview signal: ${guide.signal}.`,
    ],
    followUps: ({ topic }) => [
      `What is a common mistake candidates make with ${topic}?`,
      `How would you prove your explanation of ${topic} is correct?`,
    ],
  },
  {
    id: "debug",
    question: ({ topic }) => `A production issue appears around ${topic}. How would you debug it step by step?`,
    points: ({ topic, guide }) => [
      "Start by reproducing or narrowing the symptom with logs, metrics, traces, or tests.",
      `Identify the most likely ${topic} failure points before changing code.`,
      `Use ${guide.lens} to decide what evidence is enough.`,
      "Verify the fix with a focused test or measurable before-and-after signal.",
    ],
    followUps: ({ topic }) => [
      `What would you log for ${topic} without exposing sensitive data?`,
      `How would you prevent this ${topic} issue from returning?`,
    ],
  },
  {
    id: "tradeoffs",
    question: ({ topic }) => `What trade-offs would you discuss when choosing an approach for ${topic}?`,
    points: ({ topic, guide }) => [
      "Name at least two viable approaches before choosing one.",
      `Compare the options using ${guide.lens}.`,
      `Tie the decision to constraints such as scale, team skill, timeline, and risk.`,
      `Explain what would make you revisit the ${topic} decision later.`,
    ],
    followUps: ({ topic }) => [
      `What is the simplest acceptable solution for ${topic}?`,
      `When would your preferred ${topic} approach be wrong?`,
    ],
  },
  {
    id: "design",
    question: ({ topic }) => `Design a small feature or service that depends on ${topic}. What are the core pieces?`,
    points: ({ topic, guide }) => [
      "Clarify requirements, users, data flow, and failure expectations first.",
      `Break the ${topic} solution into clear responsibilities and interfaces.`,
      `Apply ${guide.lens} without over-engineering the first version.`,
      "Include testing, observability, rollout, and rollback in the design.",
    ],
    followUps: ({ topic }) => [
      `What part of this ${topic} design would fail first at scale?`,
      `How would you simplify this ${topic} design for a small team?`,
    ],
  },
  {
    id: "testing",
    question: ({ topic }) => `How would you test ${topic} so the tests catch real regressions?`,
    points: ({ topic, guide }) => [
      "Separate unit, integration, contract, and end-to-end concerns.",
      `Test the riskiest ${topic} behavior with realistic inputs and edge cases.`,
      `Choose test depth based on ${guide.lens}.`,
      "Keep tests deterministic and useful during refactors.",
    ],
    followUps: ({ topic }) => [
      `What should be mocked when testing ${topic}?`,
      `Which ${topic} test would you add first and why?`,
    ],
  },
  {
    id: "security",
    question: ({ topic }) => `What security or privacy risks should you consider with ${topic}?`,
    points: ({ topic, guide }) => [
      "Identify data exposure, access control, injection, and abuse paths.",
      `Apply least privilege and validation around ${topic}.`,
      `Use ${guide.lens} to decide what safeguards are required now.`,
      "Avoid logging secrets, tokens, private content, or unnecessary personal data.",
    ],
    followUps: ({ topic }) => [
      `How would you threat-model ${topic}?`,
      `What would you monitor after shipping this ${topic} change?`,
    ],
  },
  {
    id: "performance",
    question: ({ topic }) => `How would you improve performance for a slow flow involving ${topic}?`,
    points: ({ topic, guide }) => [
      "Measure the bottleneck before optimizing.",
      `Check whether ${topic} affects latency, throughput, memory, rendering, or database load.`,
      `Use ${guide.lens} to choose the smallest effective optimization.`,
      "Confirm the improvement with realistic data and guard against regressions.",
    ],
    followUps: ({ topic }) => [
      `What metric would prove ${topic} got faster?`,
      `What optimization for ${topic} might make maintainability worse?`,
    ],
  },
  {
    id: "failure",
    question: ({ topic }) => `What can go wrong with ${topic}, and how would you make the system resilient?`,
    points: ({ topic, guide }) => [
      "List likely failure modes and the user impact of each one.",
      `Use timeouts, retries, fallbacks, validation, or isolation around ${topic} where appropriate.`,
      `Match the resilience strategy to ${guide.lens}.`,
      "Add observability so the team can detect and diagnose failures quickly.",
    ],
    followUps: ({ topic }) => [
      `Which ${topic} failure should page someone?`,
      `How would you test this ${topic} failure path?`,
    ],
  },
  {
    id: "migration",
    question: ({ topic }) => `How would you migrate an existing codebase or system toward a better ${topic} approach?`,
    points: ({ topic, guide }) => [
      "Start with the reason for migration and the risk of doing nothing.",
      `Plan incremental changes around ${topic} with compatibility and rollback in mind.`,
      `Use ${guide.lens} to choose sequencing and ownership.`,
      "Measure adoption, correctness, and operational health after each step.",
    ],
    followUps: ({ topic }) => [
      `What would make you pause the ${topic} migration?`,
      `How would you communicate this ${topic} migration to other engineers?`,
    ],
  },
  {
    id: "behavior",
    question: ({ topic }) => `Tell me about a time you used ${topic} in a project. What did you do and what was the result?`,
    points: ({ topic, guide }) => [
      "Use a concise STAR structure: situation, task, action, result.",
      `Explain your personal contribution around ${topic}.`,
      `Connect the story to ${guide.lens}.`,
      "Share a measurable outcome or a clear lesson learned.",
    ],
    followUps: ({ topic }) => [
      `What would you do differently with ${topic} now?`,
      `How did you help others understand the ${topic} decision?`,
    ],
  },
];

const PRACTICE_PACKS = [
  {
    id: "spring-boot",
    title: "Spring Boot Practice Pack",
    icon: "ti-leaf",
    accent: "Java + Spring",
    stackKeys: ["java"],
    aliases: ["spring boot", "spring security", "jpa", "hibernate", "rest controllers", "validation", "testing apis", "backend", "java core"],
    cards: [
      {
        id: "spring-security-jwt",
        question: "How would you secure a Spring Boot REST API with JWT without making every controller handle authentication logic?",
        tags: ["Spring Security", "JWT", "Authentication"],
        answerPoints: [
          "Use Spring Security filters and a SecurityFilterChain so authentication happens before controller logic.",
          "Validate token signature, expiry, issuer, and claims before building the authenticated principal.",
          "Keep authorization policy explicit with route matchers, method security, or scoped authorities.",
          "Return consistent 401 and 403 responses without leaking token or user details.",
        ],
        followUps: [
          "Where would token refresh fit in this design?",
          "How would you test a protected controller endpoint?",
        ],
      },
      {
        id: "spring-jpa-n-plus-one",
        question: "A Spring Boot endpoint is slow because of an N+1 query. How do you diagnose and fix it?",
        tags: ["JPA & Hibernate", "Performance", "SQL"],
        answerPoints: [
          "Enable SQL logging or inspect traces to confirm repeated child-table queries.",
          "Use fetch joins, entity graphs, projections, or query-specific DTOs instead of eager loading everything.",
          "Check pagination and collection fetch joins carefully because they can inflate result sets.",
          "Verify the change with query counts, latency, and realistic data volume.",
        ],
        followUps: [
          "When would you prefer a DTO projection over an entity graph?",
          "How can caching hide this issue during testing?",
        ],
      },
      {
        id: "spring-validation-errors",
        question: "How should a Spring Boot API handle request validation and return useful errors to clients?",
        tags: ["Validation", "REST Controllers", "API Design"],
        answerPoints: [
          "Use Bean Validation annotations on request DTOs and trigger them with @Valid.",
          "Centralize error shaping with @ControllerAdvice instead of repeating try/catch blocks.",
          "Return stable field-level messages and machine-readable error codes when the client needs them.",
          "Avoid exposing internal exception names, stack traces, or sensitive payload values.",
        ],
        followUps: [
          "How would validation differ between create and update requests?",
          "What HTTP status code would you choose for validation failures?",
        ],
      },
      {
        id: "spring-test-slice",
        question: "When would you use a Spring MVC slice test instead of a full @SpringBootTest?",
        tags: ["Testing APIs", "JUnit", "SpringBootTest"],
        answerPoints: [
          "Use slice tests when the goal is controller routing, validation, serialization, and security behavior.",
          "Mock or provide only the collaborators needed by the web layer.",
          "Use full context tests for wiring, transactions, configuration, or integration behavior.",
          "Keep both test types purposeful so the suite stays fast and trusted.",
        ],
        followUps: [
          "What belongs in a service unit test instead?",
          "How would you test database behavior for this endpoint?",
        ],
      },
    ],
  },
  {
    id: "react",
    title: "React Practice Pack",
    icon: "ti-brand-react",
    accent: "React + Next.js",
    stackKeys: ["react", "javascript"],
    aliases: ["react", "next.js", "next", "hooks", "component design", "state management", "forms", "rendering", "performance", "frontend", "typescript"],
    cards: [
      {
        id: "react-render-performance",
        question: "A React page re-renders too often while typing into a form. How would you find and fix the performance issue?",
        tags: ["Performance", "Rendering", "Hooks"],
        answerPoints: [
          "Use React DevTools Profiler to identify which components re-render and why.",
          "Move local form state closer to the fields that own it, or split expensive children away from hot state.",
          "Use memoization only after measuring, with stable props and callbacks where it actually helps.",
          "Check derived data, context providers, and list rendering before blaming React itself.",
        ],
        followUps: [
          "When can React.memo make performance worse?",
          "How would this change in a server-rendered Next.js page?",
        ],
      },
      {
        id: "react-state-boundaries",
        question: "How do you decide whether state should live in a component, context, URL params, or a server cache?",
        tags: ["State Management", "Component Design", "Architecture"],
        answerPoints: [
          "Keep ephemeral UI state local when no other feature needs it.",
          "Use URL state for shareable filters, selected tabs, and navigation-relevant values.",
          "Use context for stable cross-tree dependencies, not high-frequency updates by default.",
          "Use a server cache for remote data with loading, invalidation, and refetch behavior.",
        ],
        followUps: [
          "What state would you avoid putting in Redux or global context?",
          "How would you persist state across refreshes?",
        ],
      },
      {
        id: "next-data-fetching",
        question: "How would you choose between server-side data fetching and client-side fetching in a Next.js app?",
        tags: ["Next.js", "Data Fetching", "Performance"],
        answerPoints: [
          "Prefer server fetching for SEO, faster first paint, and protected server-only credentials.",
          "Use client fetching for highly interactive or user-triggered data that changes after load.",
          "Consider caching, revalidation, auth boundaries, and loading states before choosing.",
          "Avoid sending secrets or unnecessary backend payloads to the browser.",
        ],
        followUps: [
          "What can cause hydration mismatches?",
          "How would you handle stale data after a mutation?",
        ],
      },
      {
        id: "frontend-accessibility",
        question: "What accessibility checks would you make before shipping a custom dropdown component?",
        tags: ["Accessibility", "Browser APIs", "Testing UI"],
        answerPoints: [
          "Confirm keyboard navigation, focus management, escape behavior, and tab order.",
          "Use correct ARIA roles and labels only when native controls are not enough.",
          "Test screen reader announcements for expanded state and selected value.",
          "Verify color contrast, click targets, and behavior under zoom.",
        ],
        followUps: [
          "When is a native select better?",
          "How would you test this in CI?",
        ],
      },
    ],
  },
  {
    id: "backend-api",
    title: "Backend API Practice Pack",
    icon: "ti-server",
    accent: "APIs + Services",
    stackKeys: ["node", "python", "go"],
    aliases: ["backend", "api design", "rest", "authentication", "security", "microservices", "node", "python", "fastapi", "express", "django"],
    cards: [
      {
        id: "api-idempotency",
        question: "How would you design a payment or order creation API so retries do not create duplicates?",
        tags: ["API Design", "Reliability", "Idempotency"],
        answerPoints: [
          "Require an idempotency key for unsafe client retries.",
          "Store the key with request identity, result status, and response metadata.",
          "Make the create operation transactional around duplicate detection and persistence.",
          "Define what happens when the same key is reused with a different payload.",
        ],
        followUps: [
          "Where would you store idempotency keys?",
          "How long should they live?",
        ],
      },
      {
        id: "api-rate-limiting",
        question: "How would you add rate limiting to a public API without blocking legitimate users?",
        tags: ["Rate Limiting", "Authentication", "Scalability"],
        answerPoints: [
          "Pick a limit key that matches the risk: user, API key, IP, route, or tenant.",
          "Use token bucket, leaky bucket, or fixed windows depending on burst tolerance.",
          "Return clear 429 responses with retry guidance.",
          "Add observability and allowlists for trusted internal traffic when appropriate.",
        ],
        followUps: [
          "How does this change behind a proxy?",
          "What would you log for abuse detection?",
        ],
      },
      {
        id: "api-versioning",
        question: "How do you evolve a REST API contract without breaking existing clients?",
        tags: ["API Design", "Versioning", "Contracts"],
        answerPoints: [
          "Prefer additive changes and keep existing fields stable.",
          "Version only when behavior or schema changes are incompatible.",
          "Publish deprecation timelines and monitor old-client usage.",
          "Use contract tests or schema validation to catch accidental breaks.",
        ],
        followUps: [
          "Would you version in the URL or headers?",
          "How would you roll out a breaking auth change?",
        ],
      },
    ],
  },
  {
    id: "dsa",
    title: "DSA Practice Pack",
    icon: "ti-binary-tree",
    accent: "Algorithms",
    stackKeys: [],
    aliases: ["dsa", "algorithms", "arrays", "strings", "linked lists", "trees", "graphs", "dynamic programming", "sorting", "searching", "heaps", "tries"],
    cards: [
      {
        id: "tree-graph-traversal",
        question: "How would you explain DFS vs BFS on a tree or graph, and when would you choose each one?",
        tags: ["Trees & Graphs", "Traversal", "Complexity"],
        answerPoints: [
          "DFS explores depth first and is natural for recursion, backtracking, and connected components.",
          "BFS explores level by level and is preferred for shortest path in unweighted graphs.",
          "Both are usually O(V + E) for graphs when visited nodes are tracked.",
          "Call out stack or queue memory and recursion-depth risks.",
        ],
        followUps: [
          "How do you avoid infinite loops in cyclic graphs?",
          "Which one solves minimum moves in a maze?",
        ],
      },
      {
        id: "sliding-window",
        question: "When does a sliding window pattern work for arrays or strings?",
        tags: ["Arrays & Strings", "Patterns", "Complexity"],
        answerPoints: [
          "Use it when the answer depends on a contiguous range.",
          "A fixed window works for fixed-size ranges; variable windows need a rule for expanding and shrinking.",
          "Track only the state needed to validate the current window.",
          "Explain why each pointer moves at most n times for O(n) complexity.",
        ],
        followUps: [
          "Why does it fail for non-contiguous subsequences?",
          "How would duplicate characters affect the window state?",
        ],
      },
      {
        id: "dp-recognition",
        question: "How do you recognize that a problem likely needs dynamic programming?",
        tags: ["Dynamic Programming", "Patterns", "Complexity"],
        answerPoints: [
          "Look for overlapping subproblems and optimal substructure.",
          "Define the state before writing transitions.",
          "Choose top-down memoization or bottom-up tabulation based on clarity and constraints.",
          "State time and space complexity in terms of state count and transition cost.",
        ],
        followUps: [
          "How would you reduce DP memory?",
          "What makes greedy wrong for some DP problems?",
        ],
      },
    ],
  },
  {
    id: "system-design",
    title: "System Design Practice Pack",
    icon: "ti-topology-star",
    accent: "Architecture",
    stackKeys: [],
    aliases: ["system design", "hld", "database design", "caching", "message queues", "scalability", "load", "real-world systems", "api gateway"],
    cards: [
      {
        id: "cache-invalidation",
        question: "How would you add caching to a read-heavy service without serving stale data forever?",
        tags: ["Caching Strategies", "Scalability", "Consistency"],
        answerPoints: [
          "Start with access patterns, freshness requirements, and failure tolerance.",
          "Choose cache-aside, write-through, or write-behind based on write behavior.",
          "Use TTLs, explicit invalidation, or event-driven updates for freshness.",
          "Plan for cache misses, stampedes, hot keys, and observability.",
        ],
        followUps: [
          "How would you prevent a cache stampede?",
          "What metrics show the cache is helping?",
        ],
      },
      {
        id: "queue-worker",
        question: "When would you introduce a message queue between two services?",
        tags: ["Message Queues", "Reliability", "Scalability"],
        answerPoints: [
          "Use queues to decouple latency, absorb bursts, and retry asynchronous work.",
          "Design consumers to be idempotent because duplicate delivery can happen.",
          "Track dead-letter queues, retries, ordering, and backpressure.",
          "Avoid queues when the caller truly needs immediate consistent results.",
        ],
        followUps: [
          "How would you handle poison messages?",
          "What ordering guarantees do you actually need?",
        ],
      },
      {
        id: "url-shortener",
        question: "Design a URL shortener at a high level. What are the core components and trade-offs?",
        tags: ["HLD Patterns", "Real-world Systems", "Database Design"],
        answerPoints: [
          "Clarify traffic, custom aliases, expiry, analytics, and abuse requirements.",
          "Use an ID generation strategy that avoids collisions and supports scale.",
          "Separate write path, read redirect path, storage, cache, and analytics pipeline.",
          "Discuss hot links, rate limiting, observability, and data retention.",
        ],
        followUps: [
          "How would you generate short codes?",
          "How would analytics affect latency?",
        ],
      },
    ],
  },
  {
    id: "databases",
    title: "Database Practice Pack",
    icon: "ti-database",
    accent: "SQL + Data",
    stackKeys: ["postgresql", "mongodb"],
    aliases: ["database", "databases", "sql", "postgres", "mysql", "indexing", "query tuning", "transactions", "nosql", "data modeling", "migrations"],
    cards: [
      {
        id: "sql-index-tuning",
        question: "How do you tune a slow SQL query in a production-like way?",
        tags: ["Indexing & Query Tuning", "Performance", "SQL"],
        answerPoints: [
          "Start with the query plan and actual row counts, not guesses.",
          "Check predicates, joins, sort operations, and missing or unused indexes.",
          "Validate any index against write cost, storage, and selectivity.",
          "Measure before and after using realistic data volume.",
        ],
        followUps: [
          "What makes a low-cardinality index less useful?",
          "How can a composite index order matter?",
        ],
      },
      {
        id: "transaction-isolation",
        question: "What transaction issues can happen when two requests update the same business record?",
        tags: ["Transactions", "Concurrency", "Data Integrity"],
        answerPoints: [
          "Discuss lost updates, dirty reads, non-repeatable reads, and phantom reads.",
          "Use appropriate isolation, optimistic locking, pessimistic locking, or constraints.",
          "Keep transactions short and clear about retry behavior.",
          "Use database constraints as the final integrity guard.",
        ],
        followUps: [
          "When would optimistic locking fail?",
          "How would you handle deadlock retries?",
        ],
      },
      {
        id: "schema-migration",
        question: "How would you deploy a database schema change without downtime?",
        tags: ["Migrations", "Deployment", "Data Modeling"],
        answerPoints: [
          "Use expand-and-contract migrations for incompatible changes.",
          "Deploy additive schema first, then application code, then cleanup later.",
          "Backfill data safely with batches and monitoring.",
          "Make rollbacks realistic by avoiding destructive changes in the same deploy.",
        ],
        followUps: [
          "How would you rename a column safely?",
          "What should a migration dashboard show?",
        ],
      },
    ],
  },
  {
    id: "cloud-devops",
    title: "Cloud & DevOps Practice Pack",
    icon: "ti-cloud",
    accent: "Delivery",
    stackKeys: ["aws", "azure", "docker"],
    aliases: ["cloud", "devops", "docker", "kubernetes", "ci/cd", "cicd", "deployment", "observability", "api gateway", "aws", "azure", "gcp"],
    cards: [
      {
        id: "container-debugging",
        question: "A service works locally but fails in Docker. What would you check first?",
        tags: ["Docker", "Debugging", "Deployment"],
        answerPoints: [
          "Compare environment variables, ports, working directory, and startup command.",
          "Check image build context, copied files, dependency installation, and runtime user permissions.",
          "Inspect logs and container health rather than only rebuilding.",
          "Verify networking assumptions such as localhost, service names, and exposed ports.",
        ],
        followUps: [
          "How would this differ in Kubernetes?",
          "What belongs in a health check?",
        ],
      },
      {
        id: "ci-cd-rollback",
        question: "What should a reliable CI/CD pipeline include before production deployment?",
        tags: ["CI/CD", "Deployment Strategies", "Testing"],
        answerPoints: [
          "Run fast validation: lint, unit tests, build, and targeted integration tests.",
          "Package immutable artifacts and deploy the same artifact across environments.",
          "Use gradual rollout, health checks, and rollback criteria.",
          "Capture logs, metrics, and release metadata for diagnosis.",
        ],
        followUps: [
          "When would you use blue-green deployment?",
          "What makes rollback unsafe?",
        ],
      },
      {
        id: "observability-signal",
        question: "Which observability signals would you add to a new production API?",
        tags: ["Observability", "APIs", "Production"],
        answerPoints: [
          "Track latency, traffic, errors, and saturation for the service.",
          "Add structured logs with request IDs and privacy-safe fields.",
          "Use traces across service boundaries for slow-path diagnosis.",
          "Define alerts on user-impacting symptoms, not only machine symptoms.",
        ],
        followUps: [
          "What should not be logged?",
          "How would request IDs flow through services?",
        ],
      },
    ],
  },
  {
    id: "behavioral",
    title: "Behavioral Practice Pack",
    icon: "ti-users",
    accent: "Stories",
    stackKeys: [],
    aliases: ["behavioral", "ownership", "collaboration", "conflict", "mentoring", "delivery", "pressure", "star"],
    cards: [
      {
        id: "ownership-story",
        question: "Tell me about a time you took ownership of a problem that was not clearly assigned to you.",
        tags: ["Ownership", "STAR Method Practice", "Leadership"],
        answerPoints: [
          "Set context quickly and explain why the problem mattered.",
          "Describe the specific actions you took and who you aligned with.",
          "Show trade-offs, communication, and measurable outcome.",
          "End with what you learned or changed afterward.",
        ],
        followUps: [
          "What would you do differently now?",
          "How did you know it was worth your time?",
        ],
      },
      {
        id: "conflict-resolution",
        question: "Describe a technical disagreement you had with a teammate and how you resolved it.",
        tags: ["Conflict Resolution", "Collaboration", "Communication"],
        answerPoints: [
          "Keep the disagreement professional and technical.",
          "Show how you listened, clarified criteria, and used data or experiments.",
          "Explain the decision and how you supported it even if it was not your first choice.",
          "Avoid blaming the other person or making yourself the only hero.",
        ],
        followUps: [
          "What if the disagreement had stayed unresolved?",
          "How did this affect the relationship?",
        ],
      },
      {
        id: "delivery-pressure",
        question: "Tell me about a time you delivered under pressure without lowering engineering quality too much.",
        tags: ["Delivery Under Pressure", "Prioritization", "Quality"],
        answerPoints: [
          "Explain the deadline, risk, and constraints.",
          "Show how you cut scope, sequenced work, or added safeguards.",
          "Mention tests, monitoring, rollback, or communication used to control risk.",
          "Share the outcome and any follow-up quality work.",
        ],
        followUps: [
          "What quality bar was non-negotiable?",
          "How did you communicate risk to stakeholders?",
        ],
      },
    ],
  },
];

function normalize(value) {
  return String(value || "").toLowerCase();
}

function titleize(value) {
  return String(value || "")
    .replace(/[\/&]+/g, " ")
    .split(/[^a-zA-Z0-9+#.]+/)
    .filter(Boolean)
    .map((part) => {
      if (/^(api|jwt|jpa|orm|sql|dsa|hld|ci|cd|ui)$/i.test(part)) return part.toUpperCase();
      if (/^(js|ts)$/i.test(part)) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function normalizeDifficulty(difficulty) {
  return EXPERIENCE_GUIDES[difficulty]?.level || DEFAULT_DIFFICULTY;
}

function createRandom(seedValue) {
  const seedText = String(seedValue || `${Date.now()}-${Math.random()}`);
  let hash = 2166136261;

  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, seed) {
  const random = createRandom(seed);
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function includesAny(text, values = []) {
  return values.some((value) => text.includes(normalize(value)));
}

function selectedText({ profile, selectedCat, selectedSub }) {
  return [
    selectedCat,
    selectedSub,
    profile?.position,
    profile?.stack,
  ].map(normalize).join(" ");
}

function scorePack(pack, context, stackKey) {
  let score = 0;
  if (pack.stackKeys.includes(stackKey)) score += 4;
  if (includesAny(context, pack.aliases)) score += 6;
  return score;
}

function pickPack(args) {
  const stackKey = getTechTheme(args.profile?.stack).key;
  const context = selectedText(args);

  return PRACTICE_PACKS
    .map((pack) => ({ pack, score: scorePack(pack, context, stackKey) }))
    .sort((a, b) => b.score - a.score)[0]?.pack || PRACTICE_PACKS[0];
}

function buildTopicList(pack, topic) {
  const rawTopics = [
    topic,
    ...pack.cards.flatMap((card) => card.tags),
    ...pack.aliases,
    pack.accent,
    pack.title.replace("Practice Pack", ""),
  ];
  const seen = new Set();

  return rawTopics
    .map(titleize)
    .filter((value) => value.length > 2)
    .filter((value) => {
      const key = normalize(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function buildGeneratedCard({ pack, topic, template, index, guide }) {
  const idTopic = normalize(topic).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "topic";
  const id = `${pack.id}-${template.id}-${idTopic}-${index}`;

  return {
    id,
    question: template.question({ topic, guide }),
    tags: [topic, guide.level, "Most Asked"],
    answerPoints: template.points({ topic, guide }),
    followUps: template.followUps({ topic, guide }),
    experienceLevel: guide.level,
  };
}

function buildQuestionBank(pack, topic, difficulty) {
  const experienceLevel = normalizeDifficulty(difficulty);
  const guide = EXPERIENCE_GUIDES[experienceLevel];
  const baseCards = pack.cards.map((card) => ({
    ...card,
    experienceLevel,
  }));
  const topics = buildTopicList(pack, topic);
  const generatedCards = [];
  let index = 0;

  while (baseCards.length + generatedCards.length < TARGET_BANK_SIZE) {
    const drillTopic = topics[index % topics.length] || titleize(topic || pack.accent);
    const template = QUESTION_TEMPLATES[index % QUESTION_TEMPLATES.length];
    generatedCards.push(buildGeneratedCard({
      pack,
      topic: drillTopic,
      template,
      index,
      guide,
    }));
    index += 1;
  }

  return [...baseCards, ...generatedCards].slice(0, TARGET_BANK_SIZE);
}

function cardScore(card, topicText) {
  const text = normalize([
    card.question,
    ...card.tags,
  ].join(" "));
  const tokens = normalize(topicText)
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 2);

  return tokens.reduce((score, token) => score + (text.includes(token) ? 1 : 0), 0);
}

function pickCards(bank, topicText, { seed, excludeIds = [], count = DEFAULT_VISIBLE_CARDS } = {}) {
  const excluded = new Set(excludeIds);
  const eligible = bank.filter((card) => !excluded.has(card.id));
  const pool = eligible.length >= count ? eligible : bank;
  const ranked = pool
    .map((card, index) => ({ card, index, score: cardScore(card, topicText) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const anchor = ranked.find(({ score }) => score > 0)?.card || ranked[0]?.card;
  const rest = ranked
    .map(({ card }) => card)
    .filter((card) => card.id !== anchor?.id);

  return [
    ...(anchor ? [anchor] : []),
    ...shuffled(rest, seed),
  ].slice(0, count);
}

export function buildPracticeMockPrompt({ profile, topic, difficulty = DEFAULT_DIFFICULTY, card }) {
  const name = getDisplayName(profile);
  const stack = profile?.stack || "full stack";
  const answerGuide = card.answerPoints.map((point) => `- ${point}`).join("\n");
  const followUps = card.followUps.map((item) => `- ${item}`).join("\n");

  return [
    `Run a ${difficulty}-level mock interview for ${name} on "${topic}".`,
    `Use ${stack} examples when helpful.`,
    "Ask exactly this question first, then wait for my answer:",
    `"${card.question}"`,
    "",
    "Use this private scoring guide after I answer. Do not reveal it before I respond:",
    answerGuide,
    "",
    "After my answer, reply with Score: X/10, concise strengths, gaps, and one next follow-up from this list:",
    followUps,
  ].join("\n");
}

export function getPracticePack({
  profile,
  selectedCat,
  selectedSub,
  difficulty = DEFAULT_DIFFICULTY,
  seed,
  excludeIds = [],
} = {}) {
  const pack = pickPack({ profile, selectedCat, selectedSub });
  const topic = selectedSub || selectedCat || pack.title.replace(" Practice Pack", "");
  const bank = buildQuestionBank(pack, topic, difficulty);
  const cards = pickCards(bank, topic, { seed, excludeIds }).map((card) => ({
    ...card,
    mockPrompt: buildPracticeMockPrompt({
      profile,
      topic,
      difficulty,
      card,
    }),
  }));

  return {
    id: pack.id,
    title: pack.title,
    icon: pack.icon,
    accent: pack.accent,
    source: "local-curated",
    topic,
    difficulty: normalizeDifficulty(difficulty),
    bankSize: bank.length,
    cards,
  };
}
