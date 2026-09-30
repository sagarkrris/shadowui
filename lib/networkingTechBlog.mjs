export const NETWORKING_BLOG = {
  id: 'java-service-networking',
  title: 'Production Networking for Java Services: DNS, TLS, HTTP, Proxies, and Deadlines',
  category: 'Java service networking',
  javaRelease: 17,
  summary: 'A practical Java 17 course for tracing one remote call from name resolution to a trustworthy response without hiding stale addresses, unsafe retries, proxy trust, or exhausted deadlines.',
  lessons: [
    'A remote call crosses several independently cached and timed boundaries: DNS, address selection, connection establishment, TLS, HTTP, and application processing.',
    'Connection loss describes transport state, not business outcome. Retry only when the operation contract and stable identity make repetition safe.',
    'Forwarded metadata is trustworthy only across an explicitly trusted proxy boundary, and every child timeout must fit inside the caller’s remaining deadline.',
  ],
  sections: [
    { heading: 'Course goal', body: 'Diagnose and design the complete path of an outbound Java service call. The examples use deterministic Java 17 decision models so DNS expiry, dual-stack fallback, certificate rejection, replay safety, proxy trust, and deadline exhaustion can be tested without depending on a live network.' },
    { heading: 'Production lens', body: 'Network success is layered evidence. Resolving a name does not prove a route, opening a socket does not authenticate the peer, completing TLS does not authorize the request, and losing an HTTP response does not prove the operation failed. Preserve those distinctions in code, telemetry, and incident language.' },
  ],
  example: 'service name → DNS answer → address race → transport connection → TLS identity → HTTP exchange → application outcome',
  interviewQuestions: [
    'Why can a DNS change be correct while some clients still reach the old address?',
    'What does a client know after a POST body was sent but the connection closed before a response?',
    'How should a service divide one caller deadline among connection setup and response processing?',
  ],
  practice: 'Trace one outbound payment call. Name every cache, timeout, trust boundary, retry owner, stable operation identity, and phase-specific signal from DNS lookup through the final business outcome.',
  capstone: {
    title: 'Capstone: Move a payment endpoint without duplicate charges',
    scenario: 'A Java checkout service moves its payment dependency to dual-stack infrastructure behind a new proxy. During rollout, some clients retain old DNS answers, IPv6 is intermittently unreachable, and a response can disappear after the provider receives a charge.',
    steps: [
      'Define DNS TTL and connection-pool retirement behavior, then race eligible address families within one connection budget instead of multiplying timeouts.',
      'Keep normal hostname and certificate verification, establish the exact trusted proxy hop, and reject untrusted forwarded identity metadata.',
      'Propagate remaining time across process boundaries and derive a local monotonic deadline at each hop. Retry only with the original payment identity under a documented provider contract, and reconcile every ambiguous outcome before issuing another effect.',
    ],
    outcome: 'Produce a migration and incident model that separates routing, peer identity, transport completion, and business completion while keeping latency and duplicate effects bounded.',
  },
};

export const NETWORKING_CHAPTERS = [
  {
    title: '1. Treat DNS as cached routing data',
    lesson: 'A resolver returns records with a cache lifetime; changing authoritative data does not invalidate answers already cached elsewhere. Expired records must be refreshed, and negative answers can also be cached. DNS success proves only that records were returned. It does not prove that an address is reachable, healthy, or owned by the expected application. During a migration, coordinate record lifetime with connection-pool retirement because an already-open connection can outlive the lookup that selected it.',
    whenToUse: 'Use explicit DNS lifetime and connection-retirement reasoning for endpoint migrations, failover, and incident diagnosis.',
    avoid: 'Avoid describing a DNS update as an instantaneous global switch or treating lookup success as a service health check.',
    diagram: 'service name → cached answer before expiry → selected addresses\nexpired or absent answer → resolver refresh → new cache lifetime',
    example: `final class DnsCacheDecisionExample {
  enum Action { USE_CACHED_ANSWER, RESOLVE_AGAIN }
  static long expiresAt(long resolvedAtMillis, long ttlMillis) {
    if (resolvedAtMillis < 0 || ttlMillis < 0) throw new IllegalArgumentException();
    return Math.addExact(resolvedAtMillis, ttlMillis);
  }
  static Action action(long nowMillis, long expiresAtMillis) {
    if (nowMillis < 0 || expiresAtMillis < 0) throw new IllegalArgumentException();
    return nowMillis < expiresAtMillis ? Action.USE_CACHED_ANSWER : Action.RESOLVE_AGAIN;
  }
}`,
    exercise: 'Plan a DNS migration from address A to B. State the positive and negative cache lifetimes, when old pooled connections retire, and how you will detect clients that still reach A.',
    quiz: 'Why can traffic continue to an old address after the authoritative DNS record changes?',
    answer: 'Resolvers and clients can use an unexpired cached answer, and an open pooled connection can continue serving requests without another lookup. The migration must account for both cache lifetime and connection lifetime.',
  },
  {
    title: '2. Share one connection budget across address candidates',
    lesson: 'A hostname can yield IPv6 and IPv4 candidates. Waiting for one family to consume the entire connect timeout before trying the other produces avoidable delay. A dual-stack connector can start a preferred candidate, launch a fallback after a short delay, and keep the first successful connection while cancelling the rest. The attempts still share one caller budget and a bounded attempt count; this is a race for reachability, not permission to create unbounded sockets.',
    whenToUse: 'Use bounded address-family fallback when clients operate across mixed IPv4 and IPv6 networks.',
    avoid: 'Avoid serial full-timeout attempts or launching every returned address without a shared deadline and connection bound.',
    diagram: 'DNS candidates → start preferred address at t0\nno connection yet → start alternate after bounded delay → keep first success → cancel losers',
    example: `final class AddressRaceExample {
  static int[] launchDelays(boolean hasIpv6, boolean hasIpv4, int fallbackDelayMillis, int connectBudgetMillis) {
    if (fallbackDelayMillis < 10 || connectBudgetMillis < 1) throw new IllegalArgumentException();
    if (!hasIpv6 && !hasIpv4) return new int[0];
    if (!hasIpv6 || !hasIpv4 || fallbackDelayMillis >= connectBudgetMillis) return new int[]{0};
    return new int[]{0, fallbackDelayMillis};
  }
}`,
    exercise: 'Given a 600 ms connection budget and both address families, choose a fallback delay and maximum number of simultaneous attempts. Explain what is cancelled after one connection wins.',
    quiz: 'Why should IPv4 and IPv6 attempts share one connection budget?',
    answer: 'Giving each candidate a fresh full timeout can multiply latency and socket pressure beyond the caller deadline. A shared budget bounds total setup time while a delayed race avoids waiting for a broken preferred path.',
  },
  {
    title: '3. Keep TLS identity verification intact',
    lesson: 'TLS protects a connection only when certificate-chain validation, validity checks, and hostname verification succeed under the client’s trust policy. Encryption without peer identity can establish a private channel to the wrong endpoint. Do not repair a certificate incident by installing a trust-all verifier. Rotate certificates and trust roots with overlap, observe expiry, and test the same hostname and Server Name Indication path used in production.',
    whenToUse: 'Use platform hostname and chain verification for every TLS service boundary, including calls through a proxy or service mesh.',
    avoid: 'Avoid custom trust-all managers, disabled hostname checks, or a private certificate authority shared more broadly than its intended trust domain.',
    diagram: 'connected socket → TLS handshake → validate chain + time + hostname → authenticated channel\nany identity check fails → reject connection',
    example: `final class TlsIdentityDecisionExample {
  enum Decision { ACCEPT, REJECT }
  static Decision decide(boolean trustedChain, boolean withinValidity, boolean hostnameMatches) {
    return trustedChain && withinValidity && hostnameMatches ? Decision.ACCEPT : Decision.REJECT;
  }
}`,
    exercise: 'Write a certificate rotation plan with overlap, expiry alerts, hostname coverage, rollback, and a negative test for the wrong service name.',
    quiz: 'Why is an encrypted connection still unsafe when hostname verification is disabled?',
    answer: 'Encryption can protect bytes sent to an attacker-controlled endpoint. Hostname verification binds the authenticated certificate identity to the service name the client intended to reach.',
  },
  {
    title: '4. Separate HTTP transport loss from operation outcome',
    lesson: 'Persistent HTTP connections reduce repeated setup, but either peer can close an idle or draining connection. If a connection disappears before any request bytes are sent, a safe operation may be attempted elsewhere. If a write body may have reached the server and the response is lost, the business outcome is unknown. A key alone does not make a write safe to repeat. Replay requires the same key and payload, a provider contract that atomically deduplicates concurrent attempts and effects, and retention covering the retry. If any guarantee is absent or expired, reconcile with the authority. These decisions classify replay safety; attempts still need a bounded deadline and retry budget.',
    whenToUse: 'Use explicit replay and reconciliation decisions for every remote write that can outlive its response connection.',
    avoid: 'Avoid retrying every connection reset as a fresh POST or assuming that a missing response proves the server did nothing.',
    diagram: 'request not sent → safe attempt within budget\nrequest may be processed + response lost → UNKNOWN → same identity lookup or reconciliation',
    example: `final class HttpRetryDecisionExample {
  enum Operation { SAFE_READ, IDEMPOTENT_WRITE, NON_IDEMPOTENT_WRITE }
  enum Action { REPEAT_OPERATION, REPEAT_WITH_STABLE_KEY, RECONCILE }
  record ReplayContract(boolean sameKeyAndPayload, boolean atomicProviderDeduplication,
                        boolean retentionCoversRetry) {
    boolean permitsReplay() {
      return sameKeyAndPayload && atomicProviderDeduplication && retentionCoversRetry;
    }
  }
  static Action afterLostResponse(Operation operation, ReplayContract contract) {
    if (operation == null || contract == null) throw new IllegalArgumentException();
    return switch (operation) {
      case SAFE_READ, IDEMPOTENT_WRITE -> Action.REPEAT_OPERATION;
      case NON_IDEMPOTENT_WRITE -> contract.permitsReplay() ? Action.REPEAT_WITH_STABLE_KEY : Action.RECONCILE;
    };
  }
}`,
    exercise: 'Classify a profile GET, inventory reservation, and payment capture after the response connection resets. Name the retry identity and authoritative reconciliation query for each write.',
    quiz: 'What can a client conclude when a connection closes after it sent a payment request but before it received a response?',
    answer: 'Only that the response was not received. The provider might not have processed the request, might still be processing it, or might have committed it. Preserve the original operation identity and reconcile rather than creating a new effect.',
  },
  {
    title: '5. Trust forwarded metadata only from known proxies',
    lesson: 'A reverse proxy terminates one connection and creates another, so the application sees the proxy as its direct peer. Forwarded client addresses and scheme information are claims supplied on the new hop. Accept them only when the direct peer is a trusted proxy that overwrites untrusted incoming values. Use authenticated principal and resource ownership for authorization; a client address remains routing or risk evidence, not identity proof. This boundary model accepts already-parsed InetAddress values from the server or trusted framework adapter, never raw header strings. The adapter must reject malformed IP literals and unsupported forwarding chains without DNS resolution; do not call InetAddress.getByName on an untrusted header. Compute proxy trust from the actual socket peer and configured trusted networks, not a request parameter.',
    whenToUse: 'Use a narrow trusted-proxy list and framework-supported forwarded-header processing behind controlled load balancers or gateways.',
    avoid: 'Avoid trusting X-Forwarded-For from arbitrary peers, appending to unsanitized chains, or authorizing tenant access from a network address.',
    diagram: 'client headers → trusted proxy strips and rewrites → application evaluates trusted hop\nuntrusted direct peer → ignore forwarded claims',
    example: `final class ProxyBoundaryExample {
  // Address parsing belongs to the server/framework adapter, not a character whitelist.
  static java.net.InetAddress clientAddress(java.net.InetAddress directPeer,
      java.net.InetAddress forwardedAddress, boolean directPeerIsTrustedProxy) {
    if (directPeer == null) throw new IllegalArgumentException();
    if (!directPeerIsTrustedProxy) return directPeer;
    if (forwardedAddress == null) throw new IllegalArgumentException();
    return forwardedAddress;
  }
}`,
    exercise: 'Draw the exact proxy chain for one endpoint. Mark which hop removes incoming forwarding headers, which peers are trusted, and which identity is used for authorization.',
    quiz: 'Why must an application know its direct peer before trusting a forwarded client address?',
    answer: 'Any direct client can send a forwarding header. The claim becomes meaningful only when a controlled proxy is the direct peer and is configured to replace untrusted values with information derived from the connection it accepted.',
  },
  {
    title: '6. Propagate deadlines and diagnose by phase',
    lesson: 'A connect timeout covers connection establishment; it is not a complete request deadline. DNS, address fallback, TLS, pool acquisition, request upload, server work, and response download all consume the caller’s budget. Derive each child timeout from a monotonic remaining deadline, reserve time for returning the result, and stop launching work when no usable budget remains. Emit bounded phase and outcome labels so an incident can separate lookup, connect, TLS, first-byte, and application failures without logging secrets or high-cardinality addresses.',
    whenToUse: 'Use one propagated deadline and phase-specific telemetry for every synchronous dependency path.',
    avoid: 'Avoid independent per-layer timeouts whose sum exceeds the caller budget, unbounded retries, or metrics labeled with hostnames, IPs, user IDs, or raw exception text.',
    diagram: 'caller deadline → remaining budget → bounded child timeout + response reserve\nno usable time → do not start\nphase outcome → low-cardinality metrics + correlated trace',
    example: `final class DeadlineBudgetExample {
  // Nonnegative elapsed milliseconds relative to one fixed, process-local origin.
  // Do not send an absolute monotonic timestamp to another process.
  static long childTimeoutMillis(long nowMillis, long deadlineMillis, long reserveMillis, long maxChildMillis) {
    if (nowMillis < 0 || deadlineMillis < 0 || reserveMillis < 0 || maxChildMillis < 1) throw new IllegalArgumentException();
    if (deadlineMillis <= nowMillis) return -1;
    long remaining = deadlineMillis - nowMillis;
    if (remaining <= reserveMillis) return -1;
    return Math.min(remaining - reserveMillis, maxChildMillis);
  }
}`,
    exercise: 'For a 900 ms caller deadline, allocate bounded setup and response budgets, then define phase labels and the exact point where a retry is refused.',
    quiz: 'Why is a 500 ms connect timeout unsafe inside a request with only 300 ms remaining?',
    answer: 'The child can outlive its caller and consume capacity for a result nobody can use. Its timeout must be capped by the remaining deadline after reserving time to propagate or process the result.',
  },
];
