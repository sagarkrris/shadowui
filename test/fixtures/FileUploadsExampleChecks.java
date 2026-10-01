final class FileUploadsExampleChecks {
  private static void check(boolean condition) { if (!condition) throw new AssertionError(); }
  private static void rejects(Runnable action) {
    try { action.run(); throw new AssertionError("expected rejection"); }
    catch (IllegalArgumentException expected) { }
  }
  public static void main(String[] args) throws Exception {
    check(UploadSizeExample.nextTotal(7, 3, 10) == 10);
    rejects(() -> UploadSizeExample.nextTotal(9, 2, 10));
    rejects(() -> UploadSizeExample.nextTotal(Long.MAX_VALUE, 1, Long.MAX_VALUE));
    check(UploadTypeExample.acceptsPdf("application/pdf", new byte[]{'%', 'P', 'D', 'F', '-'}));
    check(!UploadTypeExample.acceptsPdf("image/png", new byte[]{'%', 'P', 'D', 'F', '-'}));
    check(!UploadTypeExample.acceptsPdf("application/pdf", new byte[]{'%', 'P'}));
    check(UploadPromotionExample.promote(UploadPromotionExample.State.QUARANTINED, "A", "A", true) == UploadPromotionExample.State.CLEAN);
    check(UploadPromotionExample.promote(UploadPromotionExample.State.QUARANTINED, "A", "B", true) == UploadPromotionExample.State.QUARANTINED);
    check(UploadPromotionExample.promote(UploadPromotionExample.State.CLEAN, "A", "A", false) == UploadPromotionExample.State.CLEAN);
    check(UploadReplayExample.decide("tenant-1", null, null, "f") == UploadReplayExample.Decision.CREATE);
    check(UploadReplayExample.decide("tenant-1", "tenant-1", "f", "f") == UploadReplayExample.Decision.RETURN_EXISTING);
    check(UploadReplayExample.decide("tenant-2", "tenant-1", "f", "f") == UploadReplayExample.Decision.CONFLICT);
    check(UploadReplayExample.decide("tenant-1", "tenant-1", "old", "new") == UploadReplayExample.Decision.CONFLICT);
    check(UploadDownloadExample.canDownload("t", "alice", "t", "alice", true, false));
    check(!UploadDownloadExample.canDownload("t", "bob", "t", "alice", true, false));
    check(!UploadDownloadExample.canDownload("other", "alice", "t", "alice", true, false));
    check(!UploadDownloadExample.canDownload("t", "alice", "t", "alice", false, false));
    check(!UploadDownloadExample.canDownload("t", "alice", "t", "alice", true, true));
    rejects(() -> UploadDownloadExample.canDownload("t", null, "t", "alice", true, false));
    rejects(() -> UploadDownloadExample.canDownload("t", " ", "t", "alice", true, false));
    var issuedFirst = new UploadDownloadExample.DeliveryGate("t", "alice", "v1", true);
    var prior = issuedFirst.issue("t", "alice").orElseThrow();
    issuedFirst.revokeNewDelivery();
    issuedFirst.revokeNewDelivery();
    check(issuedFirst.issue("t", "alice").isEmpty());
    check(prior.objectVersion().equals("v1") && prior.issuance() == 1);
    var deletedFirst = new UploadDownloadExample.DeliveryGate("t", "alice", "v2", true);
    var deletionDone = new java.util.concurrent.CountDownLatch(1);
    var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
    try {
      var lateIssuance = executor.submit(() -> {
        if (!deletionDone.await(5, java.util.concurrent.TimeUnit.SECONDS)) throw new AssertionError("deletion stalled");
        return deletedFirst.issue("t", "alice");
      });
      executor.submit(() -> { deletedFirst.revokeNewDelivery(); deletionDone.countDown(); })
          .get(5, java.util.concurrent.TimeUnit.SECONDS);
      check(lateIssuance.get(5, java.util.concurrent.TimeUnit.SECONDS).isEmpty());
      var simultaneous = new UploadDownloadExample.DeliveryGate("t", "alice", "v3", true);
      var start = new java.util.concurrent.CountDownLatch(1);
      var first = executor.submit(() -> { start.await(); return simultaneous.issue("t", "alice").orElseThrow(); });
      var second = executor.submit(() -> { start.await(); return simultaneous.issue("t", "alice").orElseThrow(); });
      start.countDown();
      var a = first.get(5, java.util.concurrent.TimeUnit.SECONDS);
      var b = second.get(5, java.util.concurrent.TimeUnit.SECONDS);
      check(a.issuance() != b.issuance() && a.issuance() + b.issuance() == 3);
      check(simultaneous.issue("t", "bob").isEmpty());
    } finally {
      executor.shutdownNow();
      check(executor.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS));
    }
    check(UploadDeletionExample.afterDeleteAttempt(UploadDeletionExample.State.ACTIVE, false) == UploadDeletionExample.State.DELETE_PENDING);
    check(UploadDeletionExample.afterDeleteAttempt(UploadDeletionExample.State.DELETE_PENDING, true) == UploadDeletionExample.State.DELETED);
    check(UploadDeletionExample.afterDeleteAttempt(UploadDeletionExample.State.DELETED, false) == UploadDeletionExample.State.DELETED);
    System.out.println("File upload checks passed");
  }
}
