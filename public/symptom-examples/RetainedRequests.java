import java.util.*;
public class RetainedRequests {
    private static final List<byte[]> LISTENERS = new ArrayList<>();
    public static void main(String[] args) {
        for (int i = 0; i < 100; i++) LISTENERS.add(new byte[1024]);
        if (LISTENERS.size() != 100) throw new AssertionError();
        System.out.println("Retained requests: " + LISTENERS.size());
        LISTENERS.clear();
        if (!LISTENERS.isEmpty()) throw new AssertionError();
        // No claim about when GC reclaims the released objects.
        System.out.println("After lifecycle cleanup: " + LISTENERS.size());
    }
}
