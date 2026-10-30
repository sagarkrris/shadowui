import java.util.concurrent.*;
class Checks {
  static void equal(String actual, String expected) { if (!actual.equals(expected)) throw new AssertionError(actual + " != " + expected); }
  public static void main(String[] args) throws Exception {
    var display = new Exercise();
    var old = new CompletableFuture<String>(); var recent = new CompletableFuture<String>();
    display.request(old); display.request(recent); recent.complete("new"); old.complete("old");
    equal(display.value(), "new");
    var late = new CompletableFuture<String>(); display.request(late); display.cancel(); late.complete("late"); equal(display.value(), "new");
    for (boolean cancel : new boolean[]{false,true}) {
      var pending = new CompletableFuture<String>(); var failed = new CompletableFuture<String>();
      display.request(pending); display.request(failed);
      if (cancel) failed.cancel(false); else failed.completeExceptionally(new IllegalStateException());
      pending.complete("obsolete"); equal(display.value(), "new");
    }
    display.request(CompletableFuture.completedFuture("ready")); equal(display.value(), "ready");
    var first = new CompletableFuture<String>(); var second = new CompletableFuture<String>();
    display.request(first); display.request(second);
    Thread a = new Thread(() -> first.complete("first")), b = new Thread(() -> second.complete("second"));
    a.start(); b.start(); a.join(2000); b.join(2000);
    if (a.isAlive() || b.isAlive()) throw new AssertionError("completion hung");
    equal(display.value(), "second");
    System.out.println("PASS");
  }
}
