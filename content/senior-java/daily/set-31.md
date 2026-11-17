# Set 31 — File publication and recovery contracts

17 November 2026 · S31-Q01–S31-Q12

Assume Java 21 without preview features. These original scenarios progress from file operations to service recovery design. Practise each spoken answer in 45–90 seconds. The final Java helper is runnable and tested with controlled channels; other snippets are contextual design examples. Local tests do not certify power-loss durability, remote filesystem semantics or a deployed ingestion service.

**1. A report reader sees half a new file during replacement. How should publication differ from writing?**

**Say aloud:** “A publication boundary is the point at which readers may discover a completed artifact. I would write a uniquely named staging file in the destination directory, finish and close it, then request an atomic move to the published name. Atomic means readers do not observe the move halfway through; it does not mean the bytes survive a power failure. If the provider cannot perform the atomic operation, I would fail that publication or use a separately designed versioned manifest protocol. Silently falling back to copying would restore the original failure. Existing-target behavior with ATOMIC_MOVE is provider-specific, so I would test the actual replacement contract rather than assume REPLACE_EXISTING makes it portable.”

**Example:** publish.tmp → report-v17.csv; readers discover only published names.

**Deep dive / verification:** Cost is O(bytes) to produce the artifact; rename cost is provider-dependent. Test concurrent readers against whole old/new payloads. Keep failed staging files private and clean them by ownership.

**Follow-ups:** Why the same directory? It improves the chance of the same filesystem, but atomic-move support still needs verification.

**Primary reference:** [Java 21 Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**2. Two export jobs both observe that a filename is absent and then overwrite it. How should one reserve the name?**

**Say aloud:** “A check followed by creation is two operations, so another writer can act between them. I would use CREATE_NEW when opening the output, which combines the absence test and creation. One contender succeeds and the other handles the existing-file outcome according to the business rule. A successful reservation is not a completed report: the process may crash after creating an empty file. I would therefore separate reserved, writing and published states or use private staging files. I would never treat every IOException as a harmless duplicate because permission or storage failures require different handling. For retries I would also verify that an existing artifact belongs to the same logical export.”

**Example:** Opening job-42.pending with CREATE_NEW reserves it; opening with CREATE and TRUNCATE_EXISTING does not.

**Deep dive / verification:** One provider operation for reservation, not a distributed business transaction. Test two concurrent contenders and confirm the loser cannot truncate the winner.

**Follow-ups:** Does exists() make CREATE_NEW unnecessary? No; the observation may already be stale.

**Primary reference:** [Java 21 Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**3. A write and close succeed, but a host crash loses the checkpoint. What did close fail to promise?**

**Say aloud:** “Durability means an acknowledged state survives the failure model we agreed on. Closing a Java channel releases its resource; I would not use it as my checkpoint durability protocol. For updates through a file channel I would consider force, whose contract depends on local storage and whether metadata is requested. Publishing a newly created filename introduces directory-entry persistence as another concern, and Java does not provide one portable recipe for every filesystem. I would specify the supported deployment storage and test crash recovery there. For a critical distributed checkpoint, a transactional storage service may be easier to reason about. A checksum detects some corruption but does not make missing data durable.”

**Example:** Write checkpoint bytes, call channel.force(true), then follow the platform-specific publication protocol.

**Deep dive / verification:** Forcing storage adds I/O latency; batch acknowledgments only if their loss window is acceptable. Local process termination is weaker than a power-loss test.

**Follow-ups:** Does force cover another channel’s writes? Do not infer that; scope the guarantee to the documented update path.

**Primary reference:** [Java 21 FileChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html).

---

**4. FileChannel.write returns normally with bytes still in the buffer. Was the entire payload accepted?**

**Say aloud:** “A buffer has a position and a limit, and remaining bytes are the interval between them. A channel write returns how many bytes it consumed; one call is not a whole-message operation. I would keep writing while bytes remain, advance accounting from the actual result, and define what happens if no progress is made. An unbounded loop around zero can burn CPU forever. For the simple bounded demonstration here, zero progress fails explicitly; a production nonblocking transport would instead wait for readiness under a deadline. If an exception occurs after earlier successful writes, the output may already contain a prefix. I would keep incomplete output unpublished rather than retry the whole payload blindly.”

**Example:** A channel accepting two bytes per call needs three calls for a five-byte payload.

**Deep dive / verification:** O(n) byte transfer, O(1) extra state. Test short writes, zero progress, empty buffers and failure after a prefix. The runnable helper below demonstrates this contract.

**Follow-ups:** Can rewinding and retrying duplicate data? Yes; establish the current destination position or restart a private artifact deliberately.

**Primary reference:** [Java 21 FileChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html).

---

**5. A ranged file download uses transferTo once and silently truncates. Which result must control the loop?**

**Say aloud:** “A range transfer is a request to transfer up to a count, and the returned count is the progress actually made. I would maintain an explicit source offset and remaining length, adding only successful progress. A zero result needs a bounded wait, a fallback copy strategy or an explicit failure; it must not be treated as successful completion. I would also define whether source mutation is allowed during the download. Even a perfect progress loop cannot turn a changing file into a consistent snapshot. Immutable versioned exports simplify retries and range verification. I would compare delivered length and a suitable content digest with the intended artifact, while keeping authorization tied to that version.”

**Example:** For range [100,150), after 20 bytes the next request begins at 120 with 30 remaining.

**Deep dive / verification:** O(n) transferred bytes; zero-copy optimization is implementation-dependent. Test short transfers, zero, source truncation and disconnects.

**Follow-ups:** Does transferTo advance the source channel position? No; its explicit position argument controls the source range.

**Primary reference:** [Java 21 FileChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html).

---

**6. Two threads in one JVM use separate FileLocks to serialize updates and encounter an overlapping-lock exception. Why?**

**Say aloud:** “A file lock coordinates access to a file region through operating-system facilities, subject to platform rules. Java file locks are held on behalf of the JVM, so I would not use them as a replacement for an in-process mutex. Threads need a shared local lock for their critical section; cooperating processes may additionally need a file lock. I would define one consistent acquisition order and clear ownership of channels and lock release. Uncooperative writers and network filesystems can weaken the intended coordination, so I would test the supported environment explicitly. If the data needs transactional updates from many services, a database may provide a clearer contract than a shared mutable file.”

**Example:** Thread mutex → process file lock → read/modify/write → release in reverse order.

**Deep dive / verification:** Coordination adds waiting and failure paths; it does not make a sequence of writes crash-atomic. Test cross-process contention separately from local thread exclusion.

**Follow-ups:** Can shared locks be assumed everywhere? No; platform capabilities and granted lock mode must be checked.

**Primary reference:** [Java 21 FileChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html).

---

**7. A directory watcher drops a change burst and the search index never catches up. How should OVERFLOW be handled?**

**Say aloud:** “A filesystem notification is a hint to inspect state, not a durable record of every business event. OVERFLOW means events were discarded, so I would reconcile the watched directory against the index instead of pretending no changes occurred. I would also process events before resetting the key, inspect whether reset succeeded and arrange recovery when a registration becomes invalid. Reconciliation should be repeatable and bounded, with another pass if changes arrive during scanning. A modified notification does not certify that the writer has finished. For ingestion I would prefer an explicit publication convention and maintain durable processing identity separately. Periodic reconciliation provides a safety net when notifications or the process are interrupted.”

**Example:** OVERFLOW → scan published filenames → reconcile missing/stale index entries.

**Deep dive / verification:** A full scan costs O(entries plus metadata I/O); coalesce rescans to avoid overload. Test burst loss using a controlled event model, then verify provider behavior separately.

**Follow-ups:** Is each create event exactly one new job? No; job identity and durable acceptance need their own protocol.

**Primary reference:** [Java 21 WatchService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/WatchService.html).

---

**8. A cleanup task uses Files.walk and closes only the final collected list. Where can handles remain open?**

**Say aloud:** “A lazy directory traversal may own open directories while it produces paths. Collecting its results does not transfer that resource ownership to the list. I would close the traversal stream with try-with-resources around the terminal operation. I would also bound traversal depth and decide how access failures are reported, because filesystem state can change during iteration. For cleanup I would select only artifacts owned by this application and delete children before their parents. A complete list can itself consume too much memory, so a visitor may fit very large trees better. Closing resources prevents handle retention but does not make the traversal a snapshot or make broad deletion safe.”

**Example:** try (var paths = Files.walk(root, 2)) { /* consume paths here */ }

**Deep dive / verification:** O(entries) traversal with provider I/O; collected results add O(entries) heap. Test empty directories and exceptions during consumption, not only normal completion.

**Follow-ups:** Will concurrent new files be included? There is no fixed snapshot promise; cleanup should tolerate later work.

**Primary reference:** [Java 21 Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**9. A metadata probe reports exists=false and the service returns not-found for a permission problem. What information was lost?**

**Say aloud:** “A boolean existence probe cannot explain all failures. In Java false may mean the file is absent or that existence could not be determined. I would usually attempt the operation I actually need and classify its exception at the boundary, keeping user responses safe while retaining actionable internal diagnostics. An existence check also cannot reserve a file or guarantee that a later open succeeds. For a download API, missing content and unavailable storage may justify different retry behavior, even if authorization policy deliberately hides some distinctions. I would test denied access and transient provider errors with a controlled adapter rather than infer those outcomes from a happy-path local file.”

**Example:** Open the authorized artifact; classify missing-file versus other I/O failures without exposing private paths.

**Deep dive / verification:** One attempted operation avoids an extra probe but can still fail after partial work. Exception handling is part of the public retry contract.

**Follow-ups:** Can notExists be substituted for !exists? No; unknown state can make both predicates false.

**Primary reference:** [Java 21 Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**10. Two Path values compare unequal although both names reach the same existing file. Which identity is being compared?**

**Say aloud:** “A path is a name interpreted by a filesystem provider, not a permanent file identity. Equality of path objects does not generally prove equality of the underlying file, and different names may identify the same file. When that distinction matters I would use an operation such as isSameFile, while accounting for errors and later filesystem changes. For an export catalog I would prefer an application artifact ID instead of deriving durable identity from a path or inode-like detail. Hard links and renames make name-based deduplication fragile. I would test the supported provider with alternate names, but avoid claiming that one successful identity check authorizes a later operation against an adversarially mutable directory.”

**Example:** archive/report and another hard-link name may locate the same file while their Path values differ.

**Deep dive / verification:** Identity comparison may require I/O; provider semantics apply. Application IDs add catalog state but remain stable across relocation.

**Follow-ups:** Does toAbsolutePath establish file existence? No; it resolves a name without proving the target exists.

**Primary reference:** [Java 21 Path](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html).

---

**11. A large import uses readAllBytes after checking file size and still exhausts heap. What bound is missing?**

**Say aloud:** “A metadata size is an observation, not an enforced read budget. The file can grow between the check and the read, and the heap cost includes buffers and decoded objects as well as raw bytes. I would stream input through a parser that enforces byte, record and field limits while consuming it. If the application truly needs the whole artifact, I would reject over-budget input during reading and stop before publishing partial results. Disk-backed staging can reduce heap pressure but needs quotas and cleanup. For compressed input, the expanded-byte budget matters independently. Verification should use a growing source or controlled stream, since a static small fixture cannot expose a check-then-read race.”

**Example:** An 8 MiB wire limit and a 100,000-record limit protect different resources.

**Deep dive / verification:** O(n) reading with bounded buffering; retained domain objects can still be O(records). Budget downstream queues too.

**Follow-ups:** Is a larger maximum heap the fix? It may buy time, but does not enforce a finite input contract.

**Primary reference:** [Java 21 Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**12. Creating a directory tree fails halfway through. Can a retry assume that no directories were created?**

**Say aloud:** “A convenience operation is not necessarily a transaction. Creating several missing ancestors can leave a partial tree if a later step fails. I would make retries tolerate already existing directories and distinguish an existing directory from a conflicting regular file. Cleanup must be limited to paths this operation demonstrably owns; recursively deleting a shared ancestor to simulate rollback could destroy another job’s work. A unique private work directory simplifies that ownership. I would only expose the finished artifact after validation, and record enough identity to reclaim abandoned work later. Tests should inject a conflict at an intermediate component and verify that retry and cleanup preserve unrelated siblings.”

**Example:** Creating workspace/a/b fails if a is a regular file; previously created ancestors may remain in other failure paths.

**Deep dive / verification:** O(depth) metadata work, with permissions and concurrent creation as failure boundaries. No automatic all-or-nothing tree creation.

**Follow-ups:** Does createDirectories guarantee final permissions everywhere? Existing parents retain their attributes; verify the security policy separately.

**Primary reference:** [Java 21 Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html).

---

**Runnable progress helper for question 4**

The caller owns the channel and buffer. This helper consumes the buffer; it does not close the channel, roll back partial output, or implement nonblocking readiness. A zero result deliberately fails rather than spinning.

```java
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.WritableByteChannel;
import java.util.Objects;

public final class WriteProgress {
    public static void writeFully(WritableByteChannel channel, ByteBuffer buffer)
            throws IOException {
        Objects.requireNonNull(channel);
        Objects.requireNonNull(buffer);
        while (buffer.hasRemaining()) {
            if (channel.write(buffer) == 0) {
                throw new IOException("No write progress");
            }
        }
    }
}
```

**Topic coverage and next set**

File publication, atomic reservation, durability boundaries, partial progress, transfer accounting, process versus thread coordination, notification reconciliation, resource lifetime, error classification, identity, bounded reads and retry ownership. Next: connect these boundaries to durable Spring ingestion jobs and database artifact catalogs, including restart reconciliation and storage failure injection. Review earlier transaction and outbox sets first; do not treat local files as a substitute for those guarantees.
