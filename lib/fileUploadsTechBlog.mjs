export const FILE_UPLOADS_BLOG = {
  id: 'java-file-uploads-production',
  title: 'Java File Uploads: Streaming, Validation, Quarantine, and Safe Delivery',
  category: 'Java backend security',
  javaRelease: 17,
  sourceUrl: 'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html',
  summary: 'A practical Java 17 course on accepting user files without turning bytes, filenames, scanners, object storage, or deletion into unbounded or unowned work.',
  lessons: [
    'An upload is a bounded byte stream with one authenticated owner, not a trusted filename or a harmless in-memory byte array.',
    'Content-Type and extensions are hints. A server needs an allowlist, bounded content inspection, quarantined storage, and type-specific processing before release.',
    'Upload, scan, promotion, download, and deletion are separate durable states; retries and lost responses need stable identities and reconciliation.',
  ],
  sections: [
    { heading: 'Course goal', body: 'Design a Java upload path that protects application memory and storage capacity, keeps untrusted bytes out of public delivery, and makes ownership and recovery explicit.' },
    { heading: 'Example scope', body: 'The standalone Java 17 examples are deterministic decision models. They do not parse real media, scan for malware, connect to object storage, or provide a production authorization system. Use the platform and file-type libraries selected by your service.' },
  ],
  example: 'authenticated request → bounded stream → private quarantine → type-specific scan → authorized delivery',
  interviewQuestions: [
    'Why is a client Content-Type header insufficient to authorize an uploaded file for delivery?',
    'What must remain true when a scan result is lost after the scanner has completed?',
    'Why should deleting a database row not be treated as proof that object bytes are gone?',
  ],
  practice: 'Review one upload feature. Name its byte, time, concurrency, storage, scan, and retention limits; then trace a duplicate request and a lost scanner response without exposing bytes prematurely.',
  capstone: {
    title: 'Capstone: Release profile documents without public-object leaks',
    scenario: 'A Java service accepts profile PDFs during a hiring surge. Some clients retry after a timeout, a scanner can be slow, and users can delete a document while a download link is being created.',
    steps: [
      'Set request, per-file, aggregate, and concurrency limits before storage. Stream into a private, generated object key while recording one owner-bound upload identity.',
      'Use a narrow allowlist and type-specific inspection in quarantine. Keep the object unavailable until a durable scanner result promotes the exact object version.',
      'Authorize every download against the current owner and state. Mark deletion durably, revoke new delivery, then retry object removal and reconcile incomplete work without claiming bytes disappeared early.',
    ],
    outcome: 'A bounded upload lifecycle whose public delivery and deletion claims match durable evidence rather than client headers or best-effort callbacks.',
  },
};

export const FILE_UPLOADS_CHAPTERS = [
  {
    title: '1. Admit a bounded stream before reading bytes',
    lesson: 'An upload endpoint needs limits at more than one layer: request body, one file, aggregate bytes, concurrent streams, storage quota, scan time, and downstream queue depth. Enforce a server-side byte limit while streaming; a declared Content-Length can be absent or false. Do not use readAllBytes for untrusted files because it makes heap use proportional to attacker input. If the limit is crossed, stop consuming, release the owner exactly once, and return a clear size error without continuing to write.',
    whenToUse: 'Use streaming and explicit byte/concurrency budgets for every endpoint that accepts user-controlled binary data.',
    avoid: 'Avoid buffering arbitrary uploads in memory, trusting Content-Length as enforcement, or letting rejected streams keep consuming storage.',
    diagram: 'authenticated request → bounded byte counter → private object writer\nlimit crossed → stop + clean up owner → explicit rejection',
    example: `final class UploadSizeExample {
  static long nextTotal(long written, int nextChunk, long maxBytes) {
    if (written < 0 || nextChunk < 0 || maxBytes < 0) throw new IllegalArgumentException();
    if (nextChunk > maxBytes - written) throw new IllegalArgumentException("too large");
    return written + nextChunk;
  }
}`,
    exercise: 'Choose a maximum file size, aggregate request size, concurrent upload count, and cancellation behavior for profile PDFs. Explain where each is enforced and what is measured.',
    quiz: 'Why is a valid Content-Length not enough to protect heap and storage?',
    answer: 'It is client-supplied metadata and may be absent, incorrect, or bypassed by another transfer mode. The server must count bytes as it accepts them and keep that count within a finite budget.',
  },
  {
    title: '2. Separate names and declared types from content evidence',
    lesson: 'Treat the supplied filename and Content-Type as display and routing hints, not proof of safe content. Decode and bound a display name separately, generate the storage key on the server, and use a business allowlist. Type inspection can reject obvious mismatches but a magic prefix alone cannot prove a complex format safe. For formats you support, parse or rewrite with a maintained type-specific library in a resource-limited worker. Do not unpack archives unless their entry count, paths, compressed and expanded sizes, and parser behavior are deliberately controlled.',
    whenToUse: 'Use independent filename, declared-type, signature, and type-specific checks whenever bytes can later be rendered, parsed, emailed, or downloaded.',
    avoid: 'Avoid deriving an object path from a supplied filename or declaring a file safe solely because its extension, MIME header, or first bytes look familiar.',
    diagram: 'client name + header → display metadata only\nbytes → allowlist + bounded inspection → quarantine decision',
    example: `final class UploadTypeExample {
  static boolean acceptsPdf(String declaredType, byte[] prefix) {
    if (declaredType == null || prefix == null) throw new IllegalArgumentException();
    return "application/pdf".equals(declaredType)
        && prefix.length >= 5 && prefix[0] == '%' && prefix[1] == 'P'
        && prefix[2] == 'D' && prefix[3] == 'F' && prefix[4] == '-';
  }
}`,
    exercise: 'For one allowed document type, list the filename rules, declared type, bounded initial inspection, parser/rewrite worker, and the cases that remain quarantined for review.',
    quiz: 'Why is a recognized PDF prefix not a complete safety decision?',
    answer: 'It only indicates that the first bytes resemble one format. A malicious or malformed file can still use that prefix, exploit a later parser, exceed resource limits, or violate the product policy.',
  },
  {
    title: '3. Make quarantine a durable, non-public state',
    lesson: 'Write accepted bytes under a generated private key and record an upload row that binds tenant, owner, size, expected object version, and state. A scanner or parser should consume that exact private object version, not a mutable filename. Promote only after its durable result matches the recorded object identity and policy. A lost scan callback is UNKNOWN, not CLEAN; retry or query the scanner with the stable scan identity. Never make a public URL or CDN path the first storage location for unverified bytes.',
    whenToUse: 'Use durable quarantine and immutable object identity when files require scanning, review, transformation, or asynchronous processing.',
    avoid: 'Avoid public write buckets, promoting a different object after a scan, or treating a missing scanner callback as approval.',
    diagram: 'private object version → scan request with stable identity → durable CLEAN result → promote exact version\ncallback missing → UNKNOWN → reconcile',
    example: `final class UploadPromotionExample {
  enum State { QUARANTINED, CLEAN, REJECTED }
  static State promote(State current, String recordedVersion, String scannedVersion, boolean clean) {
    if (current == null || recordedVersion == null || scannedVersion == null) throw new IllegalArgumentException();
    if (current != State.QUARANTINED) return current;
    if (!recordedVersion.equals(scannedVersion)) return State.QUARANTINED;
    return clean ? State.CLEAN : State.REJECTED;
  }
}`,
    exercise: 'Draw the database/object-store/scanner ownership boundary. State the stable upload and scan identities, the object version being scanned, and the reconciliation query after a timeout.',
    quiz: 'Why must promotion compare the scanned object version with the recorded upload version?',
    answer: 'A name can be replaced or reused while asynchronous work is in flight. Binding the result to an immutable recorded version prevents clean evidence for one object from releasing another object.',
  },
  {
    title: '4. Keep duplicate requests and retries owner-bound',
    lesson: 'A client retry after a lost response can describe the same intended upload, but only if it carries the same stable identity and same owner-bound request fingerprint. Create or return one durable upload record atomically; concurrent requests with the same key must not start independent object writes. A reused key with different declared intent is a conflict, not a new upload. If a process crashes between object write and database update, reconciliation must inspect the durable record and object metadata before deleting, resuming, or creating a replacement.',
    whenToUse: 'Use owner-scoped idempotency for mobile retries, unreliable networks, and multi-step direct-to-object-store upload initiation.',
    avoid: 'Avoid global keys shared across tenants, accepting a reused key with changed intent, or assuming an HTTP timeout means no object was created.',
    diagram: 'same owner + same key + same fingerprint → return existing upload\nsame key + changed fingerprint → conflict\nresponse lost → query upload state',
    example: `final class UploadReplayExample {
  enum Decision { CREATE, RETURN_EXISTING, CONFLICT }
  static Decision decide(String owner, String storedOwner, String storedFingerprint, String requestFingerprint) {
    if (owner == null || requestFingerprint == null) throw new IllegalArgumentException();
    if (storedOwner == null) return Decision.CREATE;
    if (!owner.equals(storedOwner) || storedFingerprint == null) return Decision.CONFLICT;
    return storedFingerprint.equals(requestFingerprint) ? Decision.RETURN_EXISTING : Decision.CONFLICT;
  }
}`,
    exercise: 'Define the upload identity scope, request fingerprint fields, atomic uniqueness constraint, response replay retention, and the user-visible result for concurrent retries.',
    quiz: 'Why is an idempotency key alone insufficient for duplicate upload safety?',
    answer: 'It needs an owner scope and a bound request intent. Otherwise another tenant, or a changed file request using the same key, could receive or overwrite the original result.',
  },
  {
    title: '5. Authorize delivery at the current resource boundary',
    lesson: 'A clean file is not automatically public. At download time, load the current resource state and verify both tenant membership and the principal’s ownership or explicit read permission for that specific object. This private-document example allows only the owner. Coordinate capability issuance and deletion through the same authority: if deletion wins, issuance is denied; if issuance wins, deletion does not revoke the already-issued capability. The Java model serializes these decisions for one immutable object version in one process. Replicas need a durable transaction or equivalent serialization at the resource authority, including the actual signing or delivery decision; checking state and signing later leaves a race. A signed storage URL usually remains usable until expiry or a storage-level denial, even after application access is revoked. For immediate revocation, serve through a gateway that checks current policy on each request. Set a safe response Content-Type and Content-Disposition for the product contract; isolate rendered untrusted content from the main application origin.',
    whenToUse: 'Use per-request ownership checks and short-lived delivery capabilities for private attachments, exports, and user-generated content.',
    avoid: 'Avoid permanent bearer URLs, object keys that imply authorization, or serving untrusted active content from the authenticated application origin.',
    diagram: 'principal + resource → serialized owner/state check + issuance → bounded capability\ndelete wins → deny new issuance\nissuance wins → existing capability valid until expiry or storage denial',
    example: `final class UploadDownloadExample {
  static boolean canDownload(String principalTenant, String principalId,
      String objectTenant, String ownerId, boolean clean, boolean deleted) {
    for (String id : new String[]{principalTenant, principalId, objectTenant, ownerId})
      if (id == null || id.isBlank()) throw new IllegalArgumentException();
    return clean && !deleted && principalTenant.equals(objectTenant) && principalId.equals(ownerId);
  }
  // One private document, one process. This record models issuance; it is not a signed URL.
  record Capability(String objectVersion, long issuance) {}
  static final class DeliveryGate {
    private final String tenant, owner, version;
    private final boolean clean;
    private boolean revoked;
    private long issued;
    DeliveryGate(String tenant, String owner, String version, boolean clean) {
      for (String id : new String[]{tenant, owner, version})
        if (id == null || id.isBlank()) throw new IllegalArgumentException();
      this.tenant = tenant; this.owner = owner; this.version = version; this.clean = clean;
    }
    synchronized java.util.Optional<Capability> issue(String principalTenant, String principalId) {
      if (!canDownload(principalTenant, principalId, tenant, owner, clean, revoked))
        return java.util.Optional.empty();
      long next = Math.incrementExact(issued);
      Capability result = new Capability(version, next);
      issued = next;
      return java.util.Optional.of(result);
    }
    // Called only after delete authorization. Existing capabilities keep their bounded lifetime.
    synchronized void revokeNewDelivery() { revoked = true; }
  }
}`,
    exercise: 'Specify owner and explicit-share permissions for a private document. Trace both issuance-before-deletion and deletion-before-issuance, including an already-issued URL, its expiry, the storage denial policy, and a gateway option for immediate revocation.',
    quiz: 'Why should a signed object URL be created after authorization rather than stored as the authorization record?',
    answer: 'Authorization must check the specific resource owner or read grant as well as tenant membership. Issuance and deletion must share one serialized decision boundary to stop issuance after revocation. A previously issued signed URL can remain usable until expiry or storage-level denial; application deletion alone does not invalidate it.',
  },
  {
    title: '6. Delete as a retryable lifecycle, then prove operations',
    lesson: 'Deletion has at least two effects: revoke new delivery issuance in durable application state using the same authority as issuance, then remove or expire object bytes according to the retention policy. Previously issued capabilities and in-progress downloads require their own bounded lifetime or enforcement policy. Marking a row deleted is not evidence that an object-store delete completed; an object-store success is not evidence that every cache or legal hold is gone. Keep a deletion owner, attempt identity, retry schedule, and terminal evidence. Measure rejected size/type requests, quarantine age, scan outcomes and latency, duplicate conflicts, promotion failures, delivery denials, pending deletions, and storage bytes by tenant without logging file contents or secrets.',
    whenToUse: 'Use an explicit deletion state machine and operational signals wherever content can outlive one request or be subject to retention and recovery policies.',
    avoid: 'Avoid silently abandoning failed deletes, claiming instant erasure without checking the storage/retention contract, or logging raw filenames and content to diagnose uploads.',
    diagram: 'delete request → durable revoke + pending deletion → object delete/retention action → confirmed or retry\nambiguous result → reconcile before claiming removal',
    example: `final class UploadDeletionExample {
  enum State { ACTIVE, DELETE_PENDING, DELETED }
  static State afterDeleteAttempt(State state, boolean objectDeletionConfirmed) {
    if (state == null) throw new IllegalArgumentException();
    if (state == State.DELETED) return State.DELETED;
    return objectDeletionConfirmed ? State.DELETED : State.DELETE_PENDING;
  }
}`,
    exercise: 'Write a deletion runbook: revocation timing, retention/hold checks, retry ownership, reconciliation evidence, user-facing status, and the alerts for growing pending deletes.',
    quiz: 'What should the system say after a delete request succeeds in the database but object deletion times out?',
    answer: 'New capability issuance is revoked and deletion is pending or unknown, not confirmed erased. Existing capabilities may remain usable until expiry or storage denial. A retry owner must reconcile the object-store outcome using the stable deletion record before the system claims removal.',
  },
];
