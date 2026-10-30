import java.util.*;
class Checks {
  static class Approvals extends ArrayList<String> {
    int containsCalls;
    Approvals() { super(List.of("a", "b")); }
    @Override public boolean contains(Object value) { containsCalls++; return super.contains(value); }
  }
  public static void main(String[] args) {
    var approved = new Approvals();
    if (!Exercise.allowed(List.of("b", "a", "b", "c"), approved).equals(List.of("b", "a", "b"))) throw new AssertionError("order/duplicates");
    if (approved.containsCalls != 0) throw new AssertionError("repeated membership scan");
    var random = new Random(17);
    for (int trial = 0; trial < 100; trial++) {
      List<String> requests = new ArrayList<>(), approvals = new ArrayList<>();
      for (int i = 0; i < trial % 13; i++) { requests.add("" + random.nextInt(5)); approvals.add("" + random.nextInt(5)); }
      var before = List.copyOf(requests);
      var expected = requests.stream().filter(approvals::contains).toList();
      if (!Exercise.allowed(requests, approvals).equals(expected) || !requests.equals(before)) throw new AssertionError("oracle/mutation");
    }
    if (!approved.equals(List.of("a", "b"))) throw new AssertionError("approval mutation");
    System.out.println("PASS");
  }
}
