import java.util.concurrent.CompletableFuture;

class CacheStampedeExampleChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  static void reject(Runnable action) { try { action.run(); throw new AssertionError(); } catch (IllegalArgumentException expected) { } }
  public static void main(String[] args) {
    check(CacheKeyExample.key("tenant-a", "product-7").equals("tenant-a:product-7"));
    reject(() -> CacheKeyExample.key("TENANT", "p")); reject(() -> CacheKeyExample.key("a", ""));
    var flight = new SingleFlightExample(); var owner = new CompletableFuture<String>();
    var first = flight.join("k", owner); var second = flight.join("k", new CompletableFuture<>()); first.cancel(false); owner.complete("value");
    check(second.join().equals("value")); flight.remove("k", new CompletableFuture<>()); check(flight.join("k", new CompletableFuture<>()) != null); flight.remove("k", owner);
    check(CacheBudgetExample.remaining(10, 9) == 1 && CacheBudgetExample.remaining(10, 10) == 0); check(CacheBudgetExample.mayStart(1, 0, 1)); check(!CacheBudgetExample.mayStart(0, 0, 1)); check(!CacheBudgetExample.mayStart(1, 1, 1));
    check(CacheOutcomeExample.action(CacheOutcomeExample.Outcome.FAILED).equals("RETRY_BY_POLICY")); check(CacheOutcomeExample.action(CacheOutcomeExample.Outcome.CANCELLED).equals("DO_NOT_RETRY")); check(CacheOutcomeExample.action(CacheOutcomeExample.Outcome.UNKNOWN).equals("RECONCILE_SAME_OPERATION"));
    var current = new CacheVersionExample.Value(8, "new"); var old = new CacheVersionExample.Value(7, "old"); check(CacheVersionExample.publish(current, old).equals(current)); check(CacheVersionExample.publish(old, current).equals(current));
    check(CacheFreshnessExample.serve(true, false, false).equals("FRESH")); check(CacheFreshnessExample.serve(false, true, false).equals("STALE_REVALIDATE")); check(CacheFreshnessExample.serve(false, false, false).equals("FAIL_CLOSED"));
    System.out.println("Cache stampede checks passed");
  }
}
