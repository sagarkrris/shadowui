import java.util.*;
class Checks {
  public static void main(String[] args) {
    var cache = Map.of("zero", new Exercise.Entry(0, 10), "negative", new Exercise.Entry(-3, 10));
    if (Exercise.read(cache, "missing", 9).isPresent()) throw new AssertionError("fabricated hit");
    if (Exercise.read(cache, "zero", 9).orElseThrow() != 0 || Exercise.read(cache, "negative", 9).orElseThrow() != -3) throw new AssertionError("valid value lost");
    for (long now : new long[]{10,11}) if (Exercise.read(cache, "zero", now).isPresent()) throw new AssertionError("expiry");
    if (cache.size() != 2 || cache.get("zero").expiresAt() != 10) throw new AssertionError("mutation");
    System.out.println("PASS");
  }
}
