final class FeatureFlagsExampleChecks {
  private static void check(boolean condition) { if (!condition) throw new AssertionError(); }
  private static void rejects(Runnable action) {
    try { action.run(); throw new AssertionError("expected rejection"); }
    catch (IllegalArgumentException expected) { }
  }
  public static void main(String[] args) {
    var flag = new FlagContractExample.Flag("receipt-renderer", false, "checkout-team", 100);
    check(FlagContractExample.mayUse(flag, 99, true));
    check(!FlagContractExample.mayUse(flag, 100, true));
    check(!FlagContractExample.mayUse(flag, 0, null));
    rejects(() -> new FlagContractExample.Flag("bad key", false, "owner", 1));
    var context = new TargetingContextExample.Context("account-7", "premium");
    check(TargetingContextExample.eligible(context, "premium"));
    check(!TargetingContextExample.eligible(context, "basic"));
    rejects(() -> new TargetingContextExample.Context("", "premium"));
    int bucket = StableRolloutExample.bucket("receipt-renderer", "v1", "account-7");
    check(bucket >= 0 && bucket < 100);
    check(bucket == StableRolloutExample.bucket("receipt-renderer", "v1", "account-7"));
    check(bucket == 62);
    for (int percent = 0; percent <= 100; percent++) {
      check(StableRolloutExample.enabled("receipt-renderer", "v1", "account-7", percent) == (percent > 62));
    }
    check(!StableRolloutExample.enabled("receipt-renderer", "v1", "account-7", 0));
    check(StableRolloutExample.enabled("receipt-renderer", "v1", "account-7", 100));
    rejects(() -> StableRolloutExample.enabled("receipt-renderer", "v1", "account-7", 101));
    check(SnapshotDecisionExample.decide(true, 999, 0, false, true) == SnapshotDecisionExample.Decision.RESOLVED);
    check(SnapshotDecisionExample.decide(false, 10, 10, true, true) == SnapshotDecisionExample.Decision.USE_STALE);
    check(SnapshotDecisionExample.decide(false, 11, 10, true, false) == SnapshotDecisionExample.Decision.USE_DEFAULT);
    check(SnapshotDecisionExample.decide(false, 11, 10, true, true) == SnapshotDecisionExample.Decision.REJECT);
    rejects(() -> SnapshotDecisionExample.decide(false, -1, 0, true, false));
    var decision = new RequestDecisionExample.Decision("receipt-renderer", "rule-8", true);
    check(RequestDecisionExample.renderer(decision).equals("NEW_RENDERER"));
    check(RequestDecisionExample.renderer(new RequestDecisionExample.Decision("receipt-renderer", "rule-8", false)).equals("ESTABLISHED_RENDERER"));
    rejects(() -> new RequestDecisionExample.Decision("", "rule", true));
    for (boolean needsRule : new boolean[]{false, true}) {
      for (boolean verified : new boolean[]{false, true}) {
        check(FlagRetirementExample.next(FlagRetirementExample.Status.ACTIVE, 9, 10, needsRule, verified) == FlagRetirementExample.Status.ACTIVE);
        var expected = verified && !needsRule ? FlagRetirementExample.Status.RETIRED : FlagRetirementExample.Status.EXPIRED;
        check(FlagRetirementExample.next(FlagRetirementExample.Status.ACTIVE, 10, 10, needsRule, verified) == expected);
        check(FlagRetirementExample.next(FlagRetirementExample.Status.EXPIRED, 11, 10, needsRule, verified) == expected);
        check(FlagRetirementExample.next(FlagRetirementExample.Status.RETIRED, 11, 10, needsRule, verified) == FlagRetirementExample.Status.RETIRED);
      }
    }
    rejects(() -> FlagRetirementExample.next(null, 10, 10, false, true));
    rejects(() -> FlagRetirementExample.next(FlagRetirementExample.Status.ACTIVE, -1, 10, false, true));
    System.out.println("Feature flag checks passed");
  }
}
