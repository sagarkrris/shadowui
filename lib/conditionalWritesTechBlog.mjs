export const CONDITIONAL_WRITES_BLOG = {
  id: 'java-conditional-writes',
  title: 'Java Conditional Writes with ETags and If-Match',
  category: 'Java service reliability',
  javaRelease: 17,
  sourceUrl: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.1',
  summary: 'Prevent lost edits across clients and service replicas with strong validators, atomic version checks, conflict resolution, and durable evidence for lost responses.',
  lessons: [
    'Give each editable representation a strong validator and require the client to return it.',
    'Check the version where the mutation commits so only one writer can consume a given version.',
    'Preserve user intent across conflicts and use a durable receipt to resolve an ambiguous save.',
  ],
  sections: [
    { heading: 'The running example', body: 'Two editors change the same document through a JSON API. Each fetch gets the document and an entity tag (ETag), an opaque validator for the selected representation. Both editors can keep working while nobody holds a database transaction open. The first save wins, and the other editor gets a chance to review the conflict.' },
    { heading: 'Executable scope', body: 'The five Java 17 examples model validator construction, matching after HTTP parsing, one in-memory atomic write, one-field merging, and receipt interpretation. The SQL is a contextual PostgreSQL 17 example. A real endpoint needs HTTP parsing, authorization, database transactions, and a durable operation journal.' },
    { heading: 'Primary references', body: 'RFC 9110 §§8.8.3, 13.1.1 and 13.2.1 define entity tags, If-Match and precondition evaluation. RFC 6585 §3 defines 428 Precondition Required (https://www.rfc-editor.org/rfc/rfc6585.html#section-3). PostgreSQL 17 documents concurrent UPDATE behavior at https://www.postgresql.org/docs/17/transaction-iso.html#XACT-READ-COMMITTED. Java 17 documents reference comparison and atomic updates at https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html.' },
  ],
  example: 'Both editors read revision 7\nEditor A saves with revision 7 → commit revision 8\nEditor B saves with revision 7 → 412 → fetch revision 8 and review the merge',
  interviewQuestions: [
    'Where must the If-Match comparison take effect when two replicas handle concurrent writes?',
    'How would you distinguish a stale edit from an earlier successful save whose response was lost?',
  ],
  interviewQa: [
    {
      question: 'Where must the If-Match comparison take effect when two replicas handle concurrent writes?',
      answer: 'I would return a strong ETag with the editable JSON and have the client carry it with the draft. If both replicas receive an edit based on revision 7, they can both pass a preliminary check. The database must compare the authorized document generation and revision in the same UPDATE that writes the edit and increments the revision. Under PostgreSQL Read Committed, a competing UPDATE can wait and recheck the predicate after the first commit. The loser preserves the draft and gets a precondition failure. This makes occasional conflicts explicit without holding a lock while a user edits. Under heavy contention, measure conflict rates and consider a command API that applies compatible operations independently. I would test with two database connections and assert both responses and the final row. Follow-up: Why include the generation? A delete and recreate can reuse the URI and revision, so the generation stops an old draft from matching the new document. See RFC 9110 §13.1.1 and the PostgreSQL 17 isolation reference above.',
    },
    {
      question: 'How would you distinguish a stale edit from an earlier successful save whose response was lost?',
      answer: 'I would keep the original operation ID with the save request. A timeout means the client missed an authoritative response. Suppose revision 7 advanced to 8, the response disappeared, and another editor later saved revision 9. A 412 on replay or the contents of revision 9 cannot tell me who committed revision 8. I would atomically store a receipt with the edit, check the original request fingerprint during an authorized lookup, and report unknown when evidence is absent. Receipts cost storage and require a retention policy. I would interrupt the response after commit in an integration test, then verify that a concurrent duplicate leaves one revision advance and the lookup returns the original receipt. Follow-up: Can I just retry with the latest ETag? That changes what the user approved, so a new save needs an explicit merge or review.',
    },
  ],
  practice: 'Specify the GET and PATCH contract for document edits, including a conflict response that preserves the draft and a recovery path for a lost success response.',
  capstone: {
    title: 'Capstone — Recover a contested document edit',
    scenario: 'Two editors read revision 7. One receives a timeout after sending a save. The other gets a precondition failure. A third editor later changes the document again.',
    steps: [
      'Trace both writes through the same tenant-scoped conditional UPDATE and explain which can commit.',
      'Define a receipt keyed by the authorized resource and operation identity. Bind it to the original request and commit it with the edit. Show how concurrent duplicates and key reuse with different input are handled.',
      'Test the HTTP boundary with two connections, deletion and recreation, lost responses, and a second conflict while a user reviews a merge. Assert the committed revision and document content as well as the response.',
    ],
    outcome: 'A save contract that prevents silent overwrites, preserves drafts, and can identify a committed edit even after later versions exist.',
  },
};

export const CONDITIONAL_WRITES_CHAPTERS = [
  {
    title: '1. Give each editable representation a strong validator',
    lesson: 'A lost update happens when a save computed from old data silently overwrites a newer save. Return a strong ETag with the editable representation so the client can name the version it actually saw. In this model, the document generation is a never-reused identifier assigned on creation, the revision increases on each accepted edit, and the variant identifies the representation format. This works as a strong validator only when those fields change whenever the representation data changes. If serialization, derived fields, or content encoding can change the bytes, account for them too or derive the tag from the actual representation.',
    diagram: 'Document instance + revision + representation variant → quoted strong ETag',
    walkthrough: 'For generation 00000000-0000-0000-0000-000000000007, revision 7 and variant json1, the header is ETag: "00000000-0000-0000-0000-000000000007:7:json1". A recreated document gets a fresh generation even if its revision starts at 7.',
    whenToUse: 'Use a version-derived strong validator for an editable representation with controlled, deterministic serialization and complete version tracking.',
    avoid: 'Avoid a row revision alone when the representation also includes independently changing data or when a deleted resource URI can be reused.',
    example: String.raw`import java.util.UUID;

final class DocumentETag {
  static String headerValue(UUID generation, long revision, String variant) {
    if (generation == null || revision < 0 || variant == null
        || !variant.matches("[a-z0-9-]{1,24}")) {
      throw new IllegalArgumentException("Invalid document validator input");
    }
    return "\"" + generation + ":" + revision + ":" + variant + "\"";
  }
}`,
    authoredPractice: true,
    exercise: 'List every input to your representation, including content encoding and a serializer upgrade. For each changing input, say which component of the validator changes.',
    quiz: 'Why include a generation when the URI and revision are already available?',
    answer: 'A deleted document and its replacement can share a URI and revision number. A new generation keeps a stale edit for the deleted document from matching the replacement. Check the generation at the mutation boundary as well.',
  },
  {
    title: '2. Evaluate the client’s If-Match precondition',
    lesson: 'Send the strong tag from GET in If-Match when saving. HTTP uses strong comparison here. Both tags must be strong and their opaque values must match exactly. A list succeeds if one tag matches, and the separate wildcard form tests whether a current representation exists. Use the specific tag in an editor that intends to protect the exact version it read. After normal request checks and authorization, this API returns 428 for a required but missing header and 412 for a valid but false precondition. Invalid syntax is a separate request error. If the unconditional request would already fail, HTTP generally ignores preconditions.',
    diagram: 'Authorized request → parsed If-Match → strong match → conditional storage write',
    walkthrough: 'The Java matcher handles a parsed tag list. The HTTP layer handles the wildcard separately. An empty opaque tag is legal, and a weak tag with the same opaque value fails strong comparison.',
    whenToUse: 'Require a version on human edits sent from clients that can retain the ETag with the draft.',
    avoid: 'Avoid wildcard matching for a save contract that promises to protect the exact version the editor saw.',
    example: `import java.util.List;
import java.util.Optional;

final class StrongIfMatch {
  record Tag(String opaque, boolean weak) {
    Tag {
      if (opaque == null) throw new IllegalArgumentException("Missing opaque tag");
    }
  }

  static boolean matches(List<Tag> candidates, Optional<Tag> current) {
    if (candidates == null || current == null
        || candidates.stream().anyMatch(java.util.Objects::isNull)) {
      throw new IllegalArgumentException("Invalid parsed precondition");
    }
    return current.filter(tag -> !tag.weak())
        .map(tag -> candidates.stream().anyMatch(candidate ->
            !candidate.weak() && candidate.opaque().equals(tag.opaque())))
        .orElse(false);
  }
}`,
    authoredPractice: true,
    exercise: 'Write HTTP cases for a missing header, a malformed header, a weak tag, a stale strong tag, and a valid strong tag. Document the separate wildcard rule and the endpoint’s supported forms.',
    quiz: 'Why can’t the HTTP controller read revision 7, check the tag, and then issue an ordinary update?',
    answer: 'Another writer can commit revision 8 after the check but before the update. The storage write must still require the same generation and revision. A controller check can reject early, while the conditional write makes the final decision.',
  },
  {
    title: '3. Put the comparison inside the atomic write',
    lesson: 'The storage owner checks the old version and applies the new value in one operation. For the single-tag path shown here, the service validates the tag against the selected representation and carries the generation and revision into the UPDATE. This example assumes the representation format is fixed for this write path and all representation-affecting state changes advance the revision. In PostgreSQL 17 at Read Committed, a concurrent UPDATE may wait for the first writer and then recheck its WHERE predicate against the updated row. Include tenant, document ID, generation and revision in that predicate, and increment the revision in the same statement. At stronger isolation a conflicting transaction can fail with a serialization error. Keep the original client precondition if you retry the transaction. Report success after the transaction commits.',
    diagram: 'UPDATE document SET title = ?, revision = revision + 1\nWHERE tenant_id = ? AND id = ? AND generation = ? AND revision = ?\nRETURNING revision\n\nContextual SQL with bound parameters. A returned row is tentative until commit. With zero rows, map a stale editable document to 412 and an unavailable document according to the endpoint’s normal authorization and missing-resource policy.',
    walkthrough: 'Both writers call save(7, ...) on the same Java store. Exactly one compare-and-set can replace the immutable revision-7 snapshot. A losing writer returns false without changing the state. The store models one document generation in one JVM. At Long.MAX_VALUE the next valid edit fails before mutation, so an old revision cannot become current through wraparound.',
    whenToUse: 'Use a conditional write when changes to one versioned aggregate are infrequent enough that clients can resolve occasional conflicts.',
    avoid: 'Avoid relying on one row’s revision to protect an invariant spanning multiple independently updated rows. Use an appropriate constraint, transaction isolation level, or explicit lock strategy.',
    example: `import java.util.concurrent.atomic.AtomicReference;

final class ConditionalDocument {
  record Snapshot(long revision, String title) {}

  private final AtomicReference<Snapshot> state;

  ConditionalDocument(long revision, String title) {
    validate(revision, title);
    state = new AtomicReference<>(new Snapshot(revision, title));
  }

  Snapshot read() {
    return state.get();
  }

  boolean save(long expectedRevision, String title) {
    validate(expectedRevision, title);
    Snapshot before = state.get();
    if (before.revision() != expectedRevision) return false;
    Snapshot after = new Snapshot(Math.incrementExact(expectedRevision), title);
    return state.compareAndSet(before, after);
  }

  private static void validate(long revision, String title) {
    if (revision < 0 || title == null || title.isBlank()) {
      throw new IllegalArgumentException("Invalid document edit");
    }
  }
}`,
    authoredPractice: true,
    exercise: 'Use two database connections to race an update from the same revision. Verify one commit, one conflict, and the winning title. Repeat after deleting and recreating the document. Let the framework own the transaction or close owned JDBC statements, result sets, and connections explicitly.',
    quiz: 'Why should a losing writer keep the original revision when retrying a serialization failure?',
    answer: 'The original revision describes the data the editor reviewed. Substituting the newest revision can make an old draft overwrite a change the editor never saw. Retry the same guarded transaction within its budget, or fetch the new state and start an explicit merge.',
  },
  {
    title: '4. Merge against the original draft base',
    lesson: 'A three-way merge compares the original value the editor saw (base), the local draft, and the newest server value. For one field, keep the side that changed alone, accept identical changes, and surface a conflict when both sides changed it differently. Compare using domain equality. Here the field is an optional subtitle represented as a string, with empty text meaning cleared. For multiple fields, validate cross-field invariants on the merged document. A save after review uses the freshly fetched ETag, so another intervening edit can still cause a conflict.',
    diagram: 'Original base + local draft + latest server value → merged field or explicit conflict',
    walkthrough: 'With base "Draft", local "" and remote "Draft", the merged subtitle is the empty string. With local "Finance" and remote "Support", preserve the draft and ask the editor to choose.',
    whenToUse: 'Use a three-way merge for independently editable fields when you retain the exact base and can make conflicts visible to the user.',
    avoid: 'Avoid automatic field-by-field merges for coupled values such as start and end dates unless you validate the combined result and preserve the original intent.',
    example: `import java.util.Optional;

final class SubtitleMerge {
  static Optional<String> merge(String base, String draft, String latest) {
    if (base == null || draft == null || latest == null) {
      throw new IllegalArgumentException("Use empty text to clear a subtitle");
    }
    if (draft.equals(base)) return Optional.of(latest);
    if (latest.equals(base) || draft.equals(latest)) return Optional.of(draft);
    return Optional.empty();
  }
}`,
    authoredPractice: true,
    exercise: 'Trace a clear, identical concurrent edits, divergent edits, and a remote edit to another field. For each case, state what the editor sees and which ETag the next save carries.',
    quiz: 'How do you distinguish clearing the subtitle from an unresolved conflict?',
    answer: 'A successful clear returns a present result containing the empty string. A conflict returns an absent result. The UI can therefore save a clear while keeping both versions available for conflict review.',
  },
  {
    title: '5. Recover when the save response is lost',
    lesson: 'A timeout or cancellation after dispatch can leave the save outcome unknown. A retry with the original If-Match may return 412 even if the first request committed, and the latest field value cannot identify who wrote it. For edits that require attribution, use an operation ID scoped to the authorized tenant, principal and resource. Bind it to a server-computed fingerprint of the original method, target, precondition and request content, using an unambiguous encoding. Commit a success receipt with the edit under a unique operation key. On replay, verify that the receipt belongs to the same operation and request before using it. If the receipt is absent, a request may still be in flight or its receipt may have expired.',
    diagram: 'Response lost → look up original authorized operation → matching committed receipt, key conflict, or UNKNOWN',
    walkthrough: 'The example interprets a lookup already scoped to one authorized operation ID. A matching committed receipt confirms the original save even if newer edits exist. Expose the recorded result through an authorized operation lookup, and fetch the latest representation separately before another edit.',
    whenToUse: 'Use durable receipts when a user or downstream workflow must know whether a particular save committed after a disconnect or retry.',
    avoid: 'Avoid interpreting timeout, cancellation, stale precondition, a missing receipt, or equal field values as proof of the original operation’s result.',
    example: `import java.util.Optional;

final class EditRecovery {
  enum Outcome { APPLIED, KEY_CONFLICT, UNKNOWN }

  static Outcome resolve(String requestFingerprint,
                         Optional<String> committedFingerprint) {
    if (requestFingerprint == null || requestFingerprint.isBlank()
        || committedFingerprint == null
        || committedFingerprint.filter(String::isBlank).isPresent()) {
      throw new IllegalArgumentException("Invalid receipt evidence");
    }
    return committedFingerprint
        .map(saved -> saved.equals(requestFingerprint) ? Outcome.APPLIED : Outcome.KEY_CONFLICT)
        .orElse(Outcome.UNKNOWN);
  }
}`,
    authoredPractice: true,
    exercise: 'Simulate a commit followed by a lost response, a concurrent retry with the same key, a different request reusing the key, and a lookup after receipt expiry. Set a retention window that covers the documented retries. Track conflicts, key mismatches, and unresolved lookup age using bounded labels.',
    quiz: 'How should concurrent duplicate requests and cancellation interact with the receipt?',
    answer: 'Serialize duplicate claims with a unique scoped key and commit the successful edit and receipt together. A duplicate can recover the existing result after checking the fingerprint. Cancellation can stop local work or waiting. A confirmed rollback establishes that attempt did not commit, while a matching committed receipt confirms success. A lookup timeout keeps the outcome unknown.',
  },
];
