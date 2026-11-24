package lab.checkout;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
class Transport {
    private static final Logger LOG = LoggerFactory.getLogger(Transport.class);

    private final JdbcTemplate db;
    private final KafkaTemplate<String, String> kafka;
    private final JsonMapper json;
    private final LabFaults faults;

    Transport(JdbcTemplate db, KafkaTemplate<String, String> kafka, JsonMapper json, LabFaults faults) {
        this.db = db;
        this.kafka = kafka;
        this.json = json;
        this.faults = faults;
    }

    boolean claim(Message message) {
        return db.update("INSERT INTO inbox (message_id) VALUES (?) ON CONFLICT DO NOTHING", message.messageId()) == 1;
    }

    void enqueue(UUID orderId, Workflow.Kind kind, Workflow.Decision decision) {
        Message message = new Message(UUID.randomUUID(), orderId, kind, decision);
        db.update("INSERT INTO outbox (message_id, order_id, topic, payload) VALUES (?, ?, ?, ?)",
                message.messageId(), orderId, kind.topic, json.writeValueAsString(message));
    }

    Message decode(String payload) {
        return json.readValue(payload, Message.class);
    }

    @Scheduled(fixedDelay = 500)
    void publishPending() {
        List<Pending> batch = db.query("""
                SELECT message_id, order_id, topic, payload FROM outbox
                WHERE NOT published ORDER BY sequence_id LIMIT 20
                """, (row, number) -> new Pending(row.getObject("message_id", UUID.class),
                row.getObject("order_id", UUID.class), row.getString("topic"), row.getString("payload")));
        for (Pending message : batch) {
            try {
                kafka.send(message.topic(), message.orderId().toString(), message.payload()).get(10, TimeUnit.SECONDS);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                return;
            } catch (ExecutionException | TimeoutException | org.apache.kafka.common.KafkaException failure) {
                LOG.warn("Publish outcome unavailable for message {}. Will retry.", message.id());
                return;
            }
            if (faults.enabled(message.orderId(), LabFaults.Fault.PUBLISH_MARK)) {
                LOG.info("Broker accepted message {}. Holding local published marker.", message.id());
                return;
            }
            db.update("UPDATE outbox SET published = true WHERE message_id = ?", message.id());
        }
    }

    private record Pending(UUID id, UUID orderId, String topic, String payload) {}
}
