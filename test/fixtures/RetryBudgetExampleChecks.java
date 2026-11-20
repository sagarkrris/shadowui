class RetryBudgetExampleChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  static void reject(Runnable work) { try { work.run(); throw new AssertionError(); } catch (IllegalArgumentException expected) { } }
  public static void main(String[] args) {
    check(RetryBudgetExample.mayRetry(0, 2)); check(RetryBudgetExample.mayRetry(1, 2)); check(!RetryBudgetExample.mayRetry(2, 2));
    check(RemainingTimeExample.remaining(100, 20) == 80); check(RemainingTimeExample.remaining(20, 100) == 0);
    check(RetryEvidenceExample.safeWithoutKey(RetryEvidenceExample.Evidence.NOT_SENT)); check(!RetryEvidenceExample.safeWithoutKey(RetryEvidenceExample.Evidence.UNKNOWN));
    check(BackoffCapExample.cappedDelay(10, 0, 80) == 10); check(BackoffCapExample.cappedDelay(10, 3, 80) == 80); check(BackoffCapExample.cappedDelay(10, 20, 80) == 80);
    check(RetryOwnerExample.mayComplete(4, 4, true)); check(!RetryOwnerExample.mayComplete(3, 4, true)); check(!RetryOwnerExample.mayComplete(4, 4, false));
    check(RetryOutcomeExample.outcome(false, 1, false).equals("unknown")); check(RetryOutcomeExample.outcome(false, 0, true).equals("deadline_exhausted")); check(RetryOutcomeExample.outcome(true, 1, true).equals("cancelled"));
    reject(() -> RetryBudgetExample.mayRetry(-1, 1)); reject(() -> RemainingTimeExample.remaining(-1, 1)); reject(() -> BackoffCapExample.cappedDelay(10, -1, 20));
    System.out.println("Retry budget checks passed");
  }
}
