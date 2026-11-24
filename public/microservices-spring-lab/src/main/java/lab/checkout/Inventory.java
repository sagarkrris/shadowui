package lab.checkout;

import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Profile("inventory")
@RestController
class Inventory {
    private static final Logger LOG = LoggerFactory.getLogger(Inventory.class);

    private final JdbcTemplate db;
    private final Transport transport;
    private final LabFaults faults;

    Inventory(JdbcTemplate db, Transport transport, LabFaults faults) {
        this.db = db;
        this.transport = transport;
        this.faults = faults;
    }

    @GetMapping("/stock")
    public Map<String, Integer> stock() {
        return Map.of("available", db.queryForObject("SELECT available FROM stock WHERE sku = 'DEMO'", Integer.class));
    }

    @GetMapping("/reservations/{id}")
    public Map<String, String> reservation(@PathVariable UUID id) {
        return Map.of("status", status(id));
    }

    @KafkaListener(topics = Workflow.INVENTORY, groupId = "checkout-inventory")
    @Transactional
    public void accept(String payload) {
        Message command = transport.decode(payload);
        if (!transport.claim(command)) return;

        Workflow.Kind reply = switch (command.kind()) {
            case RESERVE -> reserve(command.orderId());
            case RELEASE -> release(command.orderId());
            default -> throw new IllegalArgumentException("Inventory accepts reserve and release commands only");
        };
        transport.enqueue(command.orderId(), reply, command.decision());
    }

    private Workflow.Kind reserve(UUID orderId) {
        int inserted = db.update("""
                INSERT INTO reservation (order_id, status) VALUES (?, 'PENDING')
                ON CONFLICT DO NOTHING
                """, orderId);
        if (inserted == 1) {
            int reserved = db.update("UPDATE stock SET available = available - 1 WHERE sku = 'DEMO' AND available > 0");
            db.update("UPDATE reservation SET status = ? WHERE order_id = ?",
                    reserved == 1 ? "RESERVED" : "OUT_OF_STOCK", orderId);
        }
        return switch (status(orderId)) {
            case "RESERVED", "RELEASED" -> Workflow.Kind.RESERVED;
            case "OUT_OF_STOCK" -> Workflow.Kind.OUT_OF_STOCK;
            default -> throw new IllegalStateException("Reservation has no recorded decision");
        };
    }

    private Workflow.Kind release(UUID orderId) {
        if (faults.enabled(orderId, LabFaults.Fault.RELEASE)) {
            LOG.warn("Injected release failure before commit for {}", orderId);
            throw new IllegalStateException("Inventory release held by lab fault");
        }
        if (db.update("UPDATE reservation SET status = 'RELEASED' WHERE order_id = ? AND status = 'RESERVED'", orderId) == 1) {
            db.update("UPDATE stock SET available = available + 1 WHERE sku = 'DEMO'");
        } else if (!status(orderId).equals("RELEASED")) {
            throw new IllegalStateException("No completed reservation to release");
        }
        return Workflow.Kind.RELEASED;
    }

    private String status(UUID orderId) {
        return db.query("SELECT status FROM reservation WHERE order_id = ?",
                (row, number) -> row.getString("status"), orderId).stream().findFirst().orElse("ABSENT");
    }
}
