import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

class ModelStreamExampleChecks {
    public static void main(String[] args) throws Exception {
        checkBudgets();
        checkAdmissionAndCancellation();
        checkConcurrentAdmissionAndCleanup();
        checkRetry();
        System.out.println("Model stream checks passed: phase time, admission, cleanup races and replay");
    }

    private static void checkBudgets() {
        check(ModelStreamBudget.remainingMillis(8000, 1000, 7850, 0) == 150, "total deadline wins");
        check(ModelStreamBudget.remainingMillis(8000, 1000, 4000, 999) == 1, "idle budget wins");
        check(ModelStreamBudget.remainingMillis(8000, 2000, 2000, 2000) == 0, "first output expiry");
        check(ModelStreamBudget.remainingMillis(8000, 1000, 8001, 0) == 0, "steady output cannot extend deadline");
        expectArgumentError(() -> ModelStreamBudget.remainingMillis(1, 1, 0, 1));
        expectArgumentError(() -> ModelStreamBudget.remainingMillis(0, 1, 0, 0));
    }

    private static void checkAdmissionAndCancellation() {
        expectArgumentError(() -> new ModelStreamAdmission(0));
        var gate = new ModelStreamAdmission(1);
        var cancellations = new AtomicInteger();
        var attempt = new ModelStreamCancellation(gate.tryOpen().orElseThrow(), cancellations::incrementAndGet);
        attempt.readerDisconnected();
        attempt.readerDisconnected();
        check(cancellations.get() == 1, "duplicate disconnect signals at most once");
        check(gate.tryOpen().isEmpty(), "disconnect does not release a live producer");
        attempt.localProducerFinished();
        attempt.localProducerFinished();
        var next = gate.tryOpen().orElseThrow();
        check(gate.tryOpen().isEmpty(), "duplicate finish does not over-release");
        var failedCancellation = new ModelStreamCancellation(next, () -> {
            throw new IllegalStateException("signal failed");
        });
        try {
            failedCancellation.readerDisconnected();
            throw new AssertionError("a cancellation signal failure was hidden");
        } catch (IllegalStateException expected) {
            check(gate.tryOpen().isEmpty(), "signal failure does not manufacture capacity");
        }
        failedCancellation.localProducerFinished();

        var alreadyFinished = new ModelStreamCancellation(gate.tryOpen().orElseThrow(), cancellations::incrementAndGet);
        alreadyFinished.localProducerFinished();
        alreadyFinished.readerDisconnected();
        check(cancellations.get() == 1, "a disconnect after observed finish needs no signal");
    }

    private static void checkConcurrentAdmissionAndCleanup() throws Exception {
        var gate = new ModelStreamAdmission(1);
        var start = new CountDownLatch(1);
        var workers = Executors.newFixedThreadPool(2);
        try {
            var first = workers.submit(() -> { start.await(); return gate.tryOpen(); });
            var second = workers.submit(() -> { start.await(); return gate.tryOpen(); });
            start.countDown();
            var a = first.get(5, TimeUnit.SECONDS);
            var b = second.get(5, TimeUnit.SECONDS);
            check(a.isPresent() != b.isPresent(), "one slot admits exactly one simultaneous caller");

            var enteredCancel = new CountDownLatch(1);
            var finishCancel = new CountDownLatch(1);
            var attempt = new ModelStreamCancellation(a.orElseGet(b::orElseThrow), () -> {
                enteredCancel.countDown();
                try {
                    check(finishCancel.await(5, TimeUnit.SECONDS), "cancel callback timed out");
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new AssertionError(interrupted);
                }
            });
            var cancellation = workers.submit(attempt::readerDisconnected);
            try {
                check(enteredCancel.await(5, TimeUnit.SECONDS), "cancel signal reached transport");
                check(gate.tryOpen().isEmpty(), "local slot held while signal and producer overlap");
                workers.submit(attempt::localProducerFinished).get(5, TimeUnit.SECONDS);
                var replacement = gate.tryOpen().orElseThrow();
                attempt.localProducerFinished();
                check(gate.tryOpen().isEmpty(), "stale finish cannot free a replacement's slot");
                replacement.close();
            } finally {
                finishCancel.countDown();
            }
            cancellation.get(5, TimeUnit.SECONDS);
        } finally {
            workers.shutdownNow();
        }
    }

    private static void checkRetry() {
        var rejected = ModelStreamReplay.Evidence.REJECTED_BEFORE_WORK;
        var unknown = ModelStreamReplay.Evidence.UNKNOWN;
        check(ModelStreamReplay.retry(false, false, rejected, false, 50, 10, 40), "safe rejection at budget boundary");
        check(!ModelStreamReplay.retry(false, false, rejected, false, 49, 10, 40), "insufficient attempt budget");
        check(!ModelStreamReplay.retry(false, false, unknown, false, 50, 0, 40), "ambiguous dispatch without dedupe");
        check(ModelStreamReplay.retry(false, false, unknown, true, 50, 0, 40), "deduplicated dispatch");
        check(!ModelStreamReplay.retry(true, false, unknown, true, 50, 0, 40), "possible visible output blocks retry");
        check(!ModelStreamReplay.retry(false, true, rejected, true, 50, 0, 40), "retry count remains finite");
        check(!ModelStreamReplay.retry(false, false, rejected, false, Long.MAX_VALUE, Long.MAX_VALUE, 1),
                "large delay cannot overflow budget calculation");
        expectArgumentError(() -> ModelStreamReplay.retry(false, false, null, false, 50, 0, 40));
    }

    private static void expectArgumentError(Runnable action) {
        try {
            action.run();
            throw new AssertionError("expected invalid input to be rejected");
        } catch (IllegalArgumentException expected) {
            // The model must reject illegal timing or admission values.
        }
    }

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
}
