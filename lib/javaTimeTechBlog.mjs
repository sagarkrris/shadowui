export const JAVA_TIME_BLOG = {
  id: 'java-time-production',
  title: 'Java Time in Production: Instants, Zones, Deadlines, and Schedules',
  category: 'Java backend correctness',
  javaRelease: 17,
  summary: 'A practical Java 17 course on modeling civil time, DST boundaries, monotonic deadlines, durable schedule identities, and safe recovery from missed work.',
  lessons: ['Use an Instant for a moment, a LocalDate for a business date, and a ZonedDateTime only when a zone rule is part of the contract.', 'Treat daylight-saving gaps and overlaps as explicit product decisions, not parser accidents.', 'Keep elapsed-time deadlines monotonic and make scheduled work durable, idempotent, and reconciled after downtime.'],
  sections: [
    { heading: 'Course goal', body: 'Make time a deliberate domain boundary. The Java 17 examples are small, runnable decision models; they do not schedule OS jobs, store data durably, or replace a time-zone database update process.' },
    { heading: 'Production lens', body: 'Clock values, zone rules, recurrence policy, and completion evidence all outlive a request. Inject a Clock in application code, record the selected zone and schedule version, and use a durable idempotency key before an external effect.' },
  ],
  interviewQuestions: ['Why is LocalDateTime insufficient to represent a globally ordered event?', 'What should happen when a requested local time does not exist during a spring-forward transition?', 'Why must a timeout use elapsed monotonic time rather than wall-clock time?', 'How do you prevent a restarted scheduler from delivering the same side effect twice?'],
  practice: 'Choose one user-visible deadline and one recurring job. Write their time basis, zone policy, DST gap/overlap behavior, durable identity, late-run policy, and reconciliation signal.',
  capstone: { title: 'Capstone: Run a customer report at 09:00 local time', scenario: 'Customers choose a region and expect one report for each local business day. A deployment spans the daylight-saving transition and one worker restarts after dispatching an email but before recording completion.', steps: ['Persist the customer zone, local schedule rule, policy version, and a deterministic run key such as customer plus business date plus schedule version.', 'Choose and document gap and overlap behavior; derive the due instant from the zone rules rather than adding 24 hours to yesterday’s instant.', 'Claim the durable run once, use the same idempotency key for delivery, record a known result, and reconcile UNKNOWN dispatches before attempting another effect.'], outcome: 'Produce an observable schedule contract that survives DST, replicas, restart, and uncertain delivery without silently skipping or duplicating a report.' },
};

export const JAVA_TIME_CHAPTERS = [
  { title: '1. Model a moment, a local date, and a zone separately', lesson: 'An Instant is one point on the global timeline. A LocalDate is a calendar label with no time or zone. A LocalDateTime is only a wall-clock reading until a ZoneId gives it rules. Store or compare the type that matches the promise: an audit event normally needs Instant; a tax period may need LocalDate; a customer appointment needs local time plus zone and a resolution policy.', whenToUse: 'Use Instant for ordered events, expiration evidence, and cross-region APIs; retain ZoneId with user-facing schedules.', avoid: 'Avoid using the server default zone, treating LocalDateTime as globally ordered, or deriving a business date by truncating UTC.', diagramKey: 'timeTypes', example: `import java.time.*;
final class TimeTypesExample {
  static Instant auditMoment(Clock clock) { return clock.instant(); }
  static LocalDate businessDate(Instant moment, ZoneId zone) {
    if (moment == null || zone == null) throw new IllegalArgumentException();
    return moment.atZone(zone).toLocalDate();
  }
}`, exercise: 'For a receipt created in Tokyo and viewed in London, name which fields are Instant, LocalDate, and ZoneId.', quiz: 'Why can two different local wall-clock readings describe the same instant?', answer: 'A zone offset converts local time to the timeline. Different zones can display the same Instant with different local dates and clock values; the audit identity is the Instant, while each display uses its chosen ZoneId.' },
  { title: '2. Resolve daylight-saving gaps and overlaps explicitly', lesson: 'Zone rules can make a local time invalid (a spring-forward gap) or ambiguous (a fall-back overlap). Do not silently rely on an implementation default. Ask the rules for valid offsets, reject a gap unless product policy shifts it, and select an overlap offset deterministically while recording that policy.', whenToUse: 'Use explicit resolution for appointments, local recurring work, cutoffs, and any UI that accepts local date-times.', avoid: 'Avoid assuming every local day has 24 hours or adding one day as 24 elapsed hours to preserve a wall-clock schedule.', diagramKey: 'dstResolution', example: `import java.time.*;
import java.time.zone.*;
final class DstResolutionExample {
  static ZonedDateTime resolve(LocalDateTime local, ZoneId zone, boolean laterOffset) {
    var offsets = zone.getRules().getValidOffsets(local);
    if (offsets.isEmpty()) throw new IllegalArgumentException("local time is in a gap");
    var offset = offsets.get(laterOffset && offsets.size() == 2 ? 1 : 0);
    return ZonedDateTime.ofLocal(local, zone, offset);
  }
}`, exercise: 'Pick a zone with DST. Specify whether a nonexistent 02:30 is rejected or moved, and whether an overlap runs once or twice.', quiz: 'Why is an overlap not safely solved by “choose whatever offset Java gives me”?', answer: 'Both offsets are valid and lead to distinct instants. An implicit choice hides a business decision, can differ after a library or rule update, and makes replay or customer explanation difficult.' },
  { title: '3. Persist the schedule rule and derive each run identity', lesson: 'A recurring schedule is not “run every 24 hours.” Persist the local rule, ZoneId, rule version, and a business-date or occurrence identity; then derive the due instant under the chosen zone rules. The identity must be stable across retry and restart. Changing schedule semantics creates a new version instead of rewriting already claimed runs.', whenToUse: 'Use a durable run key for statements, reports, reminders, and any work whose duplicate or missed execution matters.', avoid: 'Avoid keeping only next-run milliseconds in one process, deriving keys from current server time, or reinterpreting historical runs under a new rule.', diagramKey: 'scheduleIdentity', example: `import java.time.*;
final class ScheduleIdentityExample {
  record RunKey(String customerId, LocalDate businessDate, int version) {
    RunKey { if (customerId == null || customerId.isBlank() || businessDate == null || version < 1) throw new IllegalArgumentException(); }
  }
  static String idempotencyKey(RunKey key) {
    return key.customerId() + ":" + key.businessDate() + ":v" + key.version();
  }
}`, exercise: 'Define the run key for a monthly invoice and explain what changes when its 09:00 policy moves to 10:00.', quiz: 'Why is “today at 09:00” not an idempotency key?', answer: 'It depends on an observer’s clock and zone and is not a durable identity. A persisted subject, business occurrence, and policy version make retries and reconciliation refer to the same intended work.' },
  { title: '4. Spend deadlines with monotonic elapsed time', lesson: 'Wall clocks can be corrected forwards or backwards by NTP, operators, or virtualization. A timeout is elapsed duration, so create and consume it with a monotonic source such as System.nanoTime in production. Pass the remaining budget to each child operation; if no usable budget remains, do not begin another attempt. This model receives monotonic readings as arguments to stay deterministic.', whenToUse: 'Use monotonic deadline budgeting for connection, queue, remote-call, and graceful-drain timeouts.', avoid: 'Avoid comparing Instant.now() against a timeout deadline, restarting a full timeout at every layer, or using a lost response as proof a write failed.', diagramKey: 'monotonicDeadline', example: `final class MonotonicDeadlineExample {
  static long remainingNanos(long startedNanos, long timeoutNanos, long nowNanos) {
    if (timeoutNanos < 0) throw new IllegalArgumentException();
    // Same JVM; actual elapsed interval must be less than 2^63 ns.
    // Signed subtraction deliberately handles nanoTime counter wrap.
    long elapsed = nowNanos - startedNanos;
    if (elapsed < 0) throw new IllegalArgumentException("invalid elapsed interval");
    return elapsed >= timeoutNanos ? 0 : timeoutNanos - elapsed;
  }
}`, exercise: 'Allocate a 500 ms caller budget across queueing, connect, response, and a response reserve. Identify when a retry must stop.', quiz: 'Why does a monotonic deadline not resolve whether a timed-out write took effect?', answer: 'It only says the caller stopped waiting after an elapsed interval. The remote side may have committed, so a write needs a retained operation identity and reconciliation rather than a fresh retry.' },
  { title: '5. Claim work once and preserve UNKNOWN delivery', lesson: 'Multiple replicas can discover the same due run, and a worker can crash after an external dispatch but before its completion write. Claim the durable run atomically, persist the exact idempotency key before dispatch, and distinguish NOT_STARTED, IN_FLIGHT, CONFIRMED, REJECTED, and UNKNOWN. Cancellation stops local waiting; it does not prove an accepted remote effect was undone.', whenToUse: 'Use claim-once and reconciliation for scheduled notifications, settlements, imports, and cleanup with external effects.', avoid: 'Avoid a process-local “currently running” set, deleting a claim on timeout, or allowing several retry owners to dispatch the same work.', diagramKey: 'scheduledDelivery', example: `import java.util.*;
final class ScheduledDeliveryExample {
  enum State { NOT_STARTED, IN_FLIGHT, CONFIRMED, REJECTED, UNKNOWN }
  static State responseLost(State state) {
    if (state != State.IN_FLIGHT) throw new IllegalStateException();
    return State.UNKNOWN;
  }
  static State reconcile(State state, Optional<Boolean> delivered) {
    Objects.requireNonNull(state);
    Objects.requireNonNull(delivered);
    // false means definitive rejection for this exact key, never pending/absent.
    if (state != State.UNKNOWN) return state;
    if (delivered.isEmpty()) return State.UNKNOWN;
    return delivered.get() ? State.CONFIRMED : State.REJECTED;
  }
}`, exercise: 'Write the durable uniqueness constraint and reconciliation query for a daily report that may have lost its provider response.', quiz: 'What does an empty provider lookup mean after a timeout?', answer: 'It is unresolved unless the provider contract says a negative lookup is definitive for this key and retention period. Keep UNKNOWN or reconcile later; do not invent a second operation key.' },
  { title: '6. Recover missed runs with an explicit lateness policy', lesson: 'Downtime, long pauses, and ownership changes create overdue work. Decide per schedule whether to run every missed occurrence, coalesce to one latest occurrence, or skip after a business cutoff; retain the decision and metric. Recovery must enumerate durable due identities, not infer them from a single in-memory next-run value. Backfill at bounded concurrency so recovery does not starve current work.', whenToUse: 'Use a documented catch-up policy for reports, reminders, retention tasks, and billing-like schedules.', avoid: 'Avoid silently replaying an unbounded backlog, advancing a checkpoint before the durable effect, or measuring only process uptime.', diagramKey: 'scheduleRecovery', example: `import java.time.*;
final class ScheduleRecoveryExample {
  enum Action { WAIT, RUN, SKIP }
  static Action overdueAction(Instant due, Instant now, Duration maximumLateness) {
    if (due == null || now == null || maximumLateness == null || maximumLateness.isNegative()) throw new IllegalArgumentException();
    if (now.isBefore(due)) return Action.WAIT;
    return Duration.between(due, now).compareTo(maximumLateness) <= 0 ? Action.RUN : Action.SKIP;
  }
}`, exercise: 'For a legal statement, an analytics refresh, and a password-reset email, choose a catch-up policy and explain its user-visible consequence.', quiz: 'Why should a recovery worker enumerate durable occurrences before changing a checkpoint?', answer: 'A checkpoint is ownership evidence. Advancing it first can silently skip a run after a crash; enumerate and atomically claim or record the chosen terminal decision before moving recovery progress.' },
];

// Authored traces are shared by the public and workspace readers.
const TIME_WALKTHROUGHS = [
  'At 2026-01-01T23:30Z, Tokyo has already reached January 2. Keep the audit Instant and derive the business date using the owning zone. Clock timestamps do not prove causal ordering across machines; use domain sequence/version evidence when ordering matters.',
  'New York 2026-03-08 02:30 has no offset and is rejected. On 2026-11-01, 01:30 resolves to 05:30Z with the earlier offset or 06:30Z with the later one. Retain the selected instant and offset for accepted appointments; review future unclaimed occurrences when zone rules change.',
  'Customer-7 on November 1 under schedule v2 retains customer-7:2026-11-01:v2 across retries. This key assumes one schedule per customer per day; multiple schedules need a schedule ID. Apply new versions only to future unclaimed occurrences. A version bump must never recreate an already claimed business occurrence.',
  'System.nanoTime readings may be negative and may wrap from Long.MAX_VALUE to Long.MIN_VALUE. Subtract readings from the same JVM and require actual elapsed time below 2^63 nanoseconds. Starting at -100 and observing -80 spends 20 of a 50 ns budget, leaving 30. Never persist these readings across restarts or compare different JVM origins.',
  'After dispatch, a lost response leaves UNKNOWN. Empty or pending provider evidence keeps it unresolved; false in this model means definitive rejection of this exact operation. Retain the original key and retry only under a provider same-key/same-intent guarantee whose retention covers the retry. These pure decisions acquire no resources and do not implement atomic claims: persist transitions with an expected state/version and current owner token so stale workers cannot overwrite a newer result. Contradictory terminal evidence needs a separate discrepancy record.',
  'One nanosecond before the due instant returns WAIT. At the due instant, or exactly the allowed lateness boundary, return RUN; one nanosecond beyond the cutoff returns SKIP. A durable claim must remain recoverable after a checkpoint advances: never discard unfinished claimed work. Track oldest overdue age, terminal skips, and unresolved dispatches with bounded metric labels.',
];
JAVA_TIME_CHAPTERS.forEach((chapter, index) => { chapter.walkthrough = TIME_WALKTHROUGHS[index]; });
