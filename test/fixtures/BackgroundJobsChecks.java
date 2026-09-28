import java.time.*;
import java.util.*;
import java.util.concurrent.*;

class BackgroundJobsChecks {
  static void check(boolean condition, String message) {
    if (!condition) throw new AssertionError(message);
  }
  static void rejected(Runnable action) {
    try { action.run(); throw new AssertionError("invalid input accepted"); }
    catch (IllegalArgumentException expected) { }
  }
  public static void main(String[] args) throws Exception {
    rejected(() -> new JobAdmissionExample(0));
    rejected(() -> new JobAdmissionExample(-1));
    var gate = new JobAdmissionExample(1);
    var first = gate.tryStart().orElseThrow();
    check(gate.tryStart().isEmpty(), "capacity exceeded");
    first.close();
    first.close();
    var second = gate.tryStart().orElseThrow();
    first.close(); // Old completion cannot release a newer acquisition.
    check(gate.tryStart().isEmpty(), "duplicate close inflated capacity");
    second.close();
    try (var permit = gate.tryStart().orElseThrow()) {
      throw new IllegalStateException("worker failed");
    } catch (IllegalStateException expected) { }
    try (var permit = gate.tryStart().orElseThrow()) {
      check(gate.tryStart().isEmpty(), "exceptional cleanup lost permit ownership");
    }

    var pool = Executors.newFixedThreadPool(4);
    try {
      var shared = gate.tryStart().orElseThrow();
      var start = new CountDownLatch(1);
      var closers = new ArrayList<Future<?>>();
      for (int i = 0; i < 4; i++) closers.add(pool.submit(() -> {
        start.await();
        shared.close();
        return null;
      }));
      start.countDown();
      for (var closer : closers) closer.get(5, TimeUnit.SECONDS);
      var attempts = new ArrayList<Future<Optional<JobAdmissionExample.Permit>>>();
      for (int i = 0; i < 8; i++) attempts.add(pool.submit(gate::tryStart));
      var acquired = new ArrayList<JobAdmissionExample.Permit>();
      for (var attempt : attempts) attempt.get(5, TimeUnit.SECONDS).ifPresent(acquired::add);
      check(acquired.size() == 1, "concurrent close/admission exceeded limit");
      acquired.forEach(JobAdmissionExample.Permit::close);
    } finally { pool.shutdownNow(); }

    for (boolean deadline : new boolean[]{false, true}) {
      check(DrainDecisionExample.onDrain(DrainDecisionExample.EffectState.NOT_DISPATCHED, deadline)
          == DrainDecisionExample.Outcome.DEFERRED, "unsent work may defer");
      check(DrainDecisionExample.onDrain(DrainDecisionExample.EffectState.CONFIRMED, deadline)
          == DrainDecisionExample.Outcome.COMPLETE, "confirmed work completes");
      check(DrainDecisionExample.onDrain(DrainDecisionExample.EffectState.UNKNOWN, deadline)
          == DrainDecisionExample.Outcome.UNKNOWN, "ambiguity must survive drain");
      check(DrainDecisionExample.onDrain(DrainDecisionExample.EffectState.IN_FLIGHT, deadline)
          == (deadline ? DrainDecisionExample.Outcome.UNKNOWN : DrainDecisionExample.Outcome.DRAINING),
          "dispatched work must never defer");
    }
    var due = Instant.parse("2026-09-28T00:00:00Z");
    var job = new JobIdentityExample.Job("invoice-1", due, 1);
    check(JobIdentityExample.id(job).equals(JobIdentityExample.id(new JobIdentityExample.Job("invoice-1", due, 1))), "retry identity changed");
    check(!JobIdentityExample.id(job).equals(JobIdentityExample.id(new JobIdentityExample.Job("invoice-1", due.plusSeconds(1), 1))), "occurrences collided");
    rejected(() -> new JobIdentityExample.Job("", due, 1));
    check(!FencingExample.mayWrite(8, new FencingExample.Claim(7, 100), 50), "stale token accepted");
    check(!FencingExample.mayWrite(8, new FencingExample.Claim(8, 100), 101), "expired claim accepted");
    check(FencingExample.mayWrite(8, new FencingExample.Claim(8, 100), 50), "current claim rejected");
    var intent = new JobRetryKeyExample.Intent("invoice-1", "provider-key-1");
    check(JobRetryKeyExample.retryKey(intent).equals("provider-key-1"), "retry key changed");
    check(JobRetryKeyExample.reconcile(Map.of(), intent).isEmpty(), "unknown lookup fabricated result");
    check(JobRetryKeyExample.reconcile(Map.of("provider-key-1", "receipt"), intent).orElseThrow().equals("receipt"), "receipt lost");
    check(JobLatenessExample.lateness(due, due.minusSeconds(1)).isZero(), "negative lateness");
    check(JobLatenessExample.lateness(due, due.plusSeconds(2)).equals(Duration.ofSeconds(2)), "lateness incorrect");
    check(!JobLatenessExample.overdue(Duration.ofSeconds(2), Duration.ofSeconds(2)), "threshold equality");
    check(JobLatenessExample.overdue(Duration.ofSeconds(3), Duration.ofSeconds(2)), "overdue missed");
    System.out.println("Background job checks passed: six Java 17 examples, admission, drain, identity, fencing, reconciliation, lateness");
  }
}
