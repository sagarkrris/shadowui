import java.util.Arrays;

final class NetworkingExampleChecks {
  private static void check(boolean condition, String message) {
    if (!condition) throw new AssertionError(message);
  }
  private static void rejects(Runnable action, String message) {
    try { action.run(); throw new AssertionError(message); }
    catch (IllegalArgumentException | ArithmeticException expected) { }
  }
  public static void main(String[] args) throws Exception {
    long expiry = DnsCacheDecisionExample.expiresAt(1_000, 200);
    check(DnsCacheDecisionExample.action(1_199, expiry) == DnsCacheDecisionExample.Action.USE_CACHED_ANSWER, "DNS hit before expiry");
    check(DnsCacheDecisionExample.action(1_200, expiry) == DnsCacheDecisionExample.Action.RESOLVE_AGAIN, "DNS exact expiry");
    rejects(() -> DnsCacheDecisionExample.expiresAt(Long.MAX_VALUE, 1), "DNS expiry overflow");

    check(Arrays.equals(AddressRaceExample.launchDelays(true, true, 250, 600), new int[]{0, 250}), "dual-stack fallback");
    check(Arrays.equals(AddressRaceExample.launchDelays(true, true, 600, 600), new int[]{0}), "fallback outside budget");
    check(AddressRaceExample.launchDelays(false, false, 250, 600).length == 0, "no candidates");
    rejects(() -> AddressRaceExample.launchDelays(true, true, 0, 600), "invalid fallback");
    rejects(() -> AddressRaceExample.launchDelays(true, true, 9, 600), "fallback below safe lower bound");

    check(TlsIdentityDecisionExample.decide(true, true, true) == TlsIdentityDecisionExample.Decision.ACCEPT, "valid TLS identity");
    check(TlsIdentityDecisionExample.decide(false, true, true) == TlsIdentityDecisionExample.Decision.REJECT, "untrusted chain");
    check(TlsIdentityDecisionExample.decide(true, false, true) == TlsIdentityDecisionExample.Decision.REJECT, "expired certificate");
    check(TlsIdentityDecisionExample.decide(true, true, false) == TlsIdentityDecisionExample.Decision.REJECT, "wrong hostname");

    var noGuarantee = new HttpRetryDecisionExample.ReplayContract(false, false, false);
    check(HttpRetryDecisionExample.afterLostResponse(HttpRetryDecisionExample.Operation.SAFE_READ, noGuarantee) == HttpRetryDecisionExample.Action.REPEAT_OPERATION, "safe read");
    check(HttpRetryDecisionExample.afterLostResponse(HttpRetryDecisionExample.Operation.IDEMPOTENT_WRITE, noGuarantee) == HttpRetryDecisionExample.Action.REPEAT_OPERATION, "idempotent operation contract");
    for (int bits = 0; bits < 8; bits++) {
      var contract = new HttpRetryDecisionExample.ReplayContract((bits & 1) != 0, (bits & 2) != 0, (bits & 4) != 0);
      var expected = bits == 7 ? HttpRetryDecisionExample.Action.REPEAT_WITH_STABLE_KEY : HttpRetryDecisionExample.Action.RECONCILE;
      check(HttpRetryDecisionExample.afterLostResponse(HttpRetryDecisionExample.Operation.NON_IDEMPOTENT_WRITE, contract) == expected,
          "same intent, atomic provider guarantee AND unexpired retention required: " + bits);
    }
    rejects(() -> HttpRetryDecisionExample.afterLostResponse(null, noGuarantee), "null operation");
    rejects(() -> HttpRetryDecisionExample.afterLostResponse(HttpRetryDecisionExample.Operation.NON_IDEMPOTENT_WRITE, null), "unknown replay contract");

    // Construct numeric addresses without name service or external infrastructure.
    var peer = java.net.InetAddress.getByAddress(new byte[]{10, 0, 0, 4});
    var client = java.net.InetAddress.getByAddress(new byte[]{(byte) 203, 0, 113, 8});
    var ipv6 = java.net.InetAddress.getByAddress(new byte[16]);
    check(ProxyBoundaryExample.clientAddress(peer, client, true).equals(client), "trusted proxy");
    check(ProxyBoundaryExample.clientAddress(peer, ipv6, true).equals(ipv6), "IPv6 supported");
    check(ProxyBoundaryExample.clientAddress(peer, client, false).equals(peer), "ignore untrusted forwarding");
    check(ProxyBoundaryExample.clientAddress(peer, null, false).equals(peer), "ignore absent untrusted forwarding");
    rejects(() -> ProxyBoundaryExample.clientAddress(null, client, true), "unknown direct peer");
    rejects(() -> ProxyBoundaryExample.clientAddress(peer, null, true), "missing parsed proxy address");

    check(DeadlineBudgetExample.childTimeoutMillis(100, 1_000, 100, 500) == 500, "child cap");
    check(DeadlineBudgetExample.childTimeoutMillis(800, 1_000, 100, 500) == 100, "remaining deadline");
    check(DeadlineBudgetExample.childTimeoutMillis(900, 1_000, 100, 500) == -1, "reserve boundary");
    check(DeadlineBudgetExample.childTimeoutMillis(1_000, 1_000, 0, 500) == -1, "expired caller");
    check(DeadlineBudgetExample.childTimeoutMillis(0, Long.MAX_VALUE, 0, Long.MAX_VALUE) == Long.MAX_VALUE, "large safe budget");
    rejects(() -> DeadlineBudgetExample.childTimeoutMillis(-1, 10, 0, 1), "negative time");
    System.out.println("Networking checks passed");
  }
}
