package lab.checkout;

import java.util.Optional;

final class Workflow {
    static final String ORDERS = "checkout.orders";
    static final String INVENTORY = "checkout.inventory";
    static final String PAYMENT = "checkout.payment";

    enum Decision { APPROVE, DECLINE }
    enum Status { RESERVING, PAYING, COMPENSATING, CONFIRMED, CANCELLED }
    enum Kind {
        RESERVE(INVENTORY), RELEASE(INVENTORY), CAPTURE(PAYMENT),
        RESERVED(ORDERS), OUT_OF_STOCK(ORDERS), CAPTURED(ORDERS), DECLINED(ORDERS), RELEASED(ORDERS);

        final String topic;

        Kind(String topic) {
            this.topic = topic;
        }
    }

    record Transition(Status status, Optional<Kind> nextCommand) {}

    static Optional<Transition> advance(Status current, Kind received) {
        return switch (received) {
            case RESERVED -> transition(current, Status.RESERVING, Status.PAYING, Kind.CAPTURE);
            case OUT_OF_STOCK -> transition(current, Status.RESERVING, Status.CANCELLED, null);
            case CAPTURED -> transition(current, Status.PAYING, Status.CONFIRMED, null);
            case DECLINED -> transition(current, Status.PAYING, Status.COMPENSATING, Kind.RELEASE);
            case RELEASED -> transition(current, Status.COMPENSATING, Status.CANCELLED, null);
            default -> throw new IllegalArgumentException("Orders accepts replies only");
        };
    }

    private static Optional<Transition> transition(Status current, Status expected, Status next, Kind command) {
        return current == expected ? Optional.of(new Transition(next, Optional.ofNullable(command))) : Optional.empty();
    }
}
