// Fixed decision traces, not executions of Kubernetes, PostgreSQL, collectors, or LLMs.
const trace = (id, title, question, lanes, scenarios) => ({
  id, title, question, lanes, scenarios, kind: 'trace',
  scope: 'A scripted teaching trace, not a live deployment. Values are illustrative; verify the corresponding contract in your environment.',
});

export const PRODUCTION_COURSE_DEMOS = {
  podDrain: trace('podDrain', 'One termination budget, including preStop',
    'Who still owns unfinished work when the grace period ends?', ['Elapsed', 'Admission', 'Owner'], [
      { label: 'Owner finishes in budget', steps: [
        ['Termination starts', 'Endpoint withdrawal can race with local traffic; the total grace period is 45 seconds.', ['0s', 'closing', 'running']],
        ['Hook finishes', 'An 8-second preStop hook consumes the same budget, leaving 37 seconds.', ['8s', 'closed', 'draining']],
        ['Owner confirms completion', 'The owner finishes before resource cleanup and process exit.', ['38s', 'closed', 'confirmed']],
      ] },
      { label: 'Owner exceeds budget', steps: [
        ['Termination starts', 'Do not release ownership while the old process can still perform effects.', ['0s', 'closing', 'running']],
        ['Hook finishes', 'The hook did not extend the grace period.', ['8s', 'closed', 'draining']],
        ['Grace expires', 'Forced termination does not prove failure. Recover through fencing and reconciliation before repeating effects.', ['45s', 'closed', 'unknown; recover']],
      ] },
    ]),
  migrationOwnership: trace('migrationOwnership', 'Cutover transfers write authority only after proof',
    'Why is routing back unsafe after the target accepts a new write?', ['Source', 'Target', 'Decision'], [
      { label: 'Gated cutover', steps: [
        ['Copy and stream', 'One coordinated copy/stream boundary prevents gaps; source remains the writer.', ['writable', 'read-only', 'catch up']],
        ['Fence and verify', 'Drain every source writer; check final apply position, sequences, schema, and data.', ['fenced', 'read-only', 'validate']],
        ['Open target writes', 'Only the validated target becomes writable.', ['fenced', 'writable', 'promote']],
      ] },
      { label: 'Incident after target commit', steps: [
        ['Target owns writes', 'The old source remains fenced.', ['fenced', 'writable', 'observe']],
        ['Order 901 commits', 'The old source does not contain the new target-side order.', ['stale', '901 committed', 'incident']],
        ['Do not route back', 'Fence and drain target writes first. Reconcile or reverse-replicate and validate before any ownership transfer.', ['stale', 'fenced', 'reconcile; no blind rollback']],
      ] },
    ]),
  collectorCapacity: trace('collectorCapacity', 'A bounded telemetry queue cannot cover every outage',
    'What happens after the configured queue or retry retention is exhausted?', ['Backend', 'Queue / capacity', 'Outcome'], [
      { label: 'Recovery within capacity', steps: [
        ['Backend slows', 'This model uses a volatile queue of two batches.', ['unavailable', '0 / 2', 'buffer']],
        ['Buffer two batches', 'Memory and retention are bounded; no third slot exists.', ['unavailable', '2 / 2', 'at capacity']],
        ['Backend recovers', 'The process survived and the backend acknowledged both retained batches.', ['available', '0 / 2', 'delivered']],
      ] },
      { label: 'Outage exceeds capacity', steps: [
        ['Backend slows', 'A bounded volatile queue cannot guarantee durable delivery.', ['unavailable', '0 / 2', 'buffer']],
        ['Buffer two batches', 'A finite queue only delays pressure.', ['unavailable', '2 / 2', 'at capacity']],
        ['Third batch arrives', 'This configured drop-on-full model loses the new batch; measure drops and size a finite outage budget.', ['unavailable', '2 / 2', '1 batch dropped']],
      ] },
    ]),
  artifactPromotion: trace('artifactPromotion', 'Verify and promote the same immutable artifact',
    'Which digest must the deployment reference after verification?', ['Candidate', 'Evidence', 'Promotion'], [
      { label: 'Verified digest', steps: [
        ['Build artifact', 'A digest identifies exact bytes; a mutable tag does not.', ['digest A', 'not verified', 'blocked']],
        ['Check policy', 'Verify signer, provenance subject, expected builder, and vulnerability policy for A.', ['digest A', 'A approved', 'eligible']],
        ['Deploy exact bytes', 'Promote the approved digest without rebuilding or resolving a mutable tag.', ['digest A', 'A approved', 'deploy A']],
      ] },
      { label: 'Tag moves after verification', steps: [
        ['Verify original image', 'Policy evidence is bound to digest A.', ['digest A', 'A approved', 'eligible']],
        ['Tag points elsewhere', 'A later tag lookup resolves to unverified digest B.', ['digest B', 'A approved', 'blocked']],
        ['Refuse substitution', 'Verify B separately or deploy the originally approved A; never transfer evidence between digests.', ['digest B', 'B unverified', 'do not deploy B']],
      ] },
    ]),
  llmToolAuthority: trace('llmToolAuthority', 'Model output is a proposal, not authorization',
    'Where must tenant ownership be enforced even when an answer sounds correct?', ['Model proposal', 'Server check', 'Effect'], [
      { label: 'Authorized read', steps: [
        ['Suggest lookup', 'The model proposes reading order O7; it does not choose the authenticated principal.', ['read O7', 'pending', 'none']],
        ['Check ownership', 'The server checks the operation allowlist and tenant-scoped resource ownership.', ['read O7', 'owner authorized', 'none']],
        ['Return scoped data', 'Only the permitted fields from the authorized tenant are returned.', ['read O7', 'allowed', 'scoped read']],
      ] },
      { label: 'Injected cross-tenant request', steps: [
        ['Untrusted text proposes lookup', 'Retrieved text asks for another tenant’s order. Treat it as data, not authority.', ['read O9', 'pending', 'none']],
        ['Ownership check fails', 'A plausible tool call does not override the authenticated principal.', ['read O9', 'wrong tenant', 'none']],
        ['Deny and record', 'Do not call the downstream tool or expose the other tenant’s data.', ['read O9', 'denied', 'none']],
      ] },
    ]),
};

export const PRODUCTION_DEMO_ASSIGNMENTS = {
  'kubernetes-java-production': ['podDrain'],
  'postgres-zero-downtime-migrations': ['migrationOwnership'],
  'opentelemetry-collector-production': ['collectorCapacity'],
  'java-container-supply-chain-security': ['artifactPromotion'],
  'production-llm-evals-guardrails': ['llmToolAuthority'],
};
