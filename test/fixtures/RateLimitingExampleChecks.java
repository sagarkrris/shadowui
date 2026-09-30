import java.util.concurrent.*;

class RateLimitingExampleChecks {
  static void check(boolean condition) { if (!condition) throw new AssertionError(); }
  public static void main(String[] args) throws Exception {
    check(RateLimitKeyExample.key(new RateLimitKeyExample.Principal("tenant-a"), "order-submit").equals("tenant-a:order-submit"));
    try { RateLimitKeyExample.key(new RateLimitKeyExample.Principal("x"), "ORDER"); throw new AssertionError(); } catch (IllegalArgumentException expected) { }

    check(TokenBucketMathExample.refill(1, 2500, 2, 4) == 4);
    check(TokenBucketMathExample.refill(1, 999, 2, 4) == 1);
    check(TokenBucketMathExample.refill(1, Long.MAX_VALUE, Long.MAX_VALUE, 4) == 4);
    check(TokenBucketMathExample.canAdmit(1));
    check(!TokenBucketMathExample.canAdmit(0));

    var limiter = new AtomicAdmissionExample(1);
    var pool = Executors.newFixedThreadPool(4);
    try {
      var start = new CountDownLatch(1);
      var admitted = new java.util.ArrayList<Future<Boolean>>();
      for (int i = 0; i < 4; i++) admitted.add(pool.submit(() -> { start.await(); return limiter.tryAdmit(); }));
      start.countDown();
      int count = 0; for (var result : admitted) if (result.get()) count++;
      check(count == 1 && limiter.remaining() == 0);
    } finally { pool.shutdownNow(); }

    check(RateLimitRetryExample.nextAction(RateLimitRetryExample.Admission.REJECTED).equals("RETRY_BY_POLICY"));
    check(RateLimitRetryExample.nextAction(RateLimitRetryExample.Admission.ACCEPTED).equals("RECONCILE_SAME_OPERATION"));
    check(RateLimitRetryExample.nextAction(RateLimitRetryExample.Admission.UNKNOWN).equals("RECONCILE_SAME_OPERATION"));
    check(DistributedLimiterDecisionExample.decide(DistributedLimiterDecisionExample.Store.UNAVAILABLE, true, true).equals("FAIL_CLOSED"));
    check(DistributedLimiterDecisionExample.decide(DistributedLimiterDecisionExample.Store.UNAVAILABLE, false, true).equals("BOUNDED_LOCAL_FALLBACK"));
    check(RateLimitSignalExample.diagnosis(new RateLimitSignalExample.Snapshot(2, 0, 1, 1)).equals("WORK_IS_STILL_OVERLOADED"));
    check(RateLimitSignalExample.diagnosis(new RateLimitSignalExample.Snapshot(2, 1, 0, 0)).equals("ADMISSION_PROTECTING_CAPACITY"));
    System.out.println("Rate limiting checks passed");
  }
}
