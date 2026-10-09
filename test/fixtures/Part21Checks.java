import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class Part21Checks {
    record Product(String id) {}
    record Page(String user, List<String> orders) {}

    static void check(boolean value, String message) {
        if (!value) throw new AssertionError(message);
    }

    static void await(CountDownLatch latch) throws InterruptedException {
        check(latch.await(5, TimeUnit.SECONDS), "Test latch timed out");
    }

    static class SingleFlightHarness {
        final CountDownLatch entered = new CountDownLatch(1);
        final CountDownLatch release = new CountDownLatch(1);
        final AtomicInteger fetches = new AtomicInteger();

        Product fetchAndPopulateCache(String id) throws Exception {
            fetches.incrementAndGet();
            if (id.equals("interrupted")) throw new InterruptedException("Loader interrupted");
            if (id.equals("fatal")) throw new AssertionError("Fatal loader failure");
            if (id.equals("bad")) throw new Exception("Expected loader failure");
            if (id.equals("slow")) {
                entered.countDown();
                await(release);
            }
            return new Product(id);
        }

        // PUBLISHED_SINGLE_FLIGHT
    }

    static class StructuredHarness {
        String loadUser(String id) { return id; }
        List<String> loadOrders(String id) { return List.of(id); }

        Page load(String id) throws Exception {
            // PUBLISHED_STRUCTURED_SCOPE
        }
    }

    static void singleFlight() throws Exception {
        var harness = new SingleFlightHarness();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var winner = executor.submit(() -> harness.load("slow"));
            try {
                await(harness.entered);
                var joined = harness.load("slow");
                var followers = new ArrayList<CompletableFuture<Product>>();
                for (int i = 0; i < 20; i++) followers.add(harness.load("slow"));
                var cancelled = harness.load("slow");
                check(cancelled.cancel(true), "A caller can cancel its own wait");
                var completed = harness.load("slow");
                check(completed.complete(new Product("fake")), "A caller can complete its own copy");
                var timedOut = harness.load("slow").orTimeout(0, TimeUnit.MILLISECONDS);
                try {
                    timedOut.get(5, TimeUnit.SECONDS);
                    throw new AssertionError("Expected caller timeout");
                } catch (ExecutionException expected) {
                    check(expected.getCause() instanceof TimeoutException, "Caller timeout cause");
                }
                check(!joined.isDone(), "Caller cancellation, completion and timeout must not poison shared load");
                check(harness.fetches.get() == 1, "Followers must coalesce into one fetch");
                check(harness.load("other").join().id().equals("other"), "An unrelated key must not be blocked");
                harness.release.countDown();
                check(winner.get(5, TimeUnit.SECONDS).join().id().equals("slow"), "Winner receives the real value");
                for (var follower : followers) check(follower.join().id().equals("slow"), "Followers receive the real value");
                check(joined.join().id().equals("slow"), "Successful value must be visible");
                check(harness.fetches.get() == 2 && harness.inFlight.isEmpty(), "Success must clean up once per key");
                check(harness.load("bad").isCompletedExceptionally(), "Failure must be visible to callers");
                check(harness.inFlight.isEmpty(), "Failure must remove the in-flight entry");
                check(harness.load("bad").isCompletedExceptionally(), "A later caller must be able to retry");
                check(harness.fetches.get() == 4, "Failure must not poison the key forever");
                check(executor.submit(() -> {
                    var failed = harness.load("interrupted");
                    return failed.isCompletedExceptionally() && Thread.currentThread().isInterrupted();
                }).get(5, TimeUnit.SECONDS), "Loader interruption must preserve the interrupt flag");
                try {
                    harness.load("fatal");
                    throw new AssertionError("Fatal error was swallowed");
                } catch (AssertionError expected) {
                    check(expected.getMessage().equals("Fatal loader failure"), "Fatal errors must propagate");
                }
                check(harness.inFlight.isEmpty(), "Interruption and fatal errors must clean up");
                try {
                    harness.load(null);
                    throw new AssertionError("ConcurrentHashMap must reject a null key");
                } catch (NullPointerException expected) { }
            } finally {
                harness.release.countDown();
            }
        }
    }

    static void structuredScope() throws Exception {
        var page = new StructuredHarness().load("example");
        check(page.user().equals("example") && page.orders().equals(List.of("example")), "Published success path");

        var entered = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        var joined = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var finished = new CountDownLatch(1);
        var returned = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var owner = executor.submit(() -> {
                try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
                    scope.fork(() -> {
                        entered.countDown();
                        try {
                            await(release);
                        } catch (InterruptedException expected) {
                            interrupted.countDown();
                            await(release); // deliberately delay cooperative termination
                        }
                        finished.countDown();
                        return "done";
                    });
                    scope.fork(() -> {
                        await(entered);
                        throw new IllegalStateException("Expected failure");
                    });
                    scope.join();
                    await(interrupted);
                    check(finished.getCount() == 1, "join can return before an interrupted sibling terminates");
                    try {
                        scope.throwIfFailed();
                        throw new AssertionError("Expected propagated failure");
                    } catch (ExecutionException expected) {
                        check(expected.getCause() instanceof IllegalStateException, "Original failure must be preserved");
                    }
                    joined.countDown();
                }
                check(finished.getCount() == 0, "close must wait for unfinished threads to terminate");
                returned.countDown();
                return null;
            });
            try {
                await(joined);
                check(returned.getCount() == 1, "Owner cannot finish while its child is held");
            } finally {
                release.countDown();
            }
            owner.get(5, TimeUnit.SECONDS);
            check(returned.getCount() == 0, "Owner must finish after child release");
        }
    }

    static void scopedBindings() throws Exception {
        var key = ScopedValue.<List<String>>newInstance();
        var mutable = new ArrayList<String>();
        ScopedValue.where(key, mutable).run(() -> {
            key.get().add("still mutable");
            ScopedValue.where(key, List.of("inner")).run(() -> check(key.get().equals(List.of("inner")), "Nested binding"));
            check(key.get() == mutable, "Outer binding must be restored");
            try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
                var child = scope.fork(() -> key.get() == mutable);
                scope.join().throwIfFailed();
                check(child.get(), "Structured child inherits the binding, not a defensive copy");
            } catch (InterruptedException | ExecutionException failure) {
                throw new AssertionError(failure);
            }
        });
        check(mutable.equals(List.of("still mutable")), "Scoped binding must not freeze its referred-to object");
        check(!key.isBound(), "Binding must disappear outside the scope");
        try {
            key.get();
            throw new AssertionError("Access outside a binding must fail");
        } catch (java.util.NoSuchElementException expected) { }
    }

    public static void main(String[] args) throws Exception {
        singleFlight();
        structuredScope();
        scopedBindings();
        System.out.println("PASS: single-flight, scope shutdown, close termination, scoped binding and mutable object checks");
    }
}
