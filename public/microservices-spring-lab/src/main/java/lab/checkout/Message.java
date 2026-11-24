package lab.checkout;

import java.util.Objects;
import java.util.UUID;

record Message(UUID messageId, UUID orderId, Workflow.Kind kind, Workflow.Decision decision) {
    Message {
        Objects.requireNonNull(messageId);
        Objects.requireNonNull(orderId);
        Objects.requireNonNull(kind);
        Objects.requireNonNull(decision);
    }
}
