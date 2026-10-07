import java.time.*;
import java.util.*;

final class JavaTimeExampleChecks {
  private static void check(boolean value) { if (!value) throw new AssertionError(); }
  private static void rejects(Runnable action) { try { action.run(); throw new AssertionError("expected rejection"); } catch (IllegalArgumentException | IllegalStateException expected) { } }
  public static void main(String[] args) {
    var utc = ZoneId.of("UTC");
    var tokyo = ZoneId.of("Asia/Tokyo");
    var moment = Instant.parse("2026-01-01T23:30:00Z");
    check(TimeTypesExample.auditMoment(Clock.fixed(moment, utc)).equals(moment));
    check(TimeTypesExample.businessDate(moment, tokyo).equals(LocalDate.of(2026, 1, 2)));
    rejects(() -> TimeTypesExample.businessDate(null, utc));
    var ny = ZoneId.of("America/New_York");
    rejects(() -> DstResolutionExample.resolve(LocalDateTime.of(2026, 3, 8, 2, 30), ny, false));
    var early = DstResolutionExample.resolve(LocalDateTime.of(2026, 11, 1, 1, 30), ny, false);
    var late = DstResolutionExample.resolve(LocalDateTime.of(2026, 11, 1, 1, 30), ny, true);
    check(late.toInstant().isAfter(early.toInstant()));
    var key = new ScheduleIdentityExample.RunKey("customer-7", LocalDate.of(2026, 11, 1), 2);
    check(ScheduleIdentityExample.idempotencyKey(key).equals("customer-7:2026-11-01:v2"));
    rejects(() -> new ScheduleIdentityExample.RunKey(" ", LocalDate.of(2026, 1, 1), 1));
    check(MonotonicDeadlineExample.remainingNanos(100, 50, 120) == 30);
    check(MonotonicDeadlineExample.remainingNanos(100, 50, 150) == 0);
    check(MonotonicDeadlineExample.remainingNanos(-100, 50, -80) == 30);
    check(MonotonicDeadlineExample.remainingNanos(Long.MAX_VALUE - 9, 50, Long.MIN_VALUE + 10) == 30);
    check(MonotonicDeadlineExample.remainingNanos(-1, 0, -1) == 0);
    rejects(() -> MonotonicDeadlineExample.remainingNanos(0, -1, 0));
    rejects(() -> MonotonicDeadlineExample.remainingNanos(100, 50, 99));
    check(ScheduledDeliveryExample.responseLost(ScheduledDeliveryExample.State.IN_FLIGHT) == ScheduledDeliveryExample.State.UNKNOWN);
    check(ScheduledDeliveryExample.reconcile(ScheduledDeliveryExample.State.UNKNOWN, Optional.of(true)) == ScheduledDeliveryExample.State.CONFIRMED);
    check(ScheduledDeliveryExample.reconcile(ScheduledDeliveryExample.State.UNKNOWN, Optional.empty()) == ScheduledDeliveryExample.State.UNKNOWN);
    rejects(() -> ScheduledDeliveryExample.responseLost(ScheduledDeliveryExample.State.CONFIRMED));
    var due = Instant.parse("2026-01-01T00:00:00Z");
    check(ScheduleRecoveryExample.overdueAction(due, due.plusSeconds(30), Duration.ofMinutes(1)) == ScheduleRecoveryExample.Action.RUN);
    check(ScheduleRecoveryExample.overdueAction(due, due.plusSeconds(61), Duration.ofMinutes(1)) == ScheduleRecoveryExample.Action.SKIP);
    check(ScheduleRecoveryExample.overdueAction(due, due.minusNanos(1), Duration.ZERO) == ScheduleRecoveryExample.Action.WAIT);
    check(ScheduleRecoveryExample.overdueAction(due, due, Duration.ZERO) == ScheduleRecoveryExample.Action.RUN);
    check(ScheduleRecoveryExample.overdueAction(due, due.plusSeconds(60), Duration.ofMinutes(1)) == ScheduleRecoveryExample.Action.RUN);
    check(ScheduleRecoveryExample.overdueAction(due, due.plusSeconds(60).plusNanos(1), Duration.ofMinutes(1)) == ScheduleRecoveryExample.Action.SKIP);
    for (var state : ScheduledDeliveryExample.State.values()) {
      for (var evidence : List.of(Optional.<Boolean>empty(), Optional.of(true), Optional.of(false))) {
        var expected = state == ScheduledDeliveryExample.State.UNKNOWN && evidence.isPresent()
            ? (evidence.get() ? ScheduledDeliveryExample.State.CONFIRMED : ScheduledDeliveryExample.State.REJECTED) : state;
        check(ScheduledDeliveryExample.reconcile(state, evidence) == expected);
      }
    }
    rejects(() -> ScheduleRecoveryExample.overdueAction(due, due, Duration.ofSeconds(-1)));
    System.out.println("Java time checks passed");
  }
}
