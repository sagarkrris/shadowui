class Checks {
  public static void main(String[] args) {
    if (Exercise.demo() != 20) throw new AssertionError("combined failure");
    for (boolean reverse : new boolean[]{false,true}) {
      var service = new Exercise.Service();
      int[] versions = reverse ? new int[]{2,1,2} : new int[]{1,2,2};
      for (int v : versions) { service.apply(new Exercise.Event("north","7",v,v*10)); service.apply(new Exercise.Event("south","7",1,90)); }
      if (service.read("north","7") != 20 || service.read("south","7") != 90 || service.read("north","missing") != 0) throw new AssertionError("replay/isolation");
      service.apply(new Exercise.Event("a:b","c",1,7)); service.apply(new Exercise.Event("a","b:c",1,8));
      if (service.read("a:b","c") != 7 || service.read("a","b:c") != 8) throw new AssertionError("key components");
    }
    System.out.println("PASS");
  }
}
