import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.*;
import java.lang.reflect.Modifier;

class ConnectionPoolExampleChecks {
  static void check(boolean condition) {
    if (!condition) throw new AssertionError();
  }

  public static void main(String[] args) throws Exception {
    var releases = new AtomicInteger();
    var lease = ConnectionLeaseExample.checkout(releases::incrementAndGet);
    lease.close();
    lease.close();
    check(releases.get() == 1);
    check(ConnectionLeaseExample.query(releases::incrementAndGet).equals("result"));
    check(releases.get() == 2);

    check(PoolDeadlineExample.remainingMillis(500, 700) == 0);
    check(PoolDeadlineExample.acquireTimeoutMillis(500, 100, 80) == 320);
    check(PoolDeadlineExample.acquireTimeoutMillis(500, 450, 80) == 0);
    check(PoolDeadlineExample.mayStartQuery(500, 200, 300));
    check(!PoolDeadlineExample.mayStartQuery(500, 201, 300));

    check(TransactionBoundaryExample.next(TransactionBoundaryExample.Step.VALIDATED, true)
      == TransactionBoundaryExample.Step.IN_TRANSACTION);
    check(TransactionBoundaryExample.next(TransactionBoundaryExample.Step.IN_TRANSACTION, false)
      == TransactionBoundaryExample.Step.ROLLED_BACK);
    try {
      TransactionBoundaryExample.next(TransactionBoundaryExample.Step.REMOTE_CALLED, true);
      throw new AssertionError();
    } catch (IllegalStateException expected) { }

    var normalSql = new PoolPressureExample.Snapshot(10, 0, 4, Duration.ofMillis(20), Duration.ofMillis(180));
    check(PoolPressureExample.likelyCause(normalSql).equals("long-checkout-or-non-query-wait"));
    var slowQuery = new PoolPressureExample.Snapshot(10, 0, 4, Duration.ofMillis(180), Duration.ofMillis(180));
    check(PoolPressureExample.likelyCause(slowQuery).equals("query-or-database-pressure"));

    var race = new CompletionRaceExample();
    check(race.releaseOnce());
    check(!race.releaseOnce());
    check(CompletionRaceExample.retryDecision(false, true).equals("RECONCILE"));
    check(CompletionRaceExample.retryDecision(true, false).equals("DO_NOT_RETRY"));
    check(CompletionRaceExample.retryDecision(true, true).equals("RETRY"));

    var admission = new PoolAdmissionExample(1);
    for (var constructor : PoolAdmissionExample.Permit.class.getDeclaredConstructors())
      check(Modifier.isPrivate(constructor.getModifiers()));
    var permit = admission.tryAdmit().orElseThrow();
    check(admission.tryAdmit().isEmpty());
    var closers = Executors.newFixedThreadPool(2);
    var start = new CountDownLatch(1);
    try {
      Callable<Void> close = () -> {
        check(start.await(3, TimeUnit.SECONDS));
        permit.close();
        return null;
      };
      var first = closers.submit(close);
      var second = closers.submit(close);
      start.countDown();
      first.get(3, TimeUnit.SECONDS);
      second.get(3, TimeUnit.SECONDS);
    } finally {
      start.countDown();
      closers.shutdownNow();
      check(closers.awaitTermination(3, TimeUnit.SECONDS));
    }
    permit.close();
    var replacement = admission.tryAdmit().orElseThrow();
    check(admission.tryAdmit().isEmpty());
    permit.close(); // Old cleanup cannot release the replacement owner's slot.
    check(admission.tryAdmit().isEmpty());
    replacement.close();
    System.out.println("Connection pool checks passed");
  }
}
