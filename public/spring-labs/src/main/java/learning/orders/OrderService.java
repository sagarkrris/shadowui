package learning.orders;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class OrderService {
    private final OrderStore store;
    private final OrderPolicy policy;

    private final Clock clock;

    OrderService(OrderStore store, OrderPolicy policy, Clock clock) {
        this.store = store;
        this.policy = policy;
        this.clock = clock;
    }

    @Transactional
    public Order place(String sku, int quantity) {
        if (quantity < 1 || quantity > policy.maxQuantity()) {
            throw new OrderRejected("Quantity is outside the configured order limit");
        }
        if (!store.reserve(sku, quantity)) {
            throw new StockUnavailable();
        }
        Order order = new Order(UUID.randomUUID(), sku, quantity, clock.instant());
        store.insert(order);
        return order;
    }

    record Order(UUID id, String sku, int quantity, Instant placedAt) {}

    static final class OrderRejected extends RuntimeException {
        OrderRejected(String message) {
            super(message);
        }
    }

    static final class StockUnavailable extends RuntimeException {}
}
