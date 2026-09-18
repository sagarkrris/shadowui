import java.util.concurrent.*;
public class ContextReuse {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();
    public static void main(String[] args) throws Exception {
        ExecutorService worker = Executors.newSingleThreadExecutor();
        try {
            worker.submit(() -> CONTEXT.set("tenant-A")).get(2, TimeUnit.SECONDS);
            String stale = worker.submit(() -> CONTEXT.get()).get(2, TimeUnit.SECONDS);
            if (!"tenant-A".equals(stale)) throw new AssertionError();
            System.out.println("Without cleanup: " + stale);
            worker.submit(() -> { try { CONTEXT.set("tenant-B"); } finally { CONTEXT.remove(); } }).get(2, TimeUnit.SECONDS);
            if (worker.submit(() -> CONTEXT.get()).get(2, TimeUnit.SECONDS) != null) throw new AssertionError();
            System.out.println("After cleanup: null");
        } finally { worker.shutdownNow(); }
    }
}
