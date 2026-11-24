import java.time.Duration;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicInteger;

class MicroservicesExampleChecks {
  static void check(boolean ok) {
    if (!ok) throw new AssertionError();
  }
  public static void main(String[] args) throws Exception {
    check(GatewayExample.route("/orders").service().equals("order-service"));
    check(GatewayExample.route("/catalog/items").service().equals("catalog-service"));
    try {
      GatewayExample.route("/orders-archive");
      throw new AssertionError("Unrelated route reached Orders");
    } catch (IllegalArgumentException expected) { }

    var inbox = new InboxExample();
    var contenders = java.util.concurrent.Executors.newFixedThreadPool(2);
    try {
      var start = new java.util.concurrent.CountDownLatch(1);
      var first = contenders.submit(() -> { start.await(); return inbox.reserve("reserve-A"); });
      var duplicate = contenders.submit(() -> { start.await(); return inbox.reserve("reserve-A"); });
      start.countDown();
      check(first.get(2, java.util.concurrent.TimeUnit.SECONDS));
      check(duplicate.get(2, java.util.concurrent.TimeUnit.SECONDS));
      check(!inbox.reserve("reserve-B"));
    } finally {
      contenders.shutdownNow();
    }

    var view = new OrderProjectionExample();
    view.apply(new OrderProjectionExample.Snapshot(3, "CONFIRMED"));
    view.apply(new OrderProjectionExample.Snapshot(2, "PAYING"));
    check(view.current().status().equals("CONFIRMED"));
    check(OrderReplayExample.replay(java.util.List.of()) == OrderReplayExample.State.NEW);
    check(OrderReplayExample.replay(java.util.List.of(
        OrderReplayExample.Event.PLACED, OrderReplayExample.Event.CONFIRMED)) == OrderReplayExample.State.CONFIRMED);
    try {
      OrderReplayExample.replay(java.util.List.of(OrderReplayExample.Event.CONFIRMED));
      throw new AssertionError("Out-of-order confirmation accepted");
    } catch (IllegalStateException expected) { }
    check(HistoryCutoverExample.selectWriteOwner(false, true, true) == HistoryCutoverExample.Owner.LEGACY);
    check(HistoryCutoverExample.selectWriteOwner(true, true, false) == HistoryCutoverExample.Owner.PAUSED);
    check(HistoryCutoverExample.selectWriteOwner(true, false, true) == HistoryCutoverExample.Owner.PAUSED);
    check(HistoryCutoverExample.selectWriteOwner(true, true, true) == HistoryCutoverExample.Owner.NEW);
    check(RetryOwnershipExample.worstCaseAttempts(2, 3) == 6);
    check(RetryOwnershipExample.worstCaseAttempts(Integer.MAX_VALUE, 3) == 6442450941L);

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
