export const API_GATEWAY_BLOG = {
  "id": "api-gateway-production-patterns",
  "title": "API Gateways: Routing, Trust, Traffic, and Recovery",
  "category": "Microservices architecture",
  "summary": "Design the edge of a ticketing platform with explicit service boundaries, resource authorization, capacity limits, cache isolation, and retry contracts.",
  "lessons": [
    "Separate edge policy from resource ownership.",
    "Budget traffic, caching, and aggregation explicitly.",
    "Recover from ambiguous outcomes without duplicating business effects."
  ],
  "sections": [
    {
      "heading": "A ticketing platform at the edge",
      "body": "Customers browse events, reserve seats, and inspect private bookings. This original six-chapter course follows those requests through an API gateway. It extends the catalog's introductory gateway coverage with concrete trust, cache, admission, and failure decisions."
    },
    {
      "heading": "Examples and execution",
      "body": "Most examples are labeled design traces, not vendor configuration. The final chapter includes a complete Node.js 20+ policy model with assertions. Save it as gateway-policy.mjs and run node gateway-policy.mjs. It demonstrates retry decisions only, not production networking or authentication."
    },
    {
      "heading": "Implementation references",
      "body": "The ticketing scenarios, explanations, diagrams, exercises, and retry model in this course are original. For product-specific behavior, consult AWS gateway cache settings (https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html) and the Spring Cloud Gateway retry filter (https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/gatewayfilter-factories/retry-factory.html). Verify supported features against your installed product version."
    }
  ],
  "example": "Client → gateway edge policy → authenticated service hop → resource authorization → owned state",
  "interviewQuestions": [
    "Which authorization decision belongs in the owning service?",
    "How do quota and concurrency limits differ?",
    "What makes a gateway retry safe after a backend commit?"
  ],
  "practice": "Draw the read and write paths for a ticketing platform, including trust, capacity, caching, and failure boundaries.",
  "capstone": {
    "title": "Capstone: Protect a ticket-sale launch",
    "scenario": "A sale causes a traffic spike while the reservation service slows. A gateway rollout changes routes and a client retries a timed-out booking.",
    "steps": [
      "Define routes, authenticated service hops, and tenant/resource checks. Separate public metadata caching from private booking responses.",
      "Set quota, concurrency, body-size, queue, and deadline budgets. Define which partial responses are valid and which requests must fail.",
      "Canary the route change; test spoofed headers, cross-tenant cache access, duplicate writes, gateway restart, and dependency saturation. Specify rollback and reconciliation ownership."
    ],
    "outcome": "Deliver a gateway design that preserves booking ownership and bounded resource use during failure."
  }
};

export const API_GATEWAY_CHAPTERS = [
  {
    "title": "1. Routing and safe release boundaries",
    "lesson": "A gateway selects a service using an explicit route contract: method, host, path, and sometimes a trusted routing attribute. Normalize paths consistently with the backend and prefer named upstreams over client-provided destination URLs. Separate service selection from instance balancing. In a ticketing platform, catalog reads and reservation commands have different routes and failure budgets. A canary should use a stable assignment so a customer does not jump between incompatible flows; the service still owns persisted state and compatibility.",
    "whenToUse": "Use routing policies when several services need a stable external API.",
    "avoid": "Avoid adding a gateway to a small application without a concrete routing or policy need.",
    "walkthrough": "A 5% canary cohort keeps its assignment during a session. A failing canary stops receiving new work while owned requests drain.",
    "diagram": "GET /events → catalog pool\nPOST /reservations → reservation pool\nUnknown route → reject; never turn a query parameter into an upstream URL.",
    "example": "Illustrative design trace (not deployable gateway configuration):\nGET /events → catalog pool\nPOST /reservations → reservation pool\nUnknown route → reject; never turn a query parameter into an upstream URL.",
    "exercise": "Trace a reservation through a canary and rollback. Explain why restoring the route cannot undo a database migration.",
    "practiceProblems": "Trace normal operation, a rejected request, and a dependency failure; state the user-visible result.",
    "quiz": "Does service discovery prove a backend can safely receive traffic?",
    "answer": "No. Discovery supplies candidates. Readiness, deployment compatibility, capacity, and connection draining determine eligibility."
  },
  {
    "title": "2. Identity at the edge and authorization in services",
    "lesson": "Validate credentials at the edge with trusted issuer, audience, signature algorithm, expiry, and key-rotation rules. Strip client-supplied identity headers before creating trusted context. A backend must authenticate the gateway or validate a delegated credential; being on an internal network is insufficient. The reservation service checks ownership and tenant access against its own resource state on every operation. Edge route scopes cannot establish whether this particular customer owns reservation R7. CORS is a browser policy and does not authorize direct API callers.",
    "whenToUse": "Use shared edge authentication for consistent credential checks across routes.",
    "avoid": "Avoid treating a validated token or an X-User-ID header as permission to access every resource.",
    "walkthrough": "An attacker has a legitimate token but changes R7 in the URL to R8. The service loads R8 and checks ownership before returning any private fields.",
    "diagram": "client X-User-ID: admin → strip\nvalidated subject C9 → authenticated gateway hop → reservation service\nR7 belongs to C4 → deny despite valid C9 identity",
    "example": "Illustrative design trace (not deployable gateway configuration):\nclient X-User-ID: admin → strip\nvalidated subject C9 → authenticated gateway hop → reservation service\nR7 belongs to C4 → deny despite valid C9 identity",
    "exercise": "Test a forged identity header, wrong audience, expired token, direct backend access, and another tenant's reservation.",
    "practiceProblems": "Trace normal operation, a rejected request, and a dependency failure; state the user-visible result.",
    "quiz": "Why must object-level authorization remain in the resource-owning service?",
    "answer": "The service knows the current owner, tenant, and business state. A gateway's broad scope check cannot replace that decision, and alternative entry paths must enforce it too."
  },
  {
    "title": "3. Rate limits, concurrency, and request bounds",
    "lesson": "Rate limits control arrivals over time; concurrency limits control work currently consuming capacity. A token bucket can allow a bounded burst while enforcing a long-term rate, but a slow dependency can exhaust capacity even at an allowed arrival rate. Define limits for authenticated tenants and routes, plus an early unauthenticated abuse boundary. Replicated gateways need coordinated quota accounting or a documented approximation: ten independent 100-request limits can admit roughly ten times that budget. Bound request bytes, decompression, and time spent waiting for admission.",
    "whenToUse": "Use quotas for fairness and concurrency limits to protect expensive or slow operations.",
    "avoid": "Avoid describing a per-process counter as a globally enforced tenant quota.",
    "walkthrough": "At 40 requests/second, increasing service time from 0.1 to 2 seconds changes expected in-flight work from about 4 to 80 under steady-state assumptions.",
    "diagram": "illustrative budget: 40 requests/second × 2 seconds average service time ≈ 80 in flight\nconcurrency ceiling 50 → admission rejects excess work\n429 → quota exceeded; 503 → temporary capacity failure (document your contract)",
    "example": "Illustrative design trace (not deployable gateway configuration):\nillustrative budget: 40 requests/second × 2 seconds average service time ≈ 80 in flight\nconcurrency ceiling 50 → admission rejects excess work\n429 → quota exceeded; 503 → temporary capacity failure (document your contract)",
    "exercise": "Compare 100 clients sharing one NAT address with 100 authenticated tenants. Choose fair keys and define behavior when the quota store fails.",
    "practiceProblems": "Trace normal operation, a rejected request, and a dependency failure; state the user-visible result.",
    "quiz": "Why can requests stay within a rate limit while exhausting connections?",
    "answer": "Rate does not bound duration. As work slows, more requests remain in flight. Separate concurrency and queue limits prevent retained work from growing without bound."
  },
  {
    "title": "4. Caching and representation isolation",
    "lesson": "Cache only responses whose sharing and freshness contracts are explicit. A cache key must distinguish every input that changes the representation, such as route, normalized query, locale, and tenant or identity where applicable. For private reservation responses, bypass shared caching unless a carefully reviewed partition and invalidation policy makes it safe. Authentication and authorization must run before a protected cache hit is returned. TTL bounds ordinary age, not authorization correctness after revocation. Product-specific gateway caching features require explicit configuration and measurement.",
    "whenToUse": "Use shared caching for public event metadata with a documented freshness budget.",
    "avoid": "Avoid a path-only cache for private responses or treating encryption as tenant isolation.",
    "walkthrough": "A EUR response and a USD response share a path but not meaning. Reusing one key produces the wrong price even without a security breach.",
    "diagram": "GET /events/E1?currency=EUR → public key includes currency\nGET /reservations/R7 + customer identity → bypass shared cache\nauthorization revoked → reject, even if an older representation remains cached",
    "example": "Illustrative design trace (not deployable gateway configuration):\nGET /events/E1?currency=EUR → public key includes currency\nGET /reservations/R7 + customer identity → bypass shared cache\nauthorization revoked → reject, even if an older representation remains cached",
    "exercise": "Design cache keys for locale and currency; then show how a missing tenant dimension could leak another tenant's data.",
    "practiceProblems": "Trace normal operation, a rejected request, and a dependency failure; state the user-visible result.",
    "quiz": "Does encrypting the cache fix an incorrect cache key?",
    "answer": "No. Encryption protects stored bytes from some readers. A wrong key still lets the application return the wrong decrypted response to an authorized caller of another request."
  },
  {
    "title": "5. Transformation and bounded aggregation",
    "lesson": "A gateway or client-specific backend can translate a legacy wire format and combine a small set of read responses. Keep domain transactions and business decisions in owning services. Aggregation has a deadline, response-size limit, fan-out limit, and explicit partial-result contract. Parallel calls may shorten latency but increase concurrent downstream load. Validate headers and payload sizes before transformation; remove hop-specific and untrusted forwarding headers. Do not log request bodies simply because the edge is convenient. A trace ID helps diagnosis but is not proof of identity.",
    "whenToUse": "Use adaptation for a stable external contract or a focused client-specific read view.",
    "avoid": "Avoid complex workflows, cross-service writes, and unbounded fan-out in shared gateway filters.",
    "walkthrough": "With 1,000 page requests/second and three backend reads per page, aggregation can produce 3,000 backend requests/second before retries.",
    "diagram": "event page → catalog (required) + recommendations (optional)\nrecommendations deadline exceeded → explicit unavailable section\ncatalog denied → deny; never substitute a cached private result",
    "example": "Illustrative design trace (not deployable gateway configuration):\nevent page → catalog (required) + recommendations (optional)\nrecommendations deadline exceeded → explicit unavailable section\ncatalog denied → deny; never substitute a cached private result",
    "exercise": "Define a 300ms page budget, bounded child deadlines, and a partial-result schema. Explain how clients distinguish unavailable from genuinely empty.",
    "practiceProblems": "Trace normal operation, a rejected request, and a dependency failure; state the user-visible result.",
    "quiz": "Why is an empty fallback potentially misleading?",
    "answer": "An empty list can mean there are no items. A dependency failure means the system does not know. Return an explicit availability status if partial output is part of the API contract."
  },
  {
    "title": "6. Retry safety, observability, and a runnable policy model",
    "lesson": "A timeout does not reveal whether a backend committed. Retry only an explicitly repeatable operation under a shared deadline and attempt budget. An idempotency key is useful only when the owning backend durably deduplicates the same intent; attaching a header alone provides no guarantee. Assign one retry owner to avoid multiplication across layers. Observe route-level errors, latency, rejections, and downstream attempts using bounded labels. Deploy redundant gateway instances and test draining, loss of policy dependencies, and rollback. The model below chooses retry eligibility only; it is not a gateway, token validator, or durable deduplication implementation.",
    "whenToUse": "Use bounded retry policy for transient failures with an explicit backend repeatability guarantee.",
    "avoid": "Avoid automatically replaying write requests after ambiguous outcomes or resetting the timeout on each attempt.",
    "walkthrough": "A single retry means at most two total attempts. Three layers each making two attempts can generate eight downstream attempts for one original request.",
    "diagram": "gateway timeout → check operation contract + remaining budget → retry or reconcile\nrequest ID → route metrics → backend trace → user-visible outcome",
    "example": "// Save as gateway-policy.mjs; run with Node.js 20+.\n// Pure policy model: no HTTP, token validation, storage, or network effects.\nimport assert from \"node:assert/strict\";\nexport function mayRetry({ method, status, attempts, remainingMs,\n                           minimumAttemptMs, sameIntent, durableDedup }) {\n  if (![attempts, remainingMs, minimumAttemptMs].every(Number.isSafeInteger)\n      || attempts < 1 || attempts >= 2 || minimumAttemptMs <= 0\n      || remainingMs < minimumAttemptMs) return false;\n  if (![502, 503, 504].includes(status)) return false;\n  const repeatable = method === \"GET\" || method === \"HEAD\"\n    || (method === \"POST\" && sameIntent === true && durableDedup === true);\n  return repeatable;\n}\nconst base = {method:\"GET\", status:503, attempts:1,\n  remainingMs:200, minimumAttemptMs:100};\nassert.equal(mayRetry(base), true);\nassert.equal(mayRetry({...base, method:\"POST\"}), false);\nassert.equal(mayRetry({...base, method:\"POST\", sameIntent:true, durableDedup:true}), true);\nassert.equal(mayRetry({...base, attempts:2}), false);\nassert.equal(mayRetry({...base, remainingMs:99}), false);\nassert.equal(mayRetry({...base, status:403}), false);\nassert.equal(mayRetry({...base, remainingMs:NaN}), false);\nconsole.log(\"Gateway retry policy checks passed\");",
    "exercise": "Run the model, then add a case where a payment times out after commit. Specify the durable key retention and reconciliation contract outside this model.",
    "practiceProblems": "Trace normal operation, a rejected request, and a dependency failure; state the user-visible result.",
    "quiz": "Does a supplied idempotency key make a POST safe to retry?",
    "answer": "No. The backend must guarantee durable same-key, same-intent deduplication for the retry window. Without that guarantee, preserve the unknown outcome and reconcile."
  }
];
