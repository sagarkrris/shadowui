package lab.checkout;

import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@Profile("payment")
@RestController
class Payment {
    private static final Logger LOG = LoggerFactory.getLogger(Payment.class);

    private final JdbcTemplate db;
    private final Transport transport;
    private final TransactionTemplate transactions;
    private final LabFaults faults;

    Payment(JdbcTemplate db, Transport transport, TransactionTemplate transactions, LabFaults faults) {
        this.db = db;
        this.transport = transport;
        this.transactions = transactions;
        this.faults = faults;
    }

    @GetMapping("/payments/{id}")
    public Map<String, String> payment(@PathVariable UUID id) {
        return Map.of("outcome", outcome(id));
    }

    @KafkaListener(topics = Workflow.PAYMENT, groupId = "checkout-payment")
    public void accept(String payload) {
        Message command = transport.decode(payload);
        if (command.kind() != Workflow.Kind.CAPTURE) {
            throw new IllegalArgumentException("Payment accepts capture commands only");
        }
        boolean applied = Boolean.TRUE.equals(transactions.execute(transaction -> {
            if (!transport.claim(command)) {
                if (!faults.enabled(command.orderId(), LabFaults.Fault.PAYMENT_ACK)) {
                    LOG.info("Ignored duplicate payment command {}.", command.messageId());
                }
                return false;
            }
            // The recorded outcome is the entire payment effect in this lab.
            db.update("""
                    INSERT INTO payment (order_id, outcome) VALUES (?, ?)
                    ON CONFLICT DO NOTHING
                    """, command.orderId(), command.decision() == Workflow.Decision.APPROVE ? "CAPTURED" : "DECLINED");
            transport.enqueue(command.orderId(), Workflow.Kind.valueOf(outcome(command.orderId())), command.decision());
            return true;
        }));
        if (faults.enabled(command.orderId(), LabFaults.Fault.PAYMENT_ACK)) {
            if (applied) LOG.warn("Injected lost offset acknowledgement after Payment commit for {}", command.orderId());
            throw new IllegalStateException("Payment offset acknowledgement held by lab fault");
        }
    }

    private String outcome(UUID orderId) {
        return db.query("SELECT outcome FROM payment WHERE order_id = ?",
                (row, number) -> row.getString("outcome"), orderId).stream().findFirst().orElse("ABSENT");
    }
}
