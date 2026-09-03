export const INTERVIEW_READY_GLOSSARY = [
  ["Mock interview", "A timed practice round where you answer as if another person were evaluating your communication and decisions."],
  ["Rubric", "The checklist used to score an answer, such as correctness, evidence, trade-offs, and clarity."],
  ["STAR", "A behavioral-answer structure: Situation, Task, Action, Result."],
  ["Behavioral question", "A question about what you actually did, how you made a decision, or how you handled conflict or failure."],
  ["System-design question", "A question about designing services, data, traffic, failure handling, and trade-offs before writing code."],
  ["Trade-off", "A deliberate choice where improving one quality, such as speed, costs something else, such as freshness or simplicity."],
  ["Follow-up", "The interviewer’s next probe that tests whether your first answer still holds under a changed constraint."],
  ["Local rubric", "A private first-pass score calculated in the browser; it is coaching feedback, not a hiring decision."],
];

export const INTERVIEW_READY_QA_CATEGORIES = [
  { id: "core-java", label: "Core Java", icon: "ti-cup", description: "Collections, JVM basics, equality, memory, and modern Java trade-offs." },
  { id: "spring-boot", label: "Spring Boot", icon: "ti-leaf", description: "Layering, transactions, validation, APIs, and production backend habits." },
  { id: "concurrency", label: "Concurrency", icon: "ti-arrows-shuffle", description: "Threads, race conditions, futures, locks, and safe shared state." },
  { id: "sql-data", label: "SQL & Data", icon: "ti-database", description: "Indexes, transactions, ORM pitfalls, and database performance reasoning." },
  { id: "system-design", label: "System Design", icon: "ti-schema", description: "Scalability, reliability, and service-level trade-offs." },
  { id: "behavioral", label: "Behavioral", icon: "ti-message-2-heart", description: "Ownership, conflict handling, leadership, and decision quality." },
];

export const INTERVIEW_READY_QA_DIFFICULTIES = ["All", "Junior", "Mid", "Senior"];

export const INTERVIEW_READY_QA_QUESTIONS = [
  {
    id: "hashmap-vs-concurrenthashmap",
    categoryId: "core-java",
    difficulty: "Mid",
    frequency: "High-frequency backend screen",
    stage: "Screening and coding rounds",
    question: "What is the difference between HashMap and ConcurrentHashMap?",
    whyItIsAsked: "Interviewers use this to test whether you understand thread safety beyond memorized definitions and whether you can connect data-structure choice to production behavior.",
    answer: {
      direct: "HashMap is not safe for concurrent structural mutation, so a write concurrent with another access can lead to inconsistent behavior. ConcurrentHashMap is built for concurrent access and allows multiple threads to operate safely with much better throughput than synchronizing an entire map.",
      polished: "In an interview, I would say HashMap is the default choice for single-threaded or externally synchronized code because it is simple and fast. ConcurrentHashMap is the better choice when shared mutable state must be accessed by multiple threads, because it gives thread safety with finer-grained concurrency instead of locking the whole structure. I would also mention that thread safety does not automatically make the overall workflow atomic, so compound operations still need careful thinking.",
      keyPoints: [
        "HashMap is unsafe for concurrent writes and can produce lost updates or inconsistent reads.",
        "ConcurrentHashMap supports concurrent access with internal coordination designed for throughput.",
        "Operations such as check-then-act may still need atomic APIs like compute or external coordination.",
        "Choose based on access pattern, not on habit.",
      ],
      example: "A request cache shared across worker threads should use ConcurrentHashMap. A temporary map built inside one method should use HashMap.",
      aceSignals: [
        "Name thread safety, throughput, and compound-operation caveats in one answer.",
        "Mention that choosing ConcurrentHashMap does not remove the need to reason about correctness at the workflow level.",
        "Connect the choice to a real backend example such as caching, rate limiting, or session metadata.",
      ],
      mistakes: [
        "Saying only 'ConcurrentHashMap is synchronized' without explaining the practical effect.",
        "Claiming HashMap is always faster without mentioning correctness requirements.",
        "Ignoring atomic update helpers like computeIfAbsent or merge.",
      ],
      followUps: [
        "When would you still need synchronized blocks with ConcurrentHashMap?",
        "Why can a mutable key break map lookups?",
        "When would immutable data remove the need for concurrent mutation entirely?",
      ],
    },
  },
  {
    id: "equals-hashcode-contract",
    categoryId: "core-java",
    difficulty: "Junior",
    frequency: "Very common core Java check",
    stage: "Screening and first technical round",
    question: "Why do equals and hashCode need to be consistent?",
    whyItIsAsked: "This reveals whether you really understand how hash-based collections work and whether you can explain object identity versus logical equality clearly.",
    answer: {
      direct: "If two objects are equal according to equals, they must return the same hashCode. Otherwise hash-based collections like HashMap and HashSet may place equal objects in different buckets and fail to find them correctly.",
      polished: "My interview-ready explanation is that hashCode decides the bucket and equals confirms the match inside that bucket. So the contract matters because collections rely on both methods together. If equal objects have different hash codes, lookups, duplicate detection, and removals can behave incorrectly. I also mention that overriding equals usually means overriding hashCode too, and mutable fields used in those methods are risky after insertion into a hash-based collection.",
      keyPoints: [
        "hashCode narrows the search; equals confirms logical equality.",
        "Equal objects must have the same hashCode, but the reverse is not required.",
        "Mutable fields in equality logic can break retrieval after insertion.",
      ],
      example: "If an Employee object uses email for equals and hashCode, changing the email after storing it in a HashSet can make contains return false even for the same object reference.",
      aceSignals: [
        "State the one-way rule correctly: equal implies same hashCode.",
        "Tie the rule to HashMap or HashSet behavior.",
        "Call out the mutable-key pitfall.",
      ],
      mistakes: [
        "Saying different objects must always have different hash codes.",
        "Explaining only the Java rule without connecting it to collection behavior.",
        "Missing the mutable-field trap.",
      ],
      followUps: [
        "What happens when two different objects have the same hashCode?",
        "Would you include every field in equals and hashCode?",
        "How would records affect this discussion in Java 17?",
      ],
    },
  },
  {
    id: "spring-transactional-boundaries",
    categoryId: "spring-boot",
    difficulty: "Mid",
    frequency: "High-frequency service design question",
    stage: "Backend rounds",
    question: "Where should @Transactional usually live, and why?",
    whyItIsAsked: "Interviewers want to see whether you understand business boundaries, data consistency, and Spring layering rather than just knowing annotations.",
    answer: {
      direct: "Transactional boundaries usually belong in the service layer because that is where business use cases are coordinated. Controllers should stay request-focused, and repositories should stay persistence-focused.",
      polished: "I would explain that a transaction should wrap one business operation, not just one repository call. That usually maps cleanly to the service layer, where we validate inputs, coordinate multiple repository operations, and decide rollback behavior. Keeping transactions there makes the application easier to reason about, keeps controllers thin, and avoids leaking database concerns into the web layer. I would also mention that long-running or remote calls inside a transaction should be avoided because they hold resources longer than necessary.",
      keyPoints: [
        "A transaction should align with one business use case.",
        "Service methods are the natural place to coordinate multiple repository calls.",
        "Controllers and repositories stay cleaner when transaction ownership is in services.",
        "Do not keep transactions open across slow remote calls unless there is a very specific need.",
      ],
      example: "Creating an order may validate stock, save the order, reserve inventory, and write an audit entry. That entire workflow belongs in one service-level transaction if consistency requires all-or-nothing behavior.",
      aceSignals: [
        "Frame the answer around a business use case, not only annotation placement.",
        "Mention resource holding and remote-call caution.",
        "Use a concrete workflow example.",
      ],
      mistakes: [
        "Saying '@Transactional goes on repositories because they talk to the database.'",
        "Ignoring transaction scope and duration.",
        "Missing the point that one request can include multiple repository calls.",
      ],
      followUps: [
        "What changes with readOnly transactions?",
        "What are common proxy-related gotchas with @Transactional?",
        "How would you handle a workflow that calls an external payment service?",
      ],
    },
  },
  {
    id: "rest-idempotency",
    categoryId: "spring-boot",
    difficulty: "Mid",
    frequency: "Common API design question",
    stage: "Backend and system design rounds",
    question: "What is idempotency in REST APIs, and why does it matter?",
    whyItIsAsked: "This checks whether you can design APIs that behave safely under retries, network failures, and client uncertainty.",
    answer: {
      direct: "An operation is idempotent if making the same request multiple times has the same final effect as making it once. It matters because real systems retry requests when timeouts or transient failures happen.",
      polished: "My polished answer would be that idempotency is about safe repeatability at the business level, not just HTTP vocabulary. It is important because clients, gateways, and job processors may retry requests when they are unsure whether the first attempt succeeded. If the endpoint is idempotent, retries do not create duplicate orders, payments, or state transitions. In practice, I would mention HTTP semantics where relevant, but I would also bring up idempotency keys, unique constraints, and request deduplication for create-style workflows.",
      keyPoints: [
        "Same request, same final effect.",
        "Retries are normal in distributed systems.",
        "Idempotency often needs business identifiers, not only HTTP method semantics.",
        "Critical for payments, order creation, and external callback handling.",
      ],
      example: "A payment API can accept an idempotency key so that retrying the same charge request does not create a second payment record.",
      aceSignals: [
        "Connect the concept to retries and uncertainty, not only definitions.",
        "Mention business-level protections such as idempotency keys or unique constraints.",
        "Use a concrete money or order example.",
      ],
      mistakes: [
        "Saying POST can never be idempotent.",
        "Treating idempotency as only an HTTP interview trivia point.",
        "Skipping how it is implemented in real systems.",
      ],
      followUps: [
        "How would you store and expire idempotency keys?",
        "What is the difference between idempotency and exactly-once processing?",
        "When would retries still be unsafe even with idempotency support?",
      ],
    },
  },
  {
    id: "race-condition-handling",
    categoryId: "concurrency",
    difficulty: "Senior",
    frequency: "Common senior backend probe",
    stage: "Concurrency and architecture rounds",
    question: "How do you identify and fix a race condition?",
    whyItIsAsked: "This tests whether you can reason about correctness under concurrent execution instead of reaching for locks automatically.",
    answer: {
      direct: "I identify a race condition by finding shared mutable state that can be read or updated by multiple threads without a safe coordination strategy. I fix it by choosing the right mechanism for the access pattern, such as confinement, immutability, atomic operations, or locking.",
      polished: "In an interview, I would say the first step is to understand the shared state, the invariant we need to protect, and the operations that can interleave incorrectly. Then I choose the lightest safe fix: sometimes that is avoiding sharing altogether, sometimes it is using immutable data, sometimes an atomic type is enough, and sometimes the workflow needs a lock or a redesign around message passing. I would also mention that the fix is not complete until we can explain how we will prove it works, for example with targeted tests, load scenarios, or reasoning about the invariant.",
      keyPoints: [
        "Start from the invariant, not from a favorite primitive.",
        "Prefer removing shared mutability when possible.",
        "Use atomics for simple independent state transitions; use locks when multiple values must move together.",
        "Verification matters because concurrency bugs are timing-sensitive.",
      ],
      example: "If two threads increment a shared counter with read-modify-write logic, AtomicInteger may be enough. If two account balances and an audit record must update together, you need a broader consistency strategy.",
      aceSignals: [
        "Talk about invariants and interleavings.",
        "Offer multiple fixes and choose based on the workload.",
        "Mention how you would validate the fix.",
      ],
      mistakes: [
        "Answering 'just add synchronized' with no trade-off discussion.",
        "Ignoring contention or performance impact.",
        "Skipping the verification step.",
      ],
      followUps: [
        "When is AtomicInteger not enough?",
        "How would you debug a race condition that appears rarely in production?",
        "When would you redesign the workflow instead of adding locks?",
      ],
    },
  },
  {
    id: "n-plus-one",
    categoryId: "sql-data",
    difficulty: "Mid",
    frequency: "Very common JPA question",
    stage: "Backend and performance rounds",
    question: "What is the N+1 query problem, and how do you fix it?",
    whyItIsAsked: "This reveals whether you can connect ORM convenience to real database cost and performance debugging.",
    answer: {
      direct: "The N+1 problem happens when one query loads a parent set and then additional queries are triggered for each related row, leading to one initial query plus N follow-up queries.",
      polished: "I would explain it as a hidden performance issue caused by access patterns, not just by the ORM itself. The first query loads the main records, and then lazy loading or repeated access causes extra queries for each record. That becomes expensive quickly as data size grows. The right fix depends on the use case: fetch joins, entity graphs, batch fetching, projections, or explicit SQL. I would also mention that fixing it is not about forcing eager loading everywhere, because that can create new problems such as over-fetching or broken pagination.",
      keyPoints: [
        "One parent query plus many child queries.",
        "Often caused by lazy loading inside loops or serialization.",
        "Fix based on access needs: fetch join, projection, batch loading, or explicit query.",
        "Avoid replacing one problem with over-fetching.",
      ],
      example: "Fetching 100 orders and then accessing each order's customer in a loop may trigger 101 queries instead of one carefully designed query.",
      aceSignals: [
        "Say how you would prove it with logs or query counting.",
        "Mention multiple fix strategies and their trade-offs.",
        "Note that eager loading everywhere is not a clean answer.",
      ],
      mistakes: [
        "Blaming lazy loading alone without discussing usage patterns.",
        "Treating fetch join as the universal solution.",
        "Ignoring pagination trade-offs.",
      ],
      followUps: [
        "Why can fetch joins be tricky with pagination?",
        "When is a projection better than returning entities?",
        "How would you detect N+1 problems in CI or staging?",
      ],
    },
  },
  {
    id: "sql-index",
    categoryId: "sql-data",
    difficulty: "Junior",
    frequency: "Very common database screen",
    stage: "Screening and backend rounds",
    question: "What is an index in SQL, and what trade-offs does it introduce?",
    whyItIsAsked: "Interviewers want to see whether you can go beyond 'indexes make queries fast' and reason about write cost, storage, and query shape.",
    answer: {
      direct: "An index is a data structure that helps the database find rows faster without scanning the entire table. The trade-off is that indexes consume storage and make writes slower because inserts, updates, and deletes also need index maintenance.",
      polished: "My interview-ready explanation is that an index improves lookup efficiency by organizing searchable values so the database can avoid full scans for suitable queries. But indexes are not free. They add storage overhead, can slow writes, and only help when the query pattern matches the indexed columns well enough. So the real skill is to design indexes around access patterns, selectivity, sorting needs, and join conditions instead of adding them blindly.",
      keyPoints: [
        "Indexes optimize reads for matching query patterns.",
        "They cost storage and write performance.",
        "Column order matters in composite indexes.",
        "The best index depends on real filter, join, and sort usage.",
      ],
      example: "If orders are frequently queried by customer_id and created_at, a composite index may help more than two unrelated single-column indexes.",
      aceSignals: [
        "Mention both read benefit and write cost.",
        "Bring up access patterns and composite-column order.",
        "Explain that indexes do not help every query equally.",
      ],
      mistakes: [
        "Saying indexes always improve performance.",
        "Ignoring write overhead and storage cost.",
        "Never mentioning query shape or column order.",
      ],
      followUps: [
        "What is a covering index?",
        "How would you decide index column order?",
        "Why might the optimizer still choose a full table scan?",
      ],
    },
  },
  {
    id: "rate-limiter-design",
    categoryId: "system-design",
    difficulty: "Senior",
    frequency: "Common design round topic",
    stage: "System design and bar-raiser rounds",
    question: "How would you design a rate limiter?",
    whyItIsAsked: "This probes your ability to balance correctness, fairness, performance, and operational simplicity under real traffic.",
    answer: {
      direct: "I would first clarify the scope: per user, per API key, per IP, or global; then choose a policy such as token bucket or sliding window based on fairness and implementation complexity.",
      polished: "A strong interview answer starts with clarifying the unit being limited, the traffic shape, and whether we care more about strict fairness or lightweight enforcement. Then I would choose a design such as token bucket because it is simple, supports bursts up to a controlled limit, and works well for APIs. I would store counters in a fast shared store like Redis if the limiter must work across instances, use atomic updates, set expirations carefully, and define what happens on datastore failure. I would also mention observability, abuse visibility, and how to keep the system from becoming a bottleneck itself.",
      keyPoints: [
        "Clarify the dimension being limited.",
        "Choose algorithm based on fairness, burst support, and complexity.",
        "Cross-instance designs usually need a shared fast store and atomic operations.",
        "Failure policy and observability are part of the design, not afterthoughts.",
      ],
      example: "For an API gateway, a Redis-backed token bucket keyed by API key can allow short bursts while protecting the backend from sustained abuse.",
      aceSignals: [
        "Start with requirements and trade-offs.",
        "Mention failure mode, hot keys, and monitoring.",
        "Show awareness that the limiter itself must scale.",
      ],
      mistakes: [
        "Jumping straight to Redis without clarifying requirements.",
        "Ignoring distributed consistency or datastore failure.",
        "Discussing only the algorithm and not the operating model.",
      ],
      followUps: [
        "How would you avoid hot keys for a very popular tenant?",
        "What happens if Redis is down?",
        "When would you choose sliding window over token bucket?",
      ],
    },
  },
  {
    id: "ownership-conflict",
    categoryId: "behavioral",
    difficulty: "Mid",
    frequency: "High-frequency behavioral loop",
    stage: "Manager and bar-raiser rounds",
    question: "Tell me about a time you disagreed with a teammate and how you handled it.",
    whyItIsAsked: "Interviewers are checking for maturity, collaboration, decision quality, and whether you can protect outcomes without becoming difficult to work with.",
    answer: {
      direct: "I would structure this with context, the point of disagreement, how I created alignment using evidence, and the final result including what I learned.",
      polished: "The answer should show that I can disagree without turning the situation into personal conflict. I would briefly set up the context, explain why the decision mattered, describe how I listened first and surfaced the real trade-off, and then show how I used data, user impact, or delivery risk to move the discussion forward. A strong close is to show the outcome, what changed because of the conversation, and what I would do similarly or differently next time. The goal is to sound accountable and collaborative, not victorious.",
      keyPoints: [
        "Keep the story about the decision, not about personalities.",
        "Show listening, evidence, and alignment building.",
        "End with a measurable or practical outcome.",
        "Reflect on what you learned.",
      ],
      example: "A concise example could be disagreeing on whether to rush a release without observability and proposing a smaller rollout plus monitoring instead.",
      aceSignals: [
        "Show respect for the other person while still taking a clear position.",
        "Use evidence or customer impact to justify the decision.",
        "Close with ownership and learning.",
      ],
      mistakes: [
        "Blaming the teammate or sounding emotionally reactive.",
        "Giving a story with no real conflict or no real outcome.",
        "Forgetting to explain your own contribution.",
      ],
      followUps: [
        "What if the final decision had gone against your recommendation?",
        "How do you escalate when alignment does not happen?",
        "How do you keep disagreement from slowing delivery too much?",
      ],
    },
  },
];

export function getInterviewReadyCategory(categoryId) {
  return INTERVIEW_READY_QA_CATEGORIES.find((category) => category.id === categoryId) || INTERVIEW_READY_QA_CATEGORIES[0];
}

export function getInterviewReadyQuestion(questionId) {
  return INTERVIEW_READY_QA_QUESTIONS.find((question) => question.id === questionId) || null;
}

export function listInterviewReadyQuestions({ categoryId = "all", difficulty = "All", search = "" } = {}) {
  const normalizedSearch = String(search || "").trim().toLowerCase();

  return INTERVIEW_READY_QA_QUESTIONS.filter((question) => {
    const matchesCategory = categoryId === "all" || question.categoryId === categoryId;
    const matchesDifficulty = difficulty === "All" || question.difficulty === difficulty;
    const haystack = [
      question.question,
      question.frequency,
      question.stage,
      question.whyItIsAsked,
      question.answer.direct,
      question.answer.polished,
      question.answer.keyPoints.join(" "),
      question.answer.followUps.join(" "),
    ].join(" ").toLowerCase();
    const matchesSearch = !normalizedSearch || haystack.includes(normalizedSearch);

    return matchesCategory && matchesDifficulty && matchesSearch;
  });
}

export function buildInterviewReadyTailorPrompt(questionId, profile = {}) {
  const question = getInterviewReadyQuestion(questionId);
  if (!question) return "";

  const category = getInterviewReadyCategory(question.categoryId);
  const profileLines = [
    profile?.position ? `Target role: ${profile.position}` : "",
    profile?.experience ? `Experience: ${profile.experience}` : "",
    profile?.stack ? `Tech stack: ${profile.stack}` : "",
  ].filter(Boolean);

  return [
    `Turn this interview question into a polished, interview-ready answer that helps me ace the round: ${question.question}`,
    profileLines.length ? `Candidate profile: ${profileLines.join("; ")}.` : "Candidate profile: not provided, calibrate for a mid-level software engineering interview.",
    `Category: ${category.label}. Difficulty: ${question.difficulty}.`,
    `Why interviewers ask it: ${question.whyItIsAsked}`,
    `Direct answer baseline: ${question.answer.direct}`,
    `Polished answer baseline: ${question.answer.polished}`,
    `Key points to preserve: ${question.answer.keyPoints.join("; ")}.`,
    `Ace signals to preserve: ${question.answer.aceSignals.join("; ")}.`,
    `Common mistakes to avoid: ${question.answer.mistakes.join("; ")}.`,
    "Return a direct polished answer, not an interviewer script.",
    "Make it sound like a strong candidate speaking clearly under interview pressure.",
    "Keep it practical and concise, but include trade-offs, one real example, and the likely follow-up angle.",
    "Format exactly with these sections:",
    "**Direct Answer**",
    "**Interview-Ready Polished Answer**",
    "**Why This Lands Well In Interviews**",
    "**Strong Example**",
    "**Mistakes To Avoid**",
    "**Likely Follow-up**",
    "**60-Second Version**",
  ].join("\n");
}

export function buildInterviewReadyMockPrompt(questionId) {
  const question = getInterviewReadyQuestion(questionId);
  if (!question) return "";

  const category = getInterviewReadyCategory(question.categoryId);

  return [
    `Run a focused interview mock for this question: ${question.question}`,
    `Category: ${category.label}. Difficulty: ${question.difficulty}. Stage: ${question.stage}.`,
    `What a strong answer should include: ${question.answer.keyPoints.join("; ")}.`,
    `Ace signals: ${question.answer.aceSignals.join("; ")}.`,
    `Common mistakes to pressure-test: ${question.answer.mistakes.join("; ")}.`,
    `Likely follow-ups: ${question.answer.followUps.join("; ")}.`,
    "Ask the question first and wait for my answer.",
    "Then score me on correctness, depth, communication, trade-offs, and executive clarity.",
    "Push with one realistic follow-up if my answer is shallow or incomplete.",
  ].join("\n");
}
