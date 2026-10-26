import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class ComprehensionChecks {
  static void check(boolean condition, String message) {
    if (!condition) throw new AssertionError(message);
  }

  interface CheckedAction { void run() throws Exception; }

  static <T extends Throwable> T expect(Class<T> type, CheckedAction action) {
    try { action.run(); }
    catch (Throwable failure) {
      if (type.isInstance(failure)) return type.cast(failure);
      throw new AssertionError("Expected " + type.getName(), failure);
    }
    throw new AssertionError("Expected " + type.getName());
  }

  static void arrays() {
    expect(ArrayIndexOutOfBoundsException.class,
        () -> ArrayBoundaryStarter.sum(new int[] {2, 3, 4}));
    expect(ArrayIndexOutOfBoundsException.class,
        () -> ArrayBoundaryStarter.sum(new int[0]));
    int[] values = {2, 3, 4};
    check(ArrayBoundaryReference.sum(values) == 9, "sum must return 9");
    check(Arrays.equals(values, new int[] {2, 3, 4}), "sum must not mutate");
    check(ArrayBoundaryReference.sum(new int[0]) == 0, "empty sum");
    check(ArrayBoundaryReference.sum(new int[] {7}) == 7, "single sum");
    check(ArrayBoundaryReference.sum(new int[] {-2, 3}) == 1, "negative sum");
    expect(NullPointerException.class, () -> ArrayBoundaryReference.sum(null));
  }

  static void strings() {
    check(StringValueStarter.isPaid("PAID"), "literal can hide identity defect");
    check(!StringValueStarter.isPaid(new String("PAID")), "starter identity defect");
    check(StringValueReference.isPaid("PAID"), "literal text");
    check(StringValueReference.isPaid(new String("PAID")), "independent equal text");
    for (String value : new String[] {null, "", "paid", "PENDING"}) {
      check(!StringValueReference.isPaid(value), "reject other codes");
    }
  }

  static void booleans() {
    check(BooleanRuleStarter.shouldEmail(true, false), "starter accepts unverified");
    check(BooleanRuleStarter.shouldEmail(false, true), "starter accepts inactive");
    for (boolean active : new boolean[] {false, true}) {
      for (boolean verified : new boolean[] {false, true}) {
        boolean expected = active && verified;
        check(BooleanRuleReference.shouldEmail(active, verified) == expected,
            "full eligibility truth table");
      }
    }
  }

  static void ownership() {
    List<Integer> original = new ArrayList<>(List.of(40, 90, 70));
    List<Integer> broken = ListOwnershipStarter.topTwo(original);
    check(original.equals(List.of(90, 70, 40)), "starter sorts caller list");
    broken.set(0, 0);
    check(original.equals(List.of(0, 70, 40)), "starter exposes backed view");
    expect(UnsupportedOperationException.class,
        () -> ListOwnershipStarter.topTwo(List.of(40, 90, 70)));

    List<Integer> source = new ArrayList<>(List.of(40, 90, 70));
    List<Integer> result = ListOwnershipReference.topTwo(source);
    check(result.equals(List.of(90, 70)), "top scores");
    check(source.equals(List.of(40, 90, 70)), "input order retained");
    result.set(0, 0);
    result.add(1);
    check(source.equals(List.of(40, 90, 70)), "independent mutable result");
    check(ListOwnershipReference.topTwo(List.of(40, 90, 70)).equals(List.of(90, 70)),
        "unmodifiable source supported");
    check(ListOwnershipReference.topTwo(List.of()).isEmpty(), "empty top scores");
    check(ListOwnershipReference.topTwo(List.of(5)).equals(List.of(5)), "one score");
    check(ListOwnershipReference.topTwo(List.of(7, 7, 3)).equals(List.of(7, 7)),
        "duplicates retained");
    expect(NullPointerException.class, () -> ListOwnershipReference.topTwo(null));
  }

  static void comparisons() {
    check(ComparisonOverflowStarter.compare(Integer.MAX_VALUE, -1) < 0,
        "starter wraps to wrong ordering sign");
    int[] values = {Integer.MIN_VALUE, -1, 0, 1, Integer.MAX_VALUE};
    for (int left : values) {
      for (int right : values) {
        int expected = left < right ? -1 : left == right ? 0 : 1;
        int actual = Integer.signum(ComparisonOverflowReference.compare(left, right));
        check(actual == expected, "boundary comparison sign");
        check(actual == -Integer.signum(ComparisonOverflowReference.compare(right, left)),
            "antisymmetry");
        for (int third : values) {
          if (left < right && right < third) {
            check(ComparisonOverflowReference.compare(left, third) < 0, "transitivity");
          }
        }
      }
    }
  }

  static void events() {
    Map<String, EventOrderStarter.Event> broken = new HashMap<>();
    EventOrderStarter.apply(broken, new EventOrderStarter.Event("A", 5, 500));
    check(EventOrderStarter.apply(broken, new EventOrderStarter.Event("A", 4, 400)),
        "starter accepts stale event");
    check(broken.get("A").balance() == 400, "starter rolls back balance");

    Map<String, EventOrderReference.Event> state = new HashMap<>();
    EventOrderReference.Event newest = new EventOrderReference.Event("A", 5, 500);
    check(EventOrderReference.apply(state, newest), "first event accepted");
    for (EventOrderReference.Event ignored : List.of(
        new EventOrderReference.Event("A", 4, 400),
        new EventOrderReference.Event("A", 5, 500),
        new EventOrderReference.Event("A", 5, 999))) {
      check(!EventOrderReference.apply(state, ignored), "stale/equal event rejected");
      check(state.get("A") == newest, "ignored event preserves original state");
    }
    check(EventOrderReference.apply(state, new EventOrderReference.Event("B", 1, 100)),
        "separate account accepts lower independent version");
    check(state.get("A") == newest, "account B cannot overwrite account A");
    check(EventOrderReference.apply(state, new EventOrderReference.Event("A", 6, 600)),
        "newer snapshot accepted");
    check(state.get("A").balance() == 600 && state.get("B").balance() == 100,
        "latest per-account state");
  }

  static void retries() throws Exception {
    AtomicInteger brokenCalls = new AtomicInteger();
    expect(RetryBudgetStarter.TransientFailure.class, () -> RetryBudgetStarter.retry(() -> {
      throw new RetryBudgetStarter.TransientFailure("attempt " + brokenCalls.incrementAndGet());
    }, 3));
    check(brokenCalls.get() == 4, "starter exceeds three total attempts");

    AtomicInteger successCalls = new AtomicInteger();
    check(RetryBudgetReference.retry(() -> {
      successCalls.incrementAndGet(); return "ok";
    }, 3).equals("ok") && successCalls.get() == 1, "success stops immediately");
    check(RetryBudgetReference.retry(() -> null, 3) == null, "null task result is still a successful return");
    AtomicInteger finalSuccessCalls = new AtomicInteger();
    check(RetryBudgetReference.retry(() -> {
      if (finalSuccessCalls.incrementAndGet() < 3) {
        throw new RetryBudgetReference.TransientFailure("try again");
      }
      return "last attempt succeeded";
    }, 3).equals("last attempt succeeded") && finalSuccessCalls.get() == 3,
        "last allowed attempt can succeed");

    for (int budget : new int[] {1, 3}) {
      AtomicInteger calls = new AtomicInteger();
      RetryBudgetReference.TransientFailure[] last = new RetryBudgetReference.TransientFailure[1];
      Throwable actual = expect(RetryBudgetReference.TransientFailure.class,
          () -> RetryBudgetReference.retry(() -> {
            last[0] = new RetryBudgetReference.TransientFailure("call " + calls.incrementAndGet());
            throw last[0];
          }, budget));
      check(calls.get() == budget && actual == last[0], "count and final failure identity");
    }
    for (int invalid : new int[] {0, -1}) {
      AtomicInteger calls = new AtomicInteger();
      expect(IllegalArgumentException.class, () -> RetryBudgetReference.retry(() -> {
        calls.incrementAndGet(); return "must not run";
      }, invalid));
      check(calls.get() == 0, "invalid budget rejects before work");
    }
    expect(NullPointerException.class, () -> RetryBudgetReference.retry(null, 3));
    AtomicInteger permanentCalls = new AtomicInteger();
    IllegalStateException permanent = new IllegalStateException("permanent");
    check(expect(IllegalStateException.class, () -> RetryBudgetReference.retry(() -> {
      permanentCalls.incrementAndGet(); throw permanent;
    }, 3)) == permanent && permanentCalls.get() == 1, "non-retryable failure escapes");
    InterruptedException interrupted = new InterruptedException("cancelled");
    AtomicInteger interruptedCalls = new AtomicInteger();
    check(expect(InterruptedException.class, () -> RetryBudgetReference.retry(() -> {
      interruptedCalls.incrementAndGet(); throw interrupted;
    }, 3)) == interrupted && interruptedCalls.get() == 1, "interruption is not retried");
  }

  static void permits() throws Exception {
    Semaphore broken = new Semaphore(1);
    expect(IllegalStateException.class, () -> PermitCleanupStarter.runWithPermit(broken,
        () -> { throw new IllegalStateException("task failed"); }));
    check(broken.availablePermits() == 0, "starter leaks acquired permit");

    Semaphore permits = new Semaphore(1);
    AtomicInteger calls = new AtomicInteger();
    PermitCleanupReference.runWithPermit(permits, calls::incrementAndGet);
    check(calls.get() == 1 && permits.availablePermits() == 1, "success releases once");
    IllegalStateException failure = new IllegalStateException("task failed");
    check(expect(IllegalStateException.class, () -> PermitCleanupReference.runWithPermit(permits,
        () -> { throw failure; })) == failure, "work failure preserved");
    check(permits.availablePermits() == 1, "failure releases once");
    expect(NullPointerException.class, () -> PermitCleanupReference.runWithPermit(permits, null));
    check(permits.availablePermits() == 1, "null work does not consume capacity");
    Semaphore full = new Semaphore(0);
    expect(IllegalStateException.class, () -> PermitCleanupReference.runWithPermit(full,
        () -> { throw new AssertionError("busy work must not run"); }));
    check(full.availablePermits() == 0, "rejected acquisition must not release");

    ExecutorService executor = Executors.newSingleThreadExecutor();
    CountDownLatch entered = new CountDownLatch(1);
    CountDownLatch finish = new CountDownLatch(1);
    try {
      Future<?> running = executor.submit(() -> PermitCleanupReference.runWithPermit(permits, () -> {
        entered.countDown();
        try {
          if (!finish.await(3, TimeUnit.SECONDS)) throw new AssertionError("work timed out");
        } catch (InterruptedException interrupted) {
          Thread.currentThread().interrupt();
          throw new AssertionError(interrupted);
        }
      }));
      check(entered.await(3, TimeUnit.SECONDS), "first task entered");
      check(permits.availablePermits() == 0, "running task owns capacity");
      expect(IllegalStateException.class, () -> PermitCleanupReference.runWithPermit(permits,
          () -> { throw new AssertionError("overlapping task must not run"); }));
      check(permits.availablePermits() == 0, "overlap rejection cannot create capacity");
      finish.countDown();
      running.get(3, TimeUnit.SECONDS);
      check(permits.availablePermits() == 1, "completion restores capacity");
      PermitCleanupReference.runWithPermit(permits, calls::incrementAndGet);
      check(permits.availablePermits() == 1 && calls.get() == 2, "later work is admitted");
    } finally {
      finish.countDown();
      executor.shutdownNow();
      check(executor.awaitTermination(3, TimeUnit.SECONDS), "executor terminates");
    }
  }

  public static void main(String[] args) throws Exception {
    arrays(); strings(); booleans(); ownership(); comparisons(); events(); retries(); permits();
    System.out.println("Eight Java comprehension exercises passed: starter counterexamples and reference boundaries");
  }
}
