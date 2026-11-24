import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

class ConditionalWriteExampleChecks {
  static void check(boolean value, String message) {
    if (!value) throw new AssertionError(message);
  }

  static void reject(Runnable work) {
    try {
      work.run();
      throw new AssertionError("Invalid input was accepted");
    } catch (IllegalArgumentException expected) {
      // Expected contract.
    }
  }

  static void checkValidators() {
    UUID first = new UUID(0, 7);
    UUID replacement = new UUID(0, 8);
    String tag = DocumentETag.headerValue(first, 7, "json1");
    check(tag.equals("\"00000000-0000-0000-0000-000000000007:7:json1\""), "Wire tag");
    check(!tag.equals(DocumentETag.headerValue(replacement, 7, "json1")), "Recreated document");
    check(!tag.equals(DocumentETag.headerValue(first, 8, "json1")), "New revision");
    check(!tag.equals(DocumentETag.headerValue(first, 7, "json2")), "Different representation");
    check(DocumentETag.headerValue(first, Long.MAX_VALUE, "x".repeat(24))
        .contains(":9223372036854775807:"), "Maximum revision and variant length");
    reject(() -> DocumentETag.headerValue(null, 7, "json1"));
    reject(() -> DocumentETag.headerValue(first, -1, "json1"));
    reject(() -> DocumentETag.headerValue(first, 7, null));
    reject(() -> DocumentETag.headerValue(first, 7, ""));
    reject(() -> DocumentETag.headerValue(first, 7, "\""));
    reject(() -> DocumentETag.headerValue(first, 7, "x".repeat(25)));
  }

  static void checkMatching() {
    var strong = new StrongIfMatch.Tag("v7", false);
    var weak = new StrongIfMatch.Tag("v7", true);
    var stale = new StrongIfMatch.Tag("v6", false);
    var empty = new StrongIfMatch.Tag("", false);
    check(StrongIfMatch.matches(List.of(stale, weak, strong), Optional.of(strong)), "One strong candidate");
    check(!StrongIfMatch.matches(List.of(weak, stale), Optional.of(strong)), "Weak and stale candidates");
    check(!StrongIfMatch.matches(List.of(strong), Optional.of(weak)), "Weak current tag");
    check(!StrongIfMatch.matches(List.of(new StrongIfMatch.Tag("V7", false)), Optional.of(strong)),
        "Opaque match is case-sensitive");
    check(!StrongIfMatch.matches(List.of(strong), Optional.empty()), "No representation");
    check(!StrongIfMatch.matches(List.of(), Optional.of(strong)), "No candidate");
    check(StrongIfMatch.matches(List.of(empty), Optional.of(empty)), "Empty opaque tag is valid");
    reject(() -> new StrongIfMatch.Tag(null, false));
    reject(() -> StrongIfMatch.matches(null, Optional.of(strong)));
    reject(() -> StrongIfMatch.matches(List.of(strong), null));
    reject(() -> StrongIfMatch.matches(Arrays.asList(strong, null), Optional.of(strong)));
  }

  static void checkConcurrentSave() throws Exception {
    ConditionalDocument document = new ConditionalDocument(7, "Draft");
    CyclicBarrier start = new CyclicBarrier(2);
    ExecutorService writers = Executors.newFixedThreadPool(2);
    try {
      Future<Boolean> first = writers.submit(() -> {
        start.await(5, TimeUnit.SECONDS);
        return document.save(7, "Finance");
      });
      Future<Boolean> second = writers.submit(() -> {
        start.await(5, TimeUnit.SECONDS);
        return document.save(7, "Support");
      });
      boolean firstWon = first.get(5, TimeUnit.SECONDS);
      boolean secondWon = second.get(5, TimeUnit.SECONDS);
      check(firstWon != secondWon, "Exactly one writer must win");
      var winner = new ConditionalDocument.Snapshot(8, firstWon ? "Finance" : "Support");
      check(document.read().equals(winner), "Publish only the winning revision and title");
      check(!document.save(7, winner.title()), "A replay cannot consume revision 7 twice");
      check(!document.save(9, "Future"), "A future revision cannot be consumed");
      check(document.read().equals(winner), "Stale, duplicate and future writes preserve the winner");
      check(document.save(8, "Reviewed"), "A newly reviewed revision can be saved");
      check(document.read().equals(new ConditionalDocument.Snapshot(9, "Reviewed")), "Advance once");
    } finally {
      writers.shutdownNow();
      check(writers.awaitTermination(5, TimeUnit.SECONDS), "Release executor");
    }

    reject(() -> new ConditionalDocument(0, ""));
    reject(() -> document.save(-1, "Invalid"));
    reject(() -> document.save(9, null));
    reject(() -> document.save(9, " "));
    var exhausted = new ConditionalDocument(Long.MAX_VALUE - 1, "Original");
    check(exhausted.save(Long.MAX_VALUE - 1, "Last"), "Last representable revision is usable");
    try {
      exhausted.save(Long.MAX_VALUE, "Overflow");
      throw new AssertionError("Revision overflow was accepted");
    } catch (ArithmeticException expected) {
      check(exhausted.read().equals(new ConditionalDocument.Snapshot(Long.MAX_VALUE, "Last")),
          "Overflow leaves the complete snapshot intact");
    }
  }

  static void checkMergeAndRecovery() {
    check(SubtitleMerge.merge("Draft", "", "Draft").equals(Optional.of("")), "A clear is present");
    check(SubtitleMerge.merge("Draft", "Draft", "").equals(Optional.of("")), "Apply remote clear");
    check(SubtitleMerge.merge("", "", "").equals(Optional.of("")), "Unchanged empty field");
    check(SubtitleMerge.merge("Draft", "Final", "Final").equals(Optional.of("Final")), "Same change");
    check(SubtitleMerge.merge("Draft", "Local", "Remote").isEmpty(), "Divergent changes conflict");
    reject(() -> SubtitleMerge.merge(null, "", ""));
    reject(() -> SubtitleMerge.merge("", null, ""));
    reject(() -> SubtitleMerge.merge("", "", null));

    String original = "revision=7;title=Finance";
    check(EditRecovery.resolve(original, Optional.of(original)) == EditRecovery.Outcome.APPLIED,
        "Exact original request has committed evidence");
    check(EditRecovery.resolve(original, Optional.of("revision=8;title=Finance"))
        == EditRecovery.Outcome.KEY_CONFLICT, "Same title with a different base is a different request");
    check(EditRecovery.resolve(original, Optional.empty()) == EditRecovery.Outcome.UNKNOWN,
        "Expired or in-flight evidence is ambiguous");
    reject(() -> EditRecovery.resolve(null, Optional.empty()));
    reject(() -> EditRecovery.resolve("", Optional.empty()));
    reject(() -> EditRecovery.resolve(original, null));
    reject(() -> EditRecovery.resolve(original, Optional.of(" ")));
  }

  public static void main(String[] args) throws Exception {
    checkValidators();
    checkMatching();
    checkConcurrentSave();
    checkMergeAndRecovery();
    System.out.println("Conditional write checks passed");
  }
}
