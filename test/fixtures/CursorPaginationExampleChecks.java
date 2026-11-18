class CursorPaginationExampleChecks {
  static void check(boolean value) { if (!value) throw new AssertionError(); }
  public static void main(String[] args) {
    var boundary = new CursorOrderExample.Row(10, 7);
    check(CursorOrderExample.after(new CursorOrderExample.Row(10, 8), boundary));
    check(CursorOrderExample.after(new CursorOrderExample.Row(11, 1), boundary));
    check(!CursorOrderExample.after(new CursorOrderExample.Row(10, 7), boundary));
    check(!CursorOrderExample.after(new CursorOrderExample.Row(9, 99), boundary));
    check(CursorScopeExample.matches(CursorScopeExample.scope("tenant-a", "v1"), "tenant-a|v1"));
    check(!CursorScopeExample.matches("tenant-a|v1", "tenant-b|v1"));
    check(PageSizeExample.fetchLimit(20, 100) == 21); check(PageSizeExample.fetchLimit(1000, 100) == 101);
    check(TraversalPolicyExample.insertedBeforeBoundary(TraversalPolicyExample.Policy.BEST_EFFORT).equals("may_be_omitted"));
    check(CursorExpiryExample.valid(10, 19, 10)); check(!CursorExpiryExample.valid(10, 20, 10));
    check(CursorMetricExample.outcome(true, false, true).equals("scope_mismatch"));
    System.out.println("Cursor pagination checks passed");
  }
}
