package lab.checkout;

import java.net.URI;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Profile("orders")
@RestController
class Orders {
    private final JdbcTemplate db;
    private final Transport transport;

    Orders(JdbcTemplate db, Transport transport) {
        this.db = db;
        this.transport = transport;
    }

    record OrderView(UUID orderId, Workflow.Decision decision, Workflow.Status status) {}

    @PutMapping("/orders/{id}")
    @Transactional
    public ResponseEntity<OrderView> place(@PathVariable UUID id, @RequestParam Workflow.Decision decision) {
        if (db.update("""
                INSERT INTO orders (order_id, decision, status) VALUES (?, ?, 'RESERVING')
                ON CONFLICT DO NOTHING
                """, id, decision.name()) == 1) {
            transport.enqueue(id, Workflow.Kind.RESERVE, decision);
        }
        OrderView order = get(id);
        if (order.decision() != decision) {
            throw new ResponseStatusException(CONFLICT, "Order already exists with a different decision");
        }
        return ResponseEntity.status(Workflow.Status.CONFIRMED == order.status() ||
                Workflow.Status.CANCELLED == order.status() ? 200 : 202)
                .location(URI.create("/orders/" + id)).body(order);
    }

    @GetMapping("/orders/{id}")
    public OrderView get(@PathVariable UUID id) {
        return find(id, false);
    }

    @KafkaListener(topics = Workflow.ORDERS, groupId = "checkout-orders")
    @Transactional
    public void accept(String payload) {
        Message reply = transport.decode(payload);
        if (!transport.claim(reply)) return;

        OrderView order = find(reply.orderId(), true);
        if (order.decision() != reply.decision()) {
            throw new IllegalArgumentException("Reply decision differs from order");
        }
        Workflow.advance(order.status(), reply.kind()).ifPresent(transition -> {
            db.update("UPDATE orders SET status = ? WHERE order_id = ?",
                    transition.status().name(), reply.orderId());
            transition.nextCommand().ifPresent(command -> transport.enqueue(reply.orderId(), command, order.decision()));
        });
    }

    private OrderView find(UUID id, boolean lock) {
        String sql = "SELECT decision, status FROM orders WHERE order_id = ?";
        return db.query(sql + (lock ? " FOR UPDATE" : ""), (row, number) ->
                new OrderView(id, Workflow.Decision.valueOf(row.getString("decision")),
                        Workflow.Status.valueOf(row.getString("status"))), id)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));
    }
}
