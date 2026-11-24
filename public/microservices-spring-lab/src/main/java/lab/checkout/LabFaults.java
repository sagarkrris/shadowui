package lab.checkout;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
class LabFaults {
    enum Fault { PUBLISH_MARK, PAYMENT_ACK, RELEASE }
    private record Switch(UUID orderId, Fault fault) {}

    private final Set<Switch> enabled = ConcurrentHashMap.newKeySet();

    @PutMapping("/lab/faults/{orderId}/{fault}")
    @ResponseStatus(NO_CONTENT)
    void enable(@PathVariable UUID orderId, @PathVariable Fault fault) {
        enabled.add(new Switch(orderId, fault));
    }

    @DeleteMapping("/lab/faults/{orderId}/{fault}")
    @ResponseStatus(NO_CONTENT)
    void disable(@PathVariable UUID orderId, @PathVariable Fault fault) {
        enabled.remove(new Switch(orderId, fault));
    }

    boolean enabled(UUID orderId, Fault fault) {
        return enabled.contains(new Switch(orderId, fault));
    }
}
