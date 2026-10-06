import java.math.RoundingMode;
import java.util.Arrays;
import java.util.Optional;

final class MoneyExampleChecks {
  private static void check(boolean condition) { if (!condition) throw new AssertionError(); }
  private static void rejects(Runnable action) { try { action.run(); throw new AssertionError("expected rejection"); } catch (IllegalArgumentException expected) { } }
  public static void main(String[] args) {
    var usd = new MoneyContractExample.Money(105, "USD");
    check(MoneyContractExample.add(usd, new MoneyContractExample.Money(-5, "USD")).minor() == 100);
    rejects(() -> MoneyContractExample.add(usd, new MoneyContractExample.Money(1, "EUR")));
    rejects(() -> new MoneyContractExample.Money(1, "usd"));
    check(MoneyParsingExample.parseMinor("10.50", 2) == 1050);
    check(MoneyParsingExample.parseMinor("10", 0) == 10);
    rejects(() -> MoneyParsingExample.parseMinor("10.501", 2));
    rejects(() -> MoneyParsingExample.parseMinor("", 2));
    check(Arrays.equals(MoneyAllocationExample.allocate(5, new int[]{1, 1, 1}), new long[]{2, 2, 1}));
    check(Arrays.equals(MoneyAllocationExample.allocate(7, new int[]{1, 2}), new long[]{2, 5}));
    check(Arrays.stream(MoneyAllocationExample.allocate(Long.MAX_VALUE, new int[]{1, 1})).reduce(0L, Math::addExact) == Long.MAX_VALUE);
    rejects(() -> MoneyAllocationExample.allocate(-1, new int[]{1}));
    rejects(() -> MoneyAllocationExample.allocate(1, new int[]{1, 0}));
    var quote = new FxQuoteExample.Quote("EUR", "USD", new java.math.BigDecimal("1.25"), 100, "rate-7");
    check(FxQuoteExample.convert(100, "EUR", "USD", quote, 110, 10, RoundingMode.HALF_UP, 2, 2) == 125);
    check(FxQuoteExample.convert(1, "EUR", "USD", quote, 110, 10, RoundingMode.HALF_UP, 2, 2) == 1);
    rejects(() -> FxQuoteExample.convert(100, "EUR", "USD", quote, 111, 10, RoundingMode.HALF_UP, 2, 2));
    rejects(() -> FxQuoteExample.convert(100, "USD", "EUR", quote, 110, 10, RoundingMode.HALF_UP, 2, 2));
    var yen = new FxQuoteExample.Quote("USD", "JPY", new java.math.BigDecimal("150"), 100, "rate-8");
    check(FxQuoteExample.convert(100, "USD", "JPY", yen, 100, 0, RoundingMode.HALF_UP, 2, 0) == 150);
    var reverse = new FxQuoteExample.Quote("JPY", "USD", new java.math.BigDecimal("0.00625"), 100, "rate-9");
    check(FxQuoteExample.convert(100, "JPY", "USD", reverse, 100, 0, RoundingMode.HALF_UP, 0, 2) == 63);
    check(FxQuoteExample.convert(100, "JPY", "USD", reverse, 100, 0, RoundingMode.HALF_EVEN, 0, 2) == 62);
    rejects(() -> FxQuoteExample.convert(1, "USD", "JPY", yen, 99, 0, RoundingMode.HALF_UP, 2, 0));
    rejects(() -> FxQuoteExample.convert(1, "USD", "JPY", yen, 100, 0, RoundingMode.HALF_UP, -1, 0));
    for (String invalid : new String[]{"1e1000000000", "1e2", "1,00", " 1", "+1", "1".repeat(65)}) rejects(() -> MoneyParsingExample.parseMinor(invalid, 2));
    rejects(() -> MoneyParsingExample.parseMinor(null, 2));
    check(MoneyParsingExample.parseMinor("-0.01", 2) == -1);
    check(Arrays.equals(MoneyAllocationExample.allocate(0, new int[]{1, 2}), new long[]{0, 0}));
    rejects(() -> MoneyAllocationExample.allocate(1, null));
    rejects(() -> MoneyAllocationExample.allocate(1, new int[]{}));
    check(PaymentOutcomeExample.afterDispatch(false, true, false) == PaymentOutcomeExample.State.UNKNOWN);
    check(PaymentOutcomeExample.afterDispatch(true, true, false) == PaymentOutcomeExample.State.POSTED);
    for (var state : PaymentOutcomeExample.State.values()) {
      check(PaymentOutcomeExample.mayRetry(state, "op-1", false) == (state == PaymentOutcomeExample.State.READY));
      check(PaymentOutcomeExample.mayRetry(state, "op-1", true) == (state != PaymentOutcomeExample.State.POSTED && state != PaymentOutcomeExample.State.REJECTED));
    }
    rejects(() -> PaymentOutcomeExample.afterDispatch(true, true, true));
    check(ReconciliationExample.reconcile(ReconciliationExample.Status.PENDING, Optional.of(true)) == ReconciliationExample.Status.POSTED);
    check(ReconciliationExample.reconcile(ReconciliationExample.Status.PENDING, Optional.empty()) == ReconciliationExample.Status.DISCREPANCY);
    check(ReconciliationExample.reconcile(ReconciliationExample.Status.POSTED, Optional.of(false)) == ReconciliationExample.Status.POSTED);
    System.out.println("Money checks passed");
  }
}
