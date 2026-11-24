package learning.orders;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class OrderStore {
    private final JdbcTemplate jdbc;

    OrderStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    void insert(OrderService.Order order) {
        jdbc.update("insert into orders (id, sku, quantity, placed_at) values (?, ?, ?, ?)",
                order.id(), order.sku(), order.quantity(),
                OffsetDateTime.ofInstant(order.placedAt(), ZoneOffset.UTC));
    }

    boolean reserve(String sku, int quantity) {
        return jdbc.update("""
                update inventory set remaining = remaining - ?
                where sku = ? and remaining >= ?
                """, quantity, sku, quantity) == 1;
    }
}
