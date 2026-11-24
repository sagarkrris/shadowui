package learning.micronaut;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class OrderPolicyTest {
    @Test
    void validatesSettingsAndQuantityBoundariesWithoutAContainer() {
        assertThrows(IllegalArgumentException.class, () -> new OrderPolicy(0));
        assertThrows(IllegalArgumentException.class, () -> new OrderPolicy(101));
        var policy = new OrderPolicy(5);
        assertFalse(policy.allows(0));
        assertTrue(policy.allows(1));
        assertTrue(policy.allows(5));
        assertFalse(policy.allows(6));
    }
}
