import java.util.HashMap;
import java.util.Map;

/** Java 17+ fixture for the fictional Production Detective map case. */
public final class DetectiveMapCase {
    // Deliberately unsafe, matching the evidence shown to the reader.
    static final class CustomerKey {
        int id;
        CustomerKey(int id) { this.id = id; }
        @Override public int hashCode() { return id; }
        @Override public boolean equals(Object other) {
            return other instanceof CustomerKey key && id == key.id;
        }
    }

    public static void main(String[] args) {
        CustomerKey customer = new CustomerKey(1);
        Map<CustomerKey, String> map = new HashMap<>();
        map.put(customer, "R-71");
        if (!"R-71".equals(map.get(new CustomerKey(1)))) {
            throw new AssertionError("Equal stable keys must retrieve the reservation");
        }
        customer.id = 2;
        if (map.get(customer) != null || map.size() != 1 || map.keySet().iterator().next().id != 2) {
            throw new AssertionError("Mutable-key failure does not match the published case");
        }
        System.out.println(map.get(customer));
        System.out.println(map.size());

        Map<Integer, String> reservationsById = new HashMap<>();
        int reservationId = 71;
        reservationsById.put(reservationId, "R-71");
        customer.id = 3;
        if (!"R-71".equals(reservationsById.get(reservationId))) {
            throw new AssertionError("Stable reservation identity must survive enrichment");
        }
        if (customer.equals(null) || customer.equals("3")) {
            throw new AssertionError("Equality must reject null and unrelated types");
        }
        System.out.println("Stable-key repair: PASS");
    }
}
