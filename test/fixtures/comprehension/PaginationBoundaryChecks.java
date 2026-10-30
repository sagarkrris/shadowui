import java.util.*;
class Checks {
  public static void main(String[] args) {
    var rows = List.of(new Exercise.Row(2,"c"), new Exercise.Row(1,"b"), new Exercise.Row(1,"a"));
    for (int limit : new int[]{1,2}) {
      List<String> ids = new ArrayList<>(); Exercise.Row cursor = null; boolean done = false;
      for (int step = 0; step < 5; step++) {
        var batch = Exercise.page(rows, cursor, limit);
        if (batch.isEmpty()) { done = true; break; }
        for (var row : batch) ids.add(row.id());
        cursor = batch.get(batch.size()-1);
      }
      if (!done || !ids.equals(List.of("a","b","c"))) throw new AssertionError("lost/repeated records: " + ids);
    }
    if (!Exercise.page(rows, new Exercise.Row(1,"aa"), 1).get(0).id().equals("b")) throw new AssertionError("absent tuple");
    if (!Exercise.page(List.of(), null, 1).isEmpty()) throw new AssertionError("empty");
    var extremes = List.of(new Exercise.Row(Integer.MAX_VALUE,"z"),new Exercise.Row(Integer.MIN_VALUE,"a"));
    if (!Exercise.page(extremes,null,1).get(0).id().equals("a")) throw new AssertionError("overflow");
    try { Exercise.page(rows,null,0); throw new AssertionError("limit"); } catch (IllegalArgumentException expected) { }
    if (!rows.get(0).id().equals("c")) throw new AssertionError("mutation");
    System.out.println("PASS");
  }
}
