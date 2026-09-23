import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicInteger;

class MicroservicesExampleChecks {
  static void check(boolean ok) {
    if (!ok) throw new AssertionError();
  }
  public static void main(String[] args) throws Exception {
    var saga = new SagaOutboxExample();
    saga.placeOrder("order-1");
    var initial = saga.snapshot();
    check(initial.orders().get("order-1") == SagaOutboxExample.Status.RESERVING);
    check(initial.outbox().size() == 1);
    saga.placeOrder("order-1");
    check(saga.snapshot().outbox().size() == 1);
    saga.stockReserved("order-1");
    check(saga.snapshot().orders().get("order-1") == SagaOutboxExample.Status.PAYING);
    check(saga.snapshot().outbox().size() == 2);
    var firstEvent = initial.outbox().keySet().iterator().next();
    check(saga.markPublished(firstEvent));
    check(!saga.markPublished(firstEvent));
    check(saga.snapshot().outbox().size() == 1); // Acknowledgment preserves sibling event.
    saga.paymentRejected("order-1");
    check(saga.snapshot().orders().get("order-1") == SagaOutboxExample.Status.COMPENSATING);
    check(saga.snapshot().outbox().values().stream().anyMatch(e -> e.type().equals("ReleaseStock")));
    int pending = saga.snapshot().outbox().size();
    saga.paymentRejected("order-1");
    saga.paymentSucceeded("order-1"); // Stale reply cannot override compensation.
    check(saga.snapshot().outbox().size() == pending);
    saga.stockReleased("order-1");
    check(saga.snapshot().orders().get("order-1") == SagaOutboxExample.Status.CANCELLED);
    saga.placeOrder("order-2");
    saga.stockReserved("order-2");
    saga.paymentSucceeded("order-2");
    check(saga.snapshot().orders().get("order-2") == SagaOutboxExample.Status.CONFIRMED);
    check(initial.orders().get("order-1") == SagaOutboxExample.Status.RESERVING);

    var clock = new AtomicLong();
    var calls = new AtomicInteger();
    var delays = new java.util.ArrayList<Long>();
    var transientFailure = new IllegalStateException("temporary");
    String result = ResilienceExample.retry(remaining -> {
      check(remaining.toNanos() == 100_000_000L - clock.get());
      if (calls.incrementAndGet() < 3) throw transientFailure;
      return "ok";
    }, 3, Duration.ofMillis(100), ex -> ex == transientFailure, clock::get,
        nanos -> { delays.add(nanos); clock.addAndGet(nanos); }, upper -> upper);
    check(result.equals("ok") && calls.get() == 3);
    check(delays.equals(java.util.List.of(10_000_000L, 20_000_000L)));
    calls.set(0);
    try {
      ResilienceExample.retry(remaining -> { calls.incrementAndGet(); throw transientFailure; },
          3, Duration.ofSeconds(1), ex -> false, clock::get,
          nanos -> { throw new AssertionError("permanent failures must not sleep"); }, upper -> upper);
      throw new AssertionError();
    } catch (IllegalStateException expected) { check(calls.get() == 1); }
    calls.set(0);
    try {
      ResilienceExample.retry(remaining -> { calls.incrementAndGet(); throw transientFailure; },
          2, Duration.ofSeconds(1), ex -> true, clock::get, clock::addAndGet, upper -> upper);
      throw new AssertionError();
    } catch (IllegalStateException expected) { check(calls.get() == 2); }
    try {
      ResilienceExample.retry(remaining -> "unused", 0, Duration.ofSeconds(1),
          ex -> true, clock::get, clock::addAndGet, upper -> upper);
      throw new AssertionError();
    } catch (IllegalArgumentException expected) { }
    try {
      ResilienceExample.retry(remaining -> { throw transientFailure; }, 3, Duration.ofMillis(5),
          ex -> true, clock::get, clock::addAndGet, upper -> upper);
      throw new AssertionError();
    } catch (TimeoutException expected) { }
    try {
      ResilienceExample.retry(remaining -> { throw transientFailure; }, 3, Duration.ofSeconds(1),
          ex -> true, clock::get, nanos -> { throw new InterruptedException(); }, upper -> upper);
      throw new AssertionError();
    } catch (InterruptedException expected) { }
    try {
      ResilienceExample.retry(remaining -> { clock.addAndGet(10_000_000L); return "late"; },
          3, Duration.ofMillis(5), ex -> true, clock::get, clock::addAndGet, upper -> upper);
      throw new AssertionError();
    } catch (TimeoutException expected) { }
  }
}
