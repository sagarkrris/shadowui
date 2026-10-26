const sketch = (title, story, steps, layout = 'sequence') => ({ title, story, steps, layout });

export const INTERVIEW_ANSWER_SKETCHES = {
  tokens: sketch('Budget the request before you send it', 'A token limit is a request budget. Protect the current question and reserve space for the answer.', [
    ['Count the full packet', 'Use the selected model tokenizer and include message overhead.'],
    ['Reserve answer space', 'Keep a defined output allowance and headroom.'],
    ['Trim irrelevant history', 'Preserve the latest question; reduce old context first.'],
    ['Check factual support', 'A request that fits can still produce an incorrect answer.'],
  ]),
  prompt: sketch('Make the response contract testable', 'The prompt guides the model; application checks decide which proposed response is acceptable.', [
    ['Name the task and evidence', 'State what to use and what counts as a source.'],
    ['Define fields and bounds', 'Specify types, allowed values, and missing-evidence behavior.'],
    ['Validate the response', 'Check JSON shape, business rules, and source access.'],
    ['Stop or repair safely', 'Use bounded recovery; reject responses that remain invalid.'],
  ]),
  json: sketch('Validate model output in layers', 'Valid JSON is only the first check; the application still has to validate its meaning.', [
    ['Parse syntax', 'Reject text that is not valid JSON.'],
    ['Check types and fields', 'A string duration does not satisfy an integer contract.'],
    ['Check business bounds', 'Require an allowed duration and an authorized source.'],
    ['Reject safely', 'Do not coerce invalid proposals into actions.'],
  ]),
  embeddings: sketch('Treat similarity as a ranking signal', 'A cosine score compares compatible vectors. It is not a probability of truth.', [
    ['Represent query and source', 'Use the same embedding space and model version.'],
    ['Rank candidates', 'Use similarity to find passages worth checking.'],
    ['Evaluate against labels', 'Measure retrieval precision and recall on held-out queries.'],
    ['Verify evidence', 'Check authorization and whether the passage supports each claim.'],
  ]),
  filter: sketch('Filter access before selecting top-k', 'A private high-scoring result must not push an authorized result out of the shortlist.', [
    ['Apply trusted permissions', 'Exclude unauthorized notes before ranking.'],
    ['Rank allowed candidates', 'Sort a copy of the permitted set by relevance.'],
    ['Select top-k', 'Choose from authorized results only.'],
    ['Check the boundary', 'Test with a private high-score and allowed lower-score note.'],
  ]),
  rag: sketch('Trace a grounded answer to its evidence', 'A citation ID can exist while the cited passage fails to support the answer.', [
    ['Reproduce the request', 'Pin prompt, corpus, model, and policy versions.'],
    ['Inspect authorized retrieval', 'Check which passages actually entered the context.'],
    ['Compare claims to passages', 'Verify support claim by claim, not by ID alone.'],
    ['Separate the failing stage', 'Measure retrieval quality apart from answer quality.'],
  ]),
  cost: sketch('Calculate cost across retries', 'An estimate needs token counts, per-token rates, and expected attempts.', [
    ['Price one attempt', 'Add input-token and output-token costs.'],
    ['Include retry frequency', 'Multiply by expected attempts, including retry token usage.'],
    ['Scale by request volume', 'State the assumptions behind the total.'],
    ['Reconcile real usage', 'Add retrieval, infrastructure, and provider-specific charges.'],
  ]),
  coding: sketch('Prove the bug before accepting the patch', 'A focused regression example should fail on the old behavior and pass on the correction.', [
    ['Derive a failing case', 'Include the private high-score note and allowed lower-score note.'],
    ['Check the original behavior', 'Confirm the test exposes the incorrect empty result.'],
    ['Review the smallest fix', 'Filter by access before ranking; avoid shared-data mutation.'],
    ['Check adjacent cases', 'Inspect empty results, compatibility, and existing behavior.'],
  ]),
  agent: sketch('Add autonomy only when it earns its cost', 'Start from the simplest reliable path, then test whether model-directed choices improve outcomes.', [
    ['Define the task', 'List expected inputs, outputs, and hard boundaries.'],
    ['Build a fixed workflow', 'Use code-defined steps when the route is predictable.'],
    ['Measure the variable cases', 'Add agent choices only when they improve representative outcomes.'],
    ['Enforce limits outside the model', 'Scope tools, steps, authorization, and approval in application code.'],
  ]),
  timeout: sketch('Treat a timed-out write as unknown', 'The remote side effect may have succeeded even when the response was lost.', [
    ['Preserve operation identity', 'Bind the operation to actor, tenant, and approved payload version.'],
    ['Reconcile the outcome', 'Look up durable state or use provider idempotency.'],
    ['Compare payloads', 'Reject a changed payload that reuses the prior approval or key.'],
    ['Retry only when safe', 'Otherwise expose the unknown state for recovery.'],
  ]),
  selection: sketch('Choose a model against release gates', 'A better average does not make a candidate acceptable when it fails a hard requirement.', [
    ['Set gates first', 'Define quality, privacy, latency, and cost constraints.'],
    ['Use held-out paired cases', 'Keep prompts, corpus, and tool conditions controlled.'],
    ['Inspect segments and tails', 'Find privacy regressions and slow or weak request groups.'],
    ['Roll out with rollback', 'Monitor the complete system and preserve a known-good version.'],
  ]),
  injection: sketch('Keep authority in the application', 'Retrieved instructions and model proposals are untrusted inputs, even when they look convincing.', [
    ['Treat retrieved text as data', 'Do not let a document grant tool access.'],
    ['Constrain available actions', 'Use allowlists, typed arguments, and egress policy.'],
    ['Enforce the caller’s authority', 'Check identity and permissions outside the model.'],
    ['Test adversarially', 'Evaluate prompt attacks and verify the enforced boundary.'],
  ]),
};

export const SCENARIO_REVIEW_SKETCHES = {
  'rag-launch': sketch('From documents to a safe answer', 'The release path needs access checks, evidence checks, and a fallback for missing or stale content.', [
    ['Ingest with provenance', 'Keep stable IDs, versions, source locations, and trusted access metadata.'],
    ['Authorize before context', 'Filter by caller and recheck revocation before using passages.'],
    ['Measure retrieval and answers', 'Track recall, citation support, abstention, and end-to-end latency.'],
    ['Gate and recover', 'Invalidate stale caches and fall back when evidence is unavailable.'],
  ]),
  'eval-gate': sketch('A privacy failure blocks the release', 'The aggregate score improves, but the candidate violates a hard privacy gate.', [
    ['Reconcile the paired results', 'Separate unchanged cases, improvements, and regressions.'],
    ['Preserve the disclosure case', 'Trace the authorization, retrieval, cache, and tool boundary.'],
    ['Repair and add a regression check', 'Verify the disclosure case independently.'],
    ['Re-run the gate', 'Review representative segments before staged rollout.'],
  ]),
  'latency-spike': sketch('Find where usable-answer time goes', 'First-token speed, completed response time, and validated-result time measure different things.', [
    ['Trace the whole request', 'Measure queue, retrieval, prefill, decode, retries, and validation.'],
    ['Split by request shape', 'Compare input/output sizes and retry causes.'],
    ['Optimize the measured bottleneck', 'Reduce irrelevant context or excess output and recheck quality.'],
    ['Bound overload behavior', 'Use queue limits, cancellation, backpressure, and safe responses.'],
  ]),
  'duplicate-calendar': sketch('Recover from a timed-out calendar write', 'A timeout leaves the provider outcome unknown; a changed meeting time needs fresh approval.', [
    ['Persist the approved intent', 'Store actor, operation key, and canonical payload version.'],
    ['Mark timeout as unknown', 'Do not assume the provider failed to create the event.'],
    ['Reconcile before retry', 'Use provider lookup or idempotency when available.'],
    ['Escalate when ambiguous', 'If safe deduplication is unavailable, ask for recovery review.'],
  ]),
  'tuning-decision': sketch('Match the intervention to the failure', 'Separate missing evidence, format errors, and reasoning errors before changing the model.', [
    ['Keep the failure categories', 'Measure each cause without changing several variables at once.'],
    ['Repair evidence freshness', 'Use versioned retrieval for weekly policy changes.'],
    ['Enforce output contracts', 'Validate structure and business rules regardless of model choice.'],
    ['Evaluate remaining behavior gaps', 'Use held-out data before tuning or adding model routing.'],
  ]),
  'cache-review': sketch('Contain and repair a cross-tenant cache leak', 'Question-only cache keys can return one tenant’s answer to another tenant.', [
    ['Contain exposure', 'Disable and invalidate unsafe shared entries.'],
    ['Build a trusted cache scope', 'Use authenticated identity, effective access, and relevant versions.'],
    ['Recheck revocation paths', 'Ensure cached and uncached reads preserve current permissions.'],
    ['Verify before re-enable', 'Test two tenants, stale entries, rollback, and staged monitoring.'],
  ]),
};

export const COURSE_SELF_CHECK_SKETCHES = {
  'what-generates': sketch('A proposal cannot grant permission', 'The model can suggest a save; authenticated application state decides whether it may happen.', [
    ['Model proposes a plan', 'The proposal is untrusted input.'],
    ['Application validates it', 'Check fields, evidence, and caller authority.'],
    ['User approves the exact plan', 'Bind approval to the payload version.'],
    ['Service records the save', 'Only the authorized service performs the side effect.'],
  ]),
  'tokens-context': sketch('Reserve room for the answer', 'Count the full input and output budget before adding another document.', [
    ['Start with capacity', 'The worked example has 4,000 tokens.'],
    ['Add required inputs', 'Instructions, profile, history, and retrieved notes use 3,200.'],
    ['Reserve the reply', 'Keep 500 tokens for output; 300 remain.'],
    ['Add more only if it fits', 'A further document would exceed this example’s limit.'],
  ]),
  'prompt-basics': sketch('Retrieved text is evidence, not authority', 'A source can contain harmful instructions; tool permission remains an application decision.', [
    ['Retrieve source content', 'Treat it as untrusted data.'],
    ['Check the requested action', 'Do not execute instructions merely because a source says so.'],
    ['Apply application policy', 'Authorize each tool call using trusted state.'],
    ['Stop or ask when uncertain', 'Keep credentials and consequential actions protected.'],
  ]),
  'model-boundary': sketch('Check a response before accepting it', 'A duration must be an integer within the contract’s allowed range.', [
    ['Parse the response', 'Confirm it is valid structured data.'],
    ['Check the field type', 'The string "30" is not an integer.'],
    ['Check the allowed range', 'Require an integer from 10 through 60.'],
    ['Reject invalid output', 'Do not coerce a proposal to make it pass.'],
  ]),
  'choose-pattern': sketch('Choose the capability that fits the task', 'These approaches solve different needs; they are alternatives to evaluate.', [
    ['Prompting', 'Shape a response using supplied context and instructions.'],
    ['Retrieval', 'Supply current, authorized external evidence.'],
    ['Tools', 'Let application code perform a permitted operation.'],
  ], 'comparison'),
  'first-release': sketch('Separate deterministic checks from model quality', 'A fake-model lab can check application invariants; it cannot establish live-model accuracy.', [
    ['Run deterministic fixtures', 'Check validation, authorization, abstention, and duplicate handling.'],
    ['Prepare representative live cases', 'Include supported, missing-evidence, and adversarial examples.'],
    ['Grade independently', 'Use held-out cases and a defined quality rubric.'],
    ['Gate the rollout', 'Measure latency and cost; prepare monitoring and rollback.'],
  ]),
  'rag-purpose': sketch('Retrieval supplies evidence to generation', 'Adding a document makes it available to search; it does not update model weights.', [
    ['Index external documents', 'Prepare them for search.'],
    ['Retrieve relevant passages', 'Apply current access rules.'],
    ['Add evidence to the request', 'The model can use supplied context.'],
    ['Check the generated answer', 'Verify support and abstain when evidence is missing.'],
  ]),
  'rag-ingest': sketch('Keep a chunk understandable and traceable', 'A useful chunk carries enough meaning to stand on its own and enough metadata to verify its source.', [
    ['Preserve its heading', 'Keep the subject with the rule.'],
    ['Split at meaningful boundaries', 'Avoid separating a condition from its exception.'],
    ['Attach provenance', 'Store source, version, location, and access scope.'],
    ['Replace stale versions', 'Invalidate old chunks and affected cache entries.'],
  ]),
  'rag-vectors': sketch('Cosine compares vector direction', 'For [1,1,0] and [1,0,1], the dot product is 1 and the vector-length product is 2.', [
    ['Multiply matching coordinates', '1×1 + 1×0 + 0×1 = 1.'],
    ['Find each vector length', 'Both lengths are √2.'],
    ['Multiply the lengths', '√2 × √2 = 2.'],
    ['Divide dot by lengths', '1 ÷ 2 = 0.5.'],
  ]),
  'rag-retrieve': sketch('A reranker cannot restore a missed candidate', 'Retrieval creates the shortlist. Later ranking stages can only work with the candidates they receive.', [
    ['Search the corpus', 'Candidate retrieval finds a bounded set.'],
    ['Pass candidates onward', 'Only these items reach the reranker.'],
    ['Reorder the shortlist', 'A reranker changes order, not membership.'],
    ['Improve candidate recall', 'Fix a missing source at the retrieval stage.'],
  ]),
  'rag-generate': sketch('A real citation can still be wrong', 'Check that the cited passage supports the actual claim, not only that its ID exists.', [
    ['Check the citation ID', 'Confirm the source was actually supplied.'],
    ['Read the passage', 'Inspect its exact statement and conditions.'],
    ['Compare it to the claim', 'Reject claims the passage does not support.'],
    ['Correct or abstain', 'Return only what the evidence justifies.'],
  ]),
  'rag-evaluate': sketch('Recall measures relevant sources recovered', 'One of two relevant chunks was retrieved, so recall@2 is 1/2.', [
    ['Count all relevant chunks', 'There are two.'],
    ['Count relevant results found', 'The top two include one relevant chunk.'],
    ['Divide found by total', '1 ÷ 2 = 0.5 recall@2.'],
    ['Grade the answer separately', 'Retrieval recall does not measure claim support.'],
  ]),
};
