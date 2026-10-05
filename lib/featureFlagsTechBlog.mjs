export const FEATURE_FLAGS_BLOG = {
  id: 'java-feature-flags-production',
  title: 'Java Feature Flags: Targeting, Rollout, and Safe Retirement',
  category: 'Java service delivery',
  javaRelease: 17,
  sourceUrl: 'https://openfeature.dev/specification/sections/evaluation-context/',
  summary: 'A practical Java 17 course on treating a feature flag as a versioned delivery decision with trusted context, stable cohorts, explicit failure policy, and a removal owner.',
  lessons: [
    'A flag selects behavior; it does not authenticate a caller or grant access to a resource.',
    'Targeting needs a trusted, privacy-reviewed subject key and deterministic assignment so one subject does not oscillate between variants.',
    'A rollout is a versioned change with an owner, expiry, signals, rollback path, and eventual code removal.',
  ],
  sections: [
    { heading: 'Course goal', body: 'Design flag evaluation that changes a bounded behavior safely without turning client claims, cache staleness, or a control-plane outage into an invisible correctness problem.' },
    { heading: 'Example scope', body: 'The standalone Java 17 examples are deterministic decision models. They do not implement an OpenFeature provider, cryptographic identity verification, a distributed flag store, or a production audit system.' },
    { heading: 'Stable bucket versus stable behavior', body: 'The same flag key, cohort version, and subject preserve the bucket. The variant also depends on the percentage and targeting rules: bucket 62 is disabled at 62% and enabled at 63%. A retry evaluated against changed rules can select another variant. Persist the original decision with a durable operation when its retries must keep the same behavior.' },
  ],
  example: 'authenticated principal + versioned rule → deterministic variant → guarded behavior → signals + rollback → retirement',
  interviewQuestions: [
    'Why must a feature flag never be the authorization decision for a protected resource?',
    'What makes a percentage rollout stable for a customer across retries and replicas?',
    'How do you decide whether a stale flag snapshot is safer than a fallback during a control-plane outage?',
  ],
  practice: 'Choose one reversible behavior change. Define its trusted targeting context, cohort calculation, default and outage policy, metrics, rollback owner, expiry, and the condition that deletes the flag.',
  capstone: {
    title: 'Capstone: Roll out a new receipt renderer without changing money or access rules',
    scenario: 'A Java checkout service introduces a new receipt renderer for a small customer cohort. Clients retry requests, replicas update at different times, and the flag service can time out. The renderer must never decide which receipts a customer may read or whether a payment is accepted.',
    steps: [
      'Define one versioned flag with an authenticated tenant or account targeting key, an explicit default, a percentage cohort algorithm, an owner, an expiry, and a removal ticket.',
      'Evaluate once at the request boundary and pass the immutable decision to rendering. Keep receipt authorization and payment state at their owning services, regardless of the variant.',
      'Canary with bounded, non-sensitive outcome metrics and an exact rollback action. Specify the maximum snapshot age, outage behavior, reconciliation evidence, and when old-path code is deleted.',
    ],
    outcome: 'A reversible presentation rollout whose targeting stays stable, whose uncertainty is observable, and whose control never substitutes for authorization or durable business state.',
  },
};

export const FEATURE_FLAGS_CHAPTERS = [
  { title: '1. Give every flag a bounded delivery contract', lesson: 'A feature flag is a named runtime decision that selects an already-authorized behavior. Give it a type, default, owner, purpose, target scope, expiry, and removal condition before reading it in application code. Keep it separate from authentication, authorization, pricing, or durable workflow state: an outage or accidental edit to a delivery control must not grant access, approve a payment, or rewrite a record. Evaluate at a deliberate boundary and pass the resulting variant to code that needs it rather than scattering raw key lookups.', whenToUse: 'Use a flag for a temporary, observable, reversible behavior choice such as a renderer, algorithm, or rollout route.', avoid: 'Avoid flags as long-lived permissions, emergency configuration with no owner, or a replacement for a durable state transition.', diagram: 'versioned flag contract → typed default + owner + expiry → one boundary evaluation → behavior choice\nflag result is not authorization', example: `final class FlagContractExample {
  record Flag(String key, boolean defaultValue, String owner, long expiresAt) {
    Flag { if (key == null || !key.matches("[a-z0-9-]{1,64}") || owner == null || owner.isBlank() || expiresAt < 1) throw new IllegalArgumentException(); }
  }
  static boolean mayUse(Flag flag, long now, Boolean resolved) {
    if (flag == null || now < 0) throw new IllegalArgumentException();
    return now >= flag.expiresAt() ? flag.defaultValue() : resolved == null ? flag.defaultValue() : resolved;
  }
}` , exercise: 'Write a flag record for a new receipt renderer: name the type, safe default, owner, expiry, audit fields, and the business decision that must remain outside the flag.', quiz: 'Why is a flag value not an authorization decision?', answer: 'A flag controls delivery behavior and can be changed, stale, or unavailable. Authorization must still load the owned resource and check the authenticated principal, action, tenant, and current resource state.' },
  { title: '2. Target only with trusted, minimal context', lesson: 'Targeting uses evaluation context, so choose fields supplied by an authenticated boundary: a stable account ID, tenant, plan, or deployment region—not a browser-provided role, query parameter, or display name. A targeting key should identify the intended subject consistently across retries and replicas. Minimize and classify context because providers or telemetry hooks may process it; do not send secrets, raw tokens, or unnecessary personal data. Validate optional attributes and give missing targeting data an explicit default rather than silently widening a rollout.', whenToUse: 'Use trusted, minimized context when a rollout must reach a deliberate cohort or a provider supports rule-based evaluation.', avoid: 'Avoid client-supplied identity claims, mutable display fields, and targeting on sensitive data without a reviewed privacy and retention contract.', diagram: 'authenticated boundary → stable subject key + allowed attributes → flag evaluation\nmissing/untrusted context → explicit default, not wider rollout', example: `final class TargetingContextExample {
  record Context(String accountId, String plan) {
    Context { if (accountId == null || !accountId.matches("[a-z0-9-]{1,64}") || plan == null || !plan.matches("[a-z-]{1,32}")) throw new IllegalArgumentException(); }
  }
  static boolean eligible(Context context, String requiredPlan) {
    if (context == null || requiredPlan == null || !requiredPlan.matches("[a-z-]{1,32}")) throw new IllegalArgumentException();
    return context.plan().equals(requiredPlan);
  }
}`, exercise: 'For tenant rollout, list which gateway-authenticated fields can enter evaluation context, which browser fields are forbidden, and the default when the stable subject key is missing.', quiz: 'Why is a display email address a poor percentage-rollout key?', answer: 'It can change, differ in formatting, or be missing. The same account could move cohorts across retries. Use a stable authenticated identifier and keep it out of high-cardinality metrics.' },
  { title: '3. Make percentage assignment deterministic and bounded', lesson: 'A percentage rollout needs one stable algorithm and a versioned salt so the same flag, cohort version, and subject select the same bucket on every replica. The sample uses a deterministic Java hash as a teaching model, not a cryptographic or cross-language standard; production teams must define and test an algorithm that all SDKs use. Change the cohort version deliberately when reallocation is intended. A missing subject must receive the documented default, not a random bucket. Percentage assignment determines exposure, not permission or experiment validity.', whenToUse: 'Use deterministic cohorts for canaries, experiments, or gradual delivery where repeatable exposure matters.', avoid: 'Avoid random-per-request assignment, modulo on a mutable identifier, or changing a hash algorithm without a migration and cohort version.', diagram: 'flag key + cohort version + stable subject → deterministic bucket → variant\nmissing subject → default; changed cohort version → intentional reallocation', example: `final class StableRolloutExample {
  static int bucket(String flagKey, String cohortVersion, String subject) {
    for (String value : new String[]{flagKey, cohortVersion, subject}) if (value == null || value.isBlank()) throw new IllegalArgumentException();
    return Math.floorMod((flagKey + "|" + cohortVersion + "|" + subject).hashCode(), 100);
  }
  static boolean enabled(String flagKey, String cohortVersion, String subject, int percent) {
    if (percent < 0 || percent > 100) throw new IllegalArgumentException();
    return bucket(flagKey, cohortVersion, subject) < percent;
  }
}`, exercise: 'Choose the cohort subject and version for a receipt-renderer canary. Explain why a retry stays assigned and what change deliberately rebalances the population.', quiz: 'Why must a rollout percentage not be recomputed with per-request randomness?', answer: 'A customer can see different behavior on retries, concurrent tabs, or different replicas. Stable assignment makes exposure debuggable and lets a rollback identify the affected cohort.' },
  { title: '4. Define stale snapshots and provider failure before rollout', lesson: 'Flag evaluation can fail because a provider is unavailable, a snapshot is too old, context is invalid, or the flag is missing. Decide per flag whether the safe outcome is the code default, a bounded last-known-good snapshot, or request rejection; do not hide failure by treating every error as enabled. A snapshot needs a version, fetch time, maximum age, and an atomic replacement boundary so one request does not mix rules. For user-visible presentation, a short stale snapshot may be acceptable; for a kill switch that protects a risky operation, fail closed may be safer. Neither choice fixes authorization or an already-started side effect.', whenToUse: 'Use explicit failure policy whenever a remotely managed flag can affect traffic during a control-plane outage.', avoid: 'Avoid unbounded stale caches, per-call network lookups on a hot path, or universal fail-open/fail-closed rules without a behavior-specific safety analysis.', diagram: 'provider result → atomically replace versioned snapshot → evaluate\nprovider failure + snapshot age → documented default / bounded stale / reject', example: `final class SnapshotDecisionExample {
  enum Decision { RESOLVED, USE_STALE, USE_DEFAULT, REJECT }
  static Decision decide(boolean providerAnswered, long snapshotAge, long maxAge, boolean staleAllowed, boolean rejectWhenUnknown) {
    if (snapshotAge < 0 || maxAge < 0) throw new IllegalArgumentException();
    if (providerAnswered) return Decision.RESOLVED;
    if (staleAllowed && snapshotAge <= maxAge) return Decision.USE_STALE;
    return rejectWhenUnknown ? Decision.REJECT : Decision.USE_DEFAULT;
  }
}`, exercise: 'For a presentation rollout and a payment-protection kill switch, define the default, maximum snapshot age, whether stale use is allowed, and the user-visible outage response.', quiz: 'Why is an old snapshot not automatically safer than a default?', answer: 'It can preserve a rollout or safety setting after policy has changed. Its acceptability depends on the flag’s behavior, maximum age, rollback needs, and whether the resource owner enforces a separate invariant.' },
  { title: '5. Roll out with one evaluation and observable rollback', lesson: 'Evaluate a request-scoped decision once at a boundary, record only bounded metadata such as flag key, rule version, variant, and outcome class, then pass that immutable decision through the request. This avoids a mid-request refresh rendering one response with two variants. A client cancellation does not erase work already accepted by an owner; if a flag changes an asynchronous command, the durable command must retain the chosen behavior or a versioned contract. Rollback changes future evaluations. It cannot undo durable effects, results already sent, or retries that lack stable operation identity. Compare a canary to a baseline using predeclared user-facing signals and stop thresholds.', whenToUse: 'Use a request-scoped decision and measured canary when variants can affect latency, errors, or user-visible output.', avoid: 'Avoid repeated evaluation inside one request, logging raw targeting context, or promising rollback reverses completed effects.', diagram: 'request boundary → immutable decision/version → render or enqueue → bounded outcome metric\nrollback → future decisions only; prior effects → reconcile', example: `final class RequestDecisionExample {
  record Decision(String flagKey, String ruleVersion, boolean enabled) {
    Decision { if (flagKey == null || ruleVersion == null || flagKey.isBlank() || ruleVersion.isBlank()) throw new IllegalArgumentException(); }
  }
  static String renderer(Decision decision) {
    if (decision == null) throw new IllegalArgumentException();
    return decision.enabled() ? "NEW_RENDERER" : "ESTABLISHED_RENDERER";
  }
}`, exercise: 'Trace a request that begins on the new renderer while the control plane rolls back. State what stays immutable, what future requests do, and which metrics are safe to emit.', quiz: 'Why does a rollback not make an already-completed asynchronous effect disappear?', answer: 'A rollback changes later evaluations only. The original owner may already have persisted or sent its effect. Keep a stable operation identity and reconcile durable outcomes instead of issuing a compensating action blindly.' },
  { title: '6. Retire flags and preserve operational evidence', lesson: 'Every flag accumulates branches, tests, dashboards, and possible configuration drift. Before expiry, decide from evidence whether to promote the established variant, roll back, or extend with a new owner and date. Remove the losing path, flag definition, provider rule, tests for the obsolete behavior, and unused metrics together; then keep the audit decision and release evidence according to policy. Do not delete a flag while delayed jobs, old clients, or persisted commands still require its versioned meaning. Alert on expired flags, evaluation errors, stale snapshots, unexpected default use, and cohort outcome divergence without attaching raw account identifiers.', whenToUse: 'Use a retirement checklist for every temporary release, experiment, migration, or kill switch after its operational window.', avoid: 'Avoid permanent flags with no owner, deleting context needed by in-flight durable work, or using high-cardinality subject identifiers as metrics labels.', diagram: 'expiry review → promote / rollback / extend owner → remove dead branch + rule + tests\ndelayed work needs old meaning → preserve versioned decision until drained', example: `final class FlagRetirementExample {
  enum Status { ACTIVE, EXPIRED, RETIRED }
  // removalVerified means the owner approved and verified removal of the
  // obsolete code, provider rule, and dependencies for this exact flag version.
  // It is authoritative evidence, never a request-supplied claim.
  static Status next(Status status, long now, long expiresAt,
      boolean delayedWorkNeedsRule, boolean removalVerified) {
    if (status == null || now < 0 || expiresAt < 0) throw new IllegalArgumentException();
    if (status == Status.RETIRED) return Status.RETIRED;
    if (now < expiresAt) return Status.ACTIVE;
    return removalVerified && !delayedWorkNeedsRule ? Status.RETIRED : Status.EXPIRED;
  }
}`, walkthrough: 'At expiry, no delayed work and no verified removal returns EXPIRED. Approval and verified removal for this exact flag version, with no remaining dependent work, allow RETIRED. The function classifies supplied evidence; the resource owner must serialize dependency checks and removal so a stale review cannot retire a rule that new work still needs.', exercise: 'Create a removal checklist for the receipt renderer: release owner, expiry review, old-code deletion, delayed work policy, dashboards, audit record, and proof that the default path is no longer needed.', quiz: 'Why can an expired flag remain present after a rollout is complete?', answer: 'Expiry triggers review. Even with no delayed work, the flag remains EXPIRED until its owner has approved and verified removal for that exact version. Delayed work or old requests may still need the decision that was chosen when they started. Preserve that versioned meaning until those owners drain, then remove obsolete branches and rules as one reviewed change.' },
];
