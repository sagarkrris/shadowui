package learning.javaindex;

import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

public final class ConcurrencyLab {
    private ConcurrencyLab() {}

    public static void main(String[] args) throws Exception {
        var started = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        try (var executor = new ThreadPoolExecutor(1, 1, 0, TimeUnit.SECONDS, new ArrayBlockingQueue<>(1))) {
            var active = executor.submit(() -> {
                started.countDown();
                try {
                    release.await();
                } catch (InterruptedException expected) {
                    Thread.currentThread().interrupt();
                    interrupted.countDown();
                }
            });
            try {
                check(started.await(10, TimeUnit.SECONDS), "first task reached controlled wait");
                var queued = executor.submit(() -> List.of("java", "maps"));
                try {
                    executor.submit(() -> "third task");
                    throw new AssertionError("saturated executor accepted another task");
                } catch (RejectedExecutionException expected) {
                    // The worker and the only queue slot are occupied.
                }
                check(active.cancel(true), "running task accepted cancellation");
                check(interrupted.await(10, TimeUnit.SECONDS), "blocking task observed interruption");
                check(queued.get(10, TimeUnit.SECONDS).equals(List.of("java", "maps")),
                        "get publishes completed result after the worker is freed");
            } finally {
                release.countDown();
            }
        }
        System.out.println("Concurrency lab passed: saturation, cooperative interruption and Future handoff");
    }

    private static void check(boolean condition, String description) {
        if (!condition) throw new AssertionError(description);
    }
}
