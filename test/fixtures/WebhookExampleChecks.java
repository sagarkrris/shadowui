import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

class WebhookExampleChecks {
  static void check(boolean condition) { if (!condition) throw new AssertionError(); }
  static void rejected(Runnable action) {
    try { action.run(); throw new AssertionError("invalid state accepted"); }
    catch (IllegalArgumentException expected) { }
  }
  static byte[] bytes(String value) { return value.getBytes(StandardCharsets.UTF_8); }
  public static void main(String[] args) throws Exception {
    byte[] body = bytes("{\"id\":\"evt_1\"}");
    byte[] secret = bytes("test-secret-not-for-production");
    // Independently calculated with Node crypto.createHmac, not the code under test.
    byte[] tag = HexFormat.of().parseHex("7dca52632d51bd9fe2db6ce3b15c29060e98ba6662877e025835de6a22ab792e");
    check(WebhookSignatureExample.accepts(body, 1700000000L, secret, tag));
    check(!WebhookSignatureExample.accepts(bytes("{\"id\":\"evt_2\"}"), 1700000000L, secret, tag));
    check(!WebhookSignatureExample.accepts(body, 1700000001L, secret, tag));
    check(!WebhookSignatureExample.accepts(body, 1700000000L, bytes("wrong-secret"), tag));
    byte[] changedTag = tag.clone(); changedTag[31] ^= 1;
    check(!WebhookSignatureExample.accepts(body, 1700000000L, secret, changedTag));
    for (byte[] invalid : new byte[][] { null, new byte[0], new byte[31], new byte[33] })
      check(!WebhookSignatureExample.accepts(body, 1700000000L, secret, invalid));
    for (byte[] invalid : new byte[][] { null, new byte[0], new byte[1_048_577] })
      check(!WebhookSignatureExample.accepts(invalid, 1700000000L, secret, tag));
    for (byte[] invalid : new byte[][] { null, new byte[0] })
      check(!WebhookSignatureExample.accepts(body, 1700000000L, invalid, tag));
    check(!WebhookSignatureExample.accepts(body, -1, secret, tag));
    check(WebhookSignatureExample.accepts(new byte[] { 0 }, 0, secret,
        HexFormat.of().parseHex("ed70dd8f28e4999aa9ac0b079c37e2f2ad49abd383b8edbdd6fb342c11398a59")));
    check(WebhookSignatureExample.accepts(new byte[1_048_576], Long.MAX_VALUE, secret,
        HexFormat.of().parseHex("cd75a716d58648cd0b555609a1e6ff9246fd44309dea16b40c045336570d5ccf")));
    check(WebhookReplayWindowExample.inWindow(90, 100, 10));
    check(!WebhookReplayWindowExample.inWindow(89, 100, 10));
    try { WebhookReplayWindowExample.inWindow(101, 100, 10); throw new AssertionError(); } catch (IllegalArgumentException expected) { }
    var claim = new WebhookClaimExample(); check(claim.claim()); check(!claim.claim());
    check(WebhookVersionExample.canApply(4, 5)); check(!WebhookVersionExample.canApply(5, 5)); check(!WebhookVersionExample.canApply(5, 4));
    for (var ack : WebhookOutcomeExample.Ack.values()) {
      check(WebhookOutcomeExample.decide(WebhookOutcomeExample.Effect.NOT_DISPATCHED, false, ack)
          == WebhookOutcomeExample.Outcome.RETRY_DELIVERY);
      check(WebhookOutcomeExample.decide(WebhookOutcomeExample.Effect.IN_FLIGHT, false, ack)
          == WebhookOutcomeExample.Outcome.WAIT_FOR_OWNER);
      // Local rollback / uncommitted terminal result does not make dispatch safe.
      check(WebhookOutcomeExample.decide(WebhookOutcomeExample.Effect.UNKNOWN, false, ack)
          == WebhookOutcomeExample.Outcome.RECONCILE);
      check(WebhookOutcomeExample.decide(WebhookOutcomeExample.Effect.CONFIRMED, false, ack)
          == WebhookOutcomeExample.Outcome.PERSIST_RESULT);
      check(WebhookOutcomeExample.decide(WebhookOutcomeExample.Effect.CONFIRMED, true, ack)
          == WebhookOutcomeExample.Outcome.COMPLETE);
      for (var effect : WebhookOutcomeExample.Effect.values())
        if (effect != WebhookOutcomeExample.Effect.CONFIRMED)
          rejected(() -> WebhookOutcomeExample.decide(effect, true, ack));
      rejected(() -> WebhookOutcomeExample.decide(null, false, ack));
    }
    rejected(() -> WebhookOutcomeExample.decide(WebhookOutcomeExample.Effect.UNKNOWN, false, null));
    check(WebhookRecoveryExample.mayRecover(7, 7, false));
    check(!WebhookRecoveryExample.mayRecover(7, 8, false)); check(!WebhookRecoveryExample.mayRecover(7, 7, true));
    System.out.println("Webhook checks passed");
  }
}
