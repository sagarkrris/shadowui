class TransactionalOutboxExampleChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  public static void main(String[] args) {
    var intent = OutboxIntentExample.placed("order-7", 2); check(intent.eventId().equals("order-placed:order-7:2"));
    try { new OutboxIntentExample.Intent(" ", "order", 1); throw new AssertionError(); } catch (IllegalArgumentException expected) { }
    var event = new OutboxEnvelopeExample.Envelope("evt-1", "OrderPlaced", 1, "{}"); check(OutboxEnvelopeExample.key(event).equals("OrderPlaced:evt-1"));
    var claims = new OutboxClaimExample(); check(claims.claim("evt-1", 7)); check(!claims.claim("evt-1", 8)); check(claims.owns("evt-1", 7)); check(!claims.owns("evt-1", 8));
    check(PublishEvidenceExample.afterPublish(true, true, true) == PublishEvidenceExample.State.ACKNOWLEDGED);
    check(PublishEvidenceExample.afterPublish(true, true, false) == PublishEvidenceExample.State.UNKNOWN);
    var consumer = new ConsumerDedupExample(); check(consumer.apply("evt-1")); check(!consumer.apply("evt-1"));
    check(OutboxPolicyExample.needsReconcile(10, 10, 0, 3)); check(OutboxPolicyExample.needsReconcile(1, 10, 3, 3)); check(!OutboxPolicyExample.needsReconcile(1, 10, 1, 3));
    System.out.println("Transactional outbox checks passed");
  }
}
