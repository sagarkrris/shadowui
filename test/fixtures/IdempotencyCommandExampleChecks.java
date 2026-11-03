class IdempotencyCommandExampleChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  public static void main(String[] args) {
    check(CommandIdentityExample.storageKey(new CommandIdentityExample.Identity("tenant-a", "key-1", "order-9")).equals("tenant-a:key-1"));
    try { new CommandIdentityExample.Identity("tenant-a", " ", "order-9"); throw new AssertionError(); } catch (IllegalArgumentException expected) { }
    check(IntentFingerprintExample.payment("order-9", 1250, "USD").equals("order-9|1250|USD"));
    try { IntentFingerprintExample.payment("order-9", 0, "USD"); throw new AssertionError(); } catch (IllegalArgumentException expected) { }
    var claims = new AtomicClaimExample();
    check(claims.claim("tenant-a:key-1", "order-9|1250|USD"));
    check(!claims.claim("tenant-a:key-1", "order-9|1250|USD"));
    try { claims.claim("tenant-a:key-1", "order-9|1300|USD"); throw new AssertionError(); } catch (IllegalStateException expected) { }
    check(OutcomeExample.afterResponse(true, false, false) == OutcomeExample.State.UNKNOWN);
    check(OutcomeExample.afterResponse(true, true, true) == OutcomeExample.State.SUCCEEDED);
    check(RetryOwnershipExample.mayRetry(1, 2, 1, true, true));
    check(!RetryOwnershipExample.mayRetry(1, 2, 1, true, false));
    check(ResultViewExample.clientStatus(ResultViewExample.State.UNKNOWN).equals("pending_reconciliation"));
    System.out.println("Idempotency command checks passed");
  }
}
