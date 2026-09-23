import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

class AdditionalBlogChecks {
  static void check(boolean condition) {
    if (!condition) throw new AssertionError();
  }
  public static void main(String[] args) throws Exception {
    class Provider implements IdempotencyExample.Provider {
      int effects;
      final Map<String, IdempotencyExample.Receipt> results = new HashMap<>();
      final Map<String, Long> intents = new HashMap<>();
      public IdempotencyExample.Receipt capture(IdempotencyExample.Payment payment) throws IOException {
        if (intents.containsKey(payment.key()) && intents.get(payment.key()) != payment.cents())
          throw new IllegalArgumentException("changed intent");
        if (results.containsKey(payment.key())) return results.get(payment.key());
        intents.put(payment.key(), payment.cents());
        results.put(payment.key(), new IdempotencyExample.Receipt("provider-" + ++effects));
        throw new IOException("response lost after commit");
      }
      public Optional<IdempotencyExample.Receipt> lookup(String key) {
        return Optional.ofNullable(results.get(key));
      }
    }
    var provider = new Provider();
    var client = new IdempotencyExample(provider);
    var payment = new IdempotencyExample.Payment("order-1", 1200);
    try { client.charge(payment); throw new AssertionError(); } catch (IOException expected) { }
    check(client.reconcile("order-1").isPresent());
    client = new IdempotencyExample(provider); // Simulated local process restart.
    check(client.charge(payment).equals(client.reconcile("order-1").orElseThrow()));
    check(provider.effects == 1);
    try {
      client.charge(new IdempotencyExample.Payment("order-1", 1300));
      throw new AssertionError();
    } catch (IllegalArgumentException expected) { }
    check(client.reconcile("unknown").isEmpty());

    var cache = new VersionedCacheExample();
    cache.putIfNewer("p", new VersionedCacheExample.Value(1, "old"));
    cache.invalidate("p", 2);
    check(cache.get("p") == null);
    check(!cache.putIfNewer("p", new VersionedCacheExample.Value(1, "late")));
    check(cache.putIfNewer("p", new VersionedCacheExample.Value(2, "new")));
    cache.evict("p");
    cache.invalidate("p", 1); // Reordered invalidation cannot lower the floor.
    check(!cache.putIfNewer("p", new VersionedCacheExample.Value(1, "stale")));
    check(cache.putIfNewer("p", new VersionedCacheExample.Value(3, "newest")));

    var jobs = new ArrayDeque<Runnable>();
    var loads = new StampedeExample(jobs::add, 1);
    var calls = new AtomicInteger();
    var first = loads.load("key", () -> { calls.incrementAndGet(); return "value"; });
    var second = loads.load("key", () -> { throw new AssertionError("duplicate load"); });
    check(jobs.size() == 1);
    check(loads.load("other", () -> "overflow").isCompletedExceptionally());
    first.cancel(false); // Does not cancel the owner or another waiter.
    jobs.remove().run();
    check(second.join().equals("value") && calls.get() == 1);
    var failure = loads.load("key", () -> { throw new IllegalStateException(); });
    jobs.remove().run();
    check(failure.isCompletedExceptionally());
    var recovered = loads.load("key", () -> "recovered");
    jobs.remove().run();
    check(recovered.join().equals("recovered"));
    var rejectOnce = new AtomicInteger();
    var rejected = new StampedeExample(task -> {
      if (rejectOnce.getAndIncrement() == 0) throw new RejectedExecutionException();
      task.run();
    }, 1);
    check(rejected.load("key", () -> "x").isCompletedExceptionally());
    check(rejected.load("key", () -> "ok").join().equals("ok"));
    // Synchronous completion callback starts a replacement; old cleanup must not remove it.
    var old = loads.load("key", () -> "old");
    var chained = old.thenCompose(value -> loads.load("key", () -> "replacement"));
    jobs.remove().run();
    var waiter = loads.load("key", () -> { throw new AssertionError("removed replacement"); });
    check(jobs.size() == 1);
    jobs.remove().run();
    check(chained.join().equals("replacement") && waiter.join().equals("replacement"));

    check(RetryPolicyExample.maximumCalls(3, 3) == 27);
    check(RetryPolicyExample.maximumCalls(0, 3) == 1);
    check(!RetryPolicyExample.retryable(401) && !RetryPolicyExample.retryable(501));
    check(RetryPolicyExample.delayMillis(100, 100) <= 1000);

    var gate = new LoadSheddingExample(1, 1);
    var regular = gate.tryEnter(LoadSheddingExample.Priority.NORMAL).orElseThrow();
    check(gate.tryEnter(LoadSheddingExample.Priority.OPTIONAL).isEmpty());
    var critical = gate.tryEnter(LoadSheddingExample.Priority.CRITICAL).orElseThrow();
    check(gate.tryEnter(LoadSheddingExample.Priority.CRITICAL).isEmpty());
    regular.close(); regular.close(); // No double-release.
    var regularAgain = gate.tryEnter(LoadSheddingExample.Priority.NORMAL).orElseThrow();
    check(gate.tryEnter(LoadSheddingExample.Priority.CRITICAL).isEmpty());
    critical.close(); regularAgain.close();
    var concurrentGate = new LoadSheddingExample(0, 1);
    var pool = Executors.newFixedThreadPool(4);
    try {
      var attempts = new ArrayList<Future<Optional<LoadSheddingExample.Lease>>>();
      for (int i = 0; i < 20; i++)
        attempts.add(pool.submit(() -> concurrentGate.tryEnter(LoadSheddingExample.Priority.CRITICAL)));
      int admitted = 0;
      for (var attempt : attempts) if (attempt.get().isPresent()) admitted++;
      check(admitted == 1);
    } finally { pool.shutdownNow(); }

    check(StranglerRouterExample.route("/orders/history", true, false).target().equals("monolith"));
    check(StranglerRouterExample.route("/orders/history/1", true, true).target().equals("history-service"));
    check(StranglerRouterExample.route("/orders/history", false, true).target().equals("monolith"));
    check(StranglerRouterExample.route("/orders/history-export", true, true).target().equals("monolith"));

    var cdc = new CdcExample();
    cdc.apply(new CdcExample.Change("p1", "0/16B6C50", "event-a", "one"));
    cdc.apply(new CdcExample.Change("p1", "0/16B7000", "event-b", "two"));
    cdc.apply(new CdcExample.Change("p1", "0/16B6C50", "event-a", "one")); // Replay.
    cdc.apply(new CdcExample.Change("p2", "opaque-token", "event-c", "three"));
    check(cdc.snapshot().checkpoints().get("p1").equals("0/16B7000"));
    check(cdc.snapshot().checkpoints().get("p2").equals("opaque-token"));
    check(cdc.snapshot().values().size() == 3);
  }
}
