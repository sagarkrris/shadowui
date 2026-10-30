import java.util.*;
class Checks {
  static void equal(List<String> actual, List<String> expected) { if (!actual.equals(expected)) throw new AssertionError(actual.toString()); }
  public static void main(String[] args) {
    // This bounded acyclic counterexample rejects the starter before testing cycles.
    equal(Exercise.reachable(Map.of("A", List.of("B", "C"), "B", List.of("C")), "A"), List.of("A", "B", "C"));
    equal(Exercise.reachable(Map.of("A", List.of("A", "B", "B"), "B", List.of("A")), "A"), List.of("A", "B"));
    equal(Exercise.reachable(Map.of("X", List.of("Y")), "A"), List.of("A"));
    equal(Exercise.reachable(Map.of("A", List.of("C", "B")), "A"), List.of("A", "C", "B"));
    System.out.println("PASS");
  }
}
