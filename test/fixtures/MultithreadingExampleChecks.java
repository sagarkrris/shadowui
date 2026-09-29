import java.util.concurrent.CountDownLatch;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

class MultithreadingExampleChecks {
  static void check(boolean condition) {
    if (!condition) throw new AssertionError();
  }

  public static void main(String[] args) throws Exception {
    var publication = new SafePublicationExample();
    publication.replace(new SafePublicationExample.Config("ap-south", 4));
    check(publication.read().region().equals("ap-south"));
    check(publication.read().limit() == 4);
    var previous = publication.read();
    try { publication.replace(null); throw new AssertionError("null accepted"); }
    catch (NullPointerException expected) { }
    check(publication.read() == previous);

    var reservation = new AtomicReservationExample();
    var start = new CountDownLatch(1);
    var ready = new CountDownLatch(2);
    var contenders = Executors.newFixedThreadPool(2);
    try {
      Callable<Boolean> attempt = () -> {
        ready.countDown();
        check(start.await(3, TimeUnit.SECONDS));
        return reservation.reserve();
      };
      var first = contenders.submit(attempt);
      var second = contenders.submit(attempt);
      check(ready.await(3, TimeUnit.SECONDS));
      start.countDown();
      // Future.get propagates worker failures; never discard either result.
      check(DeterministicRaceExample.winners(first.get(3, TimeUnit.SECONDS),
        second.get(3, TimeUnit.SECONDS)) == 1);
    } finally {
      start.countDown();
      contenders.shutdownNow();
      check(contenders.awaitTermination(3, TimeUnit.SECONDS));
    }
    check(reservation.snapshot() == AtomicReservationExample.State.HELD);
    check(reservation.confirm());
    check(!reservation.confirm());

    var lock = new InterruptibleLockExample();
    check(lock.update(10));
    try { lock.update(-1); throw new AssertionError(); } catch (IllegalArgumentException expected) { }

    var executor = BoundedExecutorExample.create();
    var running = new CountDownLatch(2);
    var release = new CountDownLatch(1);
    var executions = new AtomicInteger();
    try {
      Runnable blocking = () -> {
        running.countDown();
        try { release.await(); }
        catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
      };
      check(BoundedExecutorExample.tryExecute(executor, blocking));
      check(BoundedExecutorExample.tryExecute(executor, blocking));
      check(running.await(3, TimeUnit.SECONDS));
      check(BoundedExecutorExample.tryExecute(executor, executions::incrementAndGet));
      check(BoundedExecutorExample.tryExecute(executor, executions::incrementAndGet));
      check(!BoundedExecutorExample.tryExecute(executor, executions::incrementAndGet));
      executor.shutdown();
      check(!BoundedExecutorExample.tryExecute(executor, executions::incrementAndGet));
      release.countDown();
      check(executor.awaitTermination(3, TimeUnit.SECONDS));
      check(executions.get() == 2);
      // Even an empty queue on a terminated executor must reject new work.
      check(!BoundedExecutorExample.tryExecute(executor, executions::incrementAndGet));
    } finally {
      release.countDown();
      executor.shutdownNow();
      check(executor.awaitTermination(3, TimeUnit.SECONDS));
    }

    check(FutureBoundaryExample.combine(java.util.concurrent.CompletableFuture.completedFuture("profile"), java.util.concurrent.CompletableFuture.completedFuture("entitlements")).join().equals("profile:entitlements"));
    check(FutureBoundaryExample.outcome(null).equals("COMPLETE"));
    check(FutureBoundaryExample.outcome(new RuntimeException()).equals("RECONCILE_OR_FAIL"));
    check(DeterministicRaceExample.winners(true, false) == 1);
    check(InterviewAnswerExample.structure("one reservation", "CAS", "reconcile").contains("owner=CAS"));
    System.out.println("Multithreading checks passed");
  }
}
