import java.util.concurrent.*;

class BulkheadExampleChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  public static void main(String[] args) throws Exception {
    check(BulkheadDomainExample.boundary(" Payment ").equals("bulkhead:payment"));
    try { BulkheadDomainExample.boundary(" "); throw new AssertionError(); } catch (IllegalArgumentException expected) { }
    var bulkhead = new AtomicBulkheadExample(1);
    check(bulkhead.tryEnter()); check(!bulkhead.tryEnter()); bulkhead.leave(); check(bulkhead.available() == 1);
    check(PermitOwnershipExample.run(bulkhead, () -> "ok").equals("ok"));
    try { PermitOwnershipExample.run(bulkhead, () -> { throw new RuntimeException(); }); throw new AssertionError(); } catch (RuntimeException expected) { }
    check(bulkhead.available() == 1);
    check(DeadlineOutcomeExample.next(DeadlineOutcomeExample.Outcome.UNKNOWN).equals("RECONCILE_SAME_OPERATION"));
    check(!RetryBudgetExample.mayRetry(2, 2, 10, true));
    check(RetryBudgetExample.mayRetry(1, 2, 1, true));
    check(!BulkheadDrainDecisionExample.mayAdmit(BulkheadDrainDecisionExample.State.DRAINING));
    check(BulkheadDrainDecisionExample.afterGrace(false).equals("UNKNOWN_RECONCILE"));
    System.out.println("Bulkhead checks passed");
  }
}
