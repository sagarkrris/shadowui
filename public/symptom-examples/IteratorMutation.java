import java.util.*;
public class IteratorMutation {
    public static void main(String[] args) {
        List<String> values = new ArrayList<>(Arrays.asList("a", "b"));
        Iterator<String> iterator = values.iterator();
        iterator.next(); values.add("c");
        try { iterator.next(); throw new AssertionError("Expected invalidation"); }
        catch (ConcurrentModificationException expected) { System.out.println("Direct mutation detected"); }
        values = new ArrayList<>(Arrays.asList("a", "b"));
        iterator = values.iterator();
        while (iterator.hasNext()) { if (iterator.next().equals("a")) iterator.remove(); }
        if (!values.equals(Collections.singletonList("b"))) throw new AssertionError();
        System.out.println("Iterator removal leaves: " + values);
    }
}
