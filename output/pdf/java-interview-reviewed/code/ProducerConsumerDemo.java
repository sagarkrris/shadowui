import java.util.Objects;
import java.util.concurrent.*;
import java.util.function.IntConsumer;

/** One producer and one consumer; callbacks must cooperate with interruption. */
public final class ProducerConsumerDemo {
    private record Item(int value, boolean end) {}
    private static final Item END = new Item(0, true);

    public static void run(int count, IntConsumer consume)
            throws InterruptedException, ExecutionException {
        if (count < 0) throw new IllegalArgumentException("negative count");
        Objects.requireNonNull(consume, "consume");
        BlockingQueue<Item> queue = new ArrayBlockingQueue<>(10);
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            CompletionService<Void> completion = new ExecutorCompletionService<>(executor);
            Future<Void> producer = completion.submit(() -> {
                for (int i = 0; i < count; i++) queue.put(new Item(i + 1, false));
                queue.put(END);
                return null;
            });
            Future<Void> consumer = completion.submit(() -> {
                while (true) {
                    Item item = queue.take();
                    if (item.end()) return null;
                    consume.accept(item.value());
                }
            });
            try {
                // Observe whichever task completes first, including early failure.
                completion.take().get();
                completion.take().get();
            } finally {
                // A failed or interrupted side must not strand its peer.
                producer.cancel(true);
                consumer.cancel(true);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        run(20, value -> System.out.println("Consumed: " + value));
    }
}
