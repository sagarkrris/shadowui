// Original tutorial with illustrative traces and a standalone routing model.
export const LOAD_BALANCING_BLOG = {
  "id": "load-balancing-algorithms",
  "title": "Load Balancing Algorithms: Traffic, Affinity, and Failure",
  "category": "System design",
  "summary": "Compare eight routing algorithms using worked allocations, capacity signals, hash placement, and a production failure model.",
  "lessons": [
    "Distinguish request distribution from actual resource load.",
    "Choose capacity feedback or affinity from a concrete requirement.",
    "Keep eligibility, admission, retries, and draining explicit."
  ],
  "sections": [
    {
      "heading": "A mixed workload changes the answer",
      "body": "An export API, a live tracking connection, and a cache lookup place different demands on the same fleet. This original course compares round robin, weighted round robin, least connections, weighted least connections, least response time, power of two choices, IP hash, and consistent hashing. Choose from workload evidence rather than a universal ranking."
    },
    {
      "heading": "How to use the examples",
      "body": "The allocation tables and decision traces are illustrative, not deployable proxy configurations. The final chapter includes a complete Node.js 20+ model executable with node routing.mjs. It checks selection boundaries and ring membership changes, but does not simulate networking, concurrent reservations, real hashing, or a vendor's exact scheduling behavior."
    },
    {
      "heading": "Sources and further reading",
      "body": "Implementation references: NGINX HTTP load balancing (https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/) and Envoy supported load balancers (https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/load_balancers). Verify behavior and availability for your installed product version; examples and diagrams here are original."
    }
  ],
  "example": "Eligible backends → workload-appropriate score → bounded admission → observe → adjust",
  "interviewQuestions": [
    "Why can round robin distribute requests evenly while one backend is overloaded?",
    "What changes when HTTP/2 multiplexes requests over a small connection pool?",
    "How do you drain a server with long-lived sockets without a reconnect storm?"
  ],
  "practice": "Choose a policy for short reads, expensive exports, and live sockets; define overload and failure behavior for each.",
  "capstone": {
    "title": "Capstone: Balance a mixed API fleet safely",
    "scenario": "Three differently sized instances serve short reads, long exports, and live sockets. A new instance has a cold cache and another must drain during deployment.",
    "steps": [
      "Define the routing unit and capacity signal for each workload; isolate expensive work and calculate initial shares.",
      "Specify readiness, bounded admission, warmup, drain deadlines, safe retries, and recovery for lost affinity.",
      "Canary the policy with per-backend queue wait, p99, errors, saturation, and reconnect rate; inject a slow node and define rollback thresholds."
    ],
    "outcome": "Deliver a routing decision table, traffic diagram, tested failure scenarios, and a reversible rollout plan."
  }
};

export const LOAD_BALANCING_CHAPTERS = [
  {
    "title": "1. Choose the unit before the algorithm",
    "lesson": "A load balancer chooses among eligible backends, but first define what it assigns: a transport connection, an HTTP request, or an application key. A Layer 4 decision usually remains attached to a flow. A Layer 7 proxy can make request-level decisions, subject to protocol and connection-pool behavior. One HTTP/2 connection may carry many concurrent streams, so counting connections can conceal unequal work. An established WebSocket stays on its selected backend; adding a server does not redistribute existing sockets.",
    "whenToUse": "Use this model before selecting a policy for mixed short requests, downloads, and live connections.",
    "avoid": "Avoid equating equal connection counts with equal CPU, memory, or request load.",
    "walkthrough": "An export service has 100 idle sockets on A and ten expensive exports on B. Connection count favors B even though B is CPU-bound. Measure outstanding work and resource saturation before changing the policy.",
    "diagram": "Client → routing boundary → eligible backends → selected connection or request",
    "example": "Planning worksheet (illustrative):\nJSON API: request-level routing; measure outstanding requests and p99.\nWebSocket: connection-level routing; measure sockets, buffers, and message rate.\nExport: isolate concurrency; measure CPU and queue wait.\nNo eligible backend: explicit bounded failure, not an infinite wait.",
    "exercise": "Classify an HTTP/2 API and a live tracking socket. Explain which work an extra backend can immediately absorb.",
    "quiz": "Why can one open connection represent very different backend load?",
    "answer": "It may be idle, carry a large upload, or multiplex many requests. The protocol, request cost, and resource bottleneck determine whether a connection is a useful load proxy.",
    "practiceProblems": "Explain the normal decision, trace a failure, and identify a measurement that would invalidate the policy."
  },
  {
    "title": "2. Round robin and weighted round robin",
    "lesson": "Round robin cycles over an eligible set without measuring current work. Weighted round robin changes each backend's long-run share according to configured capacity. It is an allocation policy, not a feedback loop: a high-weight machine still receives traffic if it becomes slow but remains eligible. Variants differ in ordering and burstiness; a smooth weighted scheduler interleaves shares rather than sending every slot for one server consecutively. Calibrate weights using the actual workload, not CPU count alone.",
    "whenToUse": "Use for broadly similar request costs and stable, measured relative backend capacity.",
    "avoid": "Avoid expecting static weights to react to a garbage-collection pause, dependency slowdown, or a hot request class.",
    "walkthrough": "For A:B:C weights 3:2:1, a six-slot illustrative schedule A,B,A,C,B,A gives counts 3,2,1. This is a teaching schedule, not a promise about any product's exact ordering.",
    "diagram": "Eligible set → equal cycle or weighted shares → observe per-backend saturation",
    "example": "Worked allocation:\n600 equal-cost requests, weights A=3 B=2 C=1\nExpected shares: A=300 B=200 C=100\nIf A's requests cost 10× more, those counts are no longer equal work.\nIf C becomes ineligible, recalculate shares among A and B.",
    "exercise": "Compute shares for weights 5:3:2 over 1,000 requests; explain what changes when the weight-5 node drains.",
    "quiz": "Does a 50% configured share guarantee 50% of CPU usage?",
    "answer": "No. Weights allocate routing opportunities, not processor time. Request cost, retries, caching, and downstream latency can differ even with identical request counts.",
    "practiceProblems": "Explain the normal decision, trace a failure, and identify a measurement that would invalidate the policy."
  },
  {
    "title": "3. Least connections and weighted least connections",
    "lesson": "Least connections chooses a backend with fewer active connections. Weighted least connections normalizes that signal by configured capacity; active/weight is a useful conceptual score, though product details and tie-breaking differ. Count admission and completion consistently and handle cancellation. For request-multiplexing protocols, a least-outstanding-request policy may be more informative. Each proxy may have only a local view of load; several independent proxies can all chase an apparently empty node.",
    "whenToUse": "Use when connection duration varies and active connections correlate with the constrained resource.",
    "avoid": "Avoid using raw socket counts for workloads dominated by multiplexed streams or very unequal per-connection costs.",
    "walkthrough": "A has 18 active connections and weight 6; B has 8 and weight 2. Raw least connections chooses B. Normalized scores are 3 and 4, so the weighted conceptual policy chooses A.",
    "diagram": "Active counts + capacity weights → normalize → smallest eligible score",
    "example": "Worked comparison:\nA: active=18, weight=6, score=3\nB: active=8, weight=2, score=4\nC: active=0, weight=1, draining=true → excluded\nChoose A under the normalized policy.\nRelease its reservation on completion or cancellation.",
    "exercise": "Recalculate after A gains six connections. Define a stable or randomized tie-break without claiming one universal implementation.",
    "quiz": "Why must eligibility be checked before comparing load?",
    "answer": "A draining or unhealthy server can look least loaded precisely because it accepts no useful work. Ranking it first would defeat removal and prolong failure.",
    "practiceProblems": "Explain the normal decision, trace a failure, and identify a measurement that would invalidate the policy."
  },
  {
    "title": "4. Least response time and power of two choices",
    "lesson": "Latency-aware policies incorporate observed response time, often with another load signal. Specify whether the measurement covers connection setup, first byte, or the full response, and how failures and old samples are treated. A server returning immediate errors can appear fast. Power of two choices samples two eligible candidates and selects the better one using a defined score; it does not require finding a fleet-wide minimum. Random sampling reduces synchronized selection but does not eliminate overload or stale measurements.",
    "whenToUse": "Use latency feedback when representative measurements are available, or two-choice selection when inexpensive decentralized decisions are valuable.",
    "avoid": "Avoid routing everything to the latest fastest sample or comparing fast errors with successful responses as equivalent work.",
    "walkthrough": "A reports 15 ms but 40% errors; B reports 45 ms with healthy success. Remove or penalize failing A under the health policy before applying latency preference. With sampled healthy candidates B and C, compare only their defined scores.",
    "diagram": "Health filter → sample two candidates → compare score → admit bounded work",
    "example": "Decision trace (illustrative):\nCandidates B: outstanding=7; C: outstanding=3 → choose C.\nUnsampled D: outstanding=0 → not examined on this decision.\nOne eligible backend → choose it if below admission limit.\nZero eligible backends → fail within caller budget.",
    "exercise": "Design a latency window, minimum sample count, and recovery probe policy that does not permanently starve a recovered backend.",
    "quiz": "Does power of two choices always select the least-loaded server?",
    "answer": "No. It selects the better of the sampled candidates. This trades exact global optimization for a cheap distributed decision; its outcome still depends on the score and workload.",
    "practiceProblems": "Explain the normal decision, trace a failure, and identify a measurement that would invalidate the policy."
  },
  {
    "title": "5. IP hash and consistent hashing",
    "lesson": "Hash-based routing preserves affinity to a key instead of optimizing instantaneous load. IP affinity can concentrate an office behind one NAT address and change when a mobile client changes networks. A simple modulo over backend count remaps many keys when membership changes. A consistent-hash ring assigns a key to its next token, wrapping at the end; adding a token changes only its predecessor interval. Virtual nodes spread ownership, but neither they nor consistent hashing split one hot key automatically. Routing affinity does not replicate session state or move cached data.",
    "whenToUse": "Use keyed affinity for a measured locality benefit with explicit state-loss and membership-change behavior.",
    "avoid": "Avoid treating an IP address as user identity or sticky routing as a durability guarantee.",
    "walkthrough": "On an illustrative ring 0–99, A is at 10, B at 50, and C at 90. Add D at 70: keys in (50,70] move from C to D, while key 95 still wraps to A. Actual remapping depends on token positions and key distribution.",
    "diagram": "Hash key → next clockwise token → owner\nAdd D at 70 → move interval (50,70] → keep other owners",
    "example": "Manual ring trace:\nTokens: A=10, B=50, C=90\nkey 5 → A; key 35 → B; key 65 → C; key 95 → A\nInsert D=70:\nkey 65 → D; keys 5,35,95 keep their owners\nA hot key 65 still goes to one owner.",
    "exercise": "Remove B and list which interval changes owner. Explain how session recovery differs from cache warming.",
    "quiz": "Does a stable hash placement mean the destination already has the data?",
    "answer": "No. Placement selects an owner. Replication, migration, cache refill, session recovery, and failure consistency remain separate responsibilities.",
    "practiceProblems": "Explain the normal decision, trace a failure, and identify a measurement that would invalidate the policy."
  },
  {
    "title": "6. Health, draining, and a tested routing model",
    "lesson": "Separate eligibility, selection, and admission. Health checks and passive error evidence influence eligibility; routing selects from that set; concurrency limits and bounded queues control admission. Drain a backend by stopping new assignments, allowing existing work to finish within a deadline, then terminating with a defined reconnect policy. Retries need a shared budget and safe operation identity because a disconnected request may already have committed. Test overload and slow recovery, not only healthy distribution.",
    "whenToUse": "Use a deterministic model to validate routing boundaries before a canary on realistic traffic.",
    "avoid": "Avoid describing a single-process model as proof of distributed counters, race freedom, or production throughput.",
    "walkthrough": "The executable example filters C because it is draining, selects A by normalized load, and verifies both ring wraparound and the exact interval moved by D. It is a standalone Node.js 20+ model with no dependencies or network.",
    "diagram": "Healthy and not draining → score → admission limit → backend\nDrain → stop new work → finish or deadline → remove",
    "exampleRuntime": "Node.js 20+; standalone deterministic model",
    "example": "import assert from 'node:assert/strict';\nfunction choose(nodes) {\n  const eligible = nodes.filter(n => n.healthy && !n.draining &&\n    Number.isFinite(n.weight) && n.weight > 0 &&\n    Number.isFinite(n.active) && n.active >= 0 &&\n    Number.isFinite(n.limit) && n.active < n.limit);\n  return eligible.reduce((best, n) =>\n    !best || n.active / n.weight < best.active / best.weight\n      ? n : best, null)?.id ?? null;\n}\nconst nodes = [\n  {id:'A', active:18, weight:6, limit:30, healthy:true, draining:false},\n  {id:'B', active:8, weight:2, limit:20, healthy:true, draining:false},\n  {id:'C', active:0, weight:1, limit:20, healthy:true, draining:true},\n];\nassert.equal(choose(nodes), 'A');\nassert.equal(choose([]), null);\nassert.equal(choose(nodes.map(n => ({...n, healthy:false}))), null);\nassert.equal(choose(nodes.map(n => ({...n, limit:0}))), null);\nassert.equal(choose([{...nodes[0], weight:0}]), null);\nassert.equal(choose([{...nodes[0], active:-1}]), null);\nfunction owner(key, ring) {\n  if (!Number.isInteger(key) || key < 0 || key >= 100 || !ring.length)\n    throw new Error('Expected a key in 0..99 and a nonempty ring');\n  // Fixture tokens are unique, valid, and sorted; no hash function is simulated.\n  return (ring.find(token => token.at >= key) ?? ring[0]).id;\n}\nconst before = [{id:'A',at:10},{id:'B',at:50},{id:'C',at:90}];\nconst after = [...before, {id:'D',at:70}].sort((a,b) => a.at-b.at);\nassert.equal(owner(95, before), 'A');\nassert.equal(owner(65, after), 'D');\nfor (let key=0; key<100; key++) {\n  assert.equal(owner(key,before) !== owner(key,after), key > 50 && key <= 70);\n}\nassert.throws(() => owner(5, []));\nconsole.log('Routing boundaries passed');",
    "exercise": "Save the example as routing.mjs and run node routing.mjs. Add tests for a tie, one eligible server, and admission at exactly the configured limit.",
    "quiz": "Why is selecting an eligible server insufficient to prevent overload?",
    "answer": "Eligibility says it can serve, not that it has unlimited capacity. Admission must reserve bounded capacity consistently. Across proxies, local counters alone cannot enforce a global server limit.",
    "practiceProblems": "Explain the normal decision, trace a failure, and identify a measurement that would invalidate the policy."
  }
];
