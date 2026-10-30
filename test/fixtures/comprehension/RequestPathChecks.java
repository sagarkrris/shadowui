import java.util.*;
class Checks {
  public static void main(String[] args) {
    for (String tenant : List.of("north", "south")) {
      var account = Exercise.controller(tenant, "7").orElseThrow();
      if (!account.tenant().equals(tenant)) throw new AssertionError("tenant isolation");
    }
    if (Exercise.controller("unknown", "7").isPresent() || Exercise.controller("north", "missing").isPresent()) throw new AssertionError("missing");
    try { Exercise.controller(null, "7"); throw new AssertionError("null accepted"); } catch (NullPointerException expected) { }
    System.out.println("PASS");
  }
}
