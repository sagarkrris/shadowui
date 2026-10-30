import java.util.*;
class Checks {
  public static void main(String[] args) {
    if (!Exercise.demo().equals(List.of("b","c"))) throw new AssertionError("lost b");
    var service = new Exercise.ExportService(List.of(new Exercise.Row(2,"c"), new Exercise.Row(1,"a"),new Exercise.Row(1,"b")));
    for (int limit : new int[]{1,2,3}) {
      if (!service.export(Set.of("b","c"),limit).equals(List.of("b","c"))) throw new AssertionError("page overlap");
      if (!service.export(Set.of(),limit).isEmpty()) throw new AssertionError("all filtered");
      if (!service.export(Set.of("a","b","c"),limit).equals(List.of("a","b","c"))) throw new AssertionError("full export");
    }
    if (!new Exercise.ExportService(List.of()).export(Set.of("a"),1).isEmpty()) throw new AssertionError("empty");
    try { service.export(Set.of(),0); throw new AssertionError("limit"); } catch (IllegalArgumentException expected) { }
    System.out.println("PASS");
  }
}
