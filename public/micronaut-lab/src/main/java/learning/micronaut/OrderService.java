package learning.micronaut;

import jakarta.inject.Singleton;
import jakarta.transaction.Transactional;
import java.time.Clock;
import java.util.Optional;
import java.util.UUID;

@Singleton
public class OrderService {
    private final ReservationRepository repository;
    private final OrderPolicy policy;
    private final Clock clock;

    OrderService(ReservationRepository repository, OrderPolicy policy, Clock clock) {
        this.repository = repository;
        this.policy = policy;
        this.clock = clock;
    }

    @Transactional
    public Reservation place(String sku, int quantity) {
        if (!policy.allows(quantity)) {
            throw new InvalidQuantity();
        }
        if (repository.reserveStock(sku, quantity) == 0) {
            throw new StockUnavailable();
        }
        return repository.save(new Reservation(UUID.randomUUID(), sku, quantity, clock.instant()));
    }

    public Optional<Reservation> find(UUID id) {
        return repository.findById(id);
    }

    static final class InvalidQuantity extends RuntimeException {}
    static final class StockUnavailable extends RuntimeException {}
}
