# Set 30 — Time contracts and calendar policies

16 November 2026 · S30-Q01–S30-Q12

Assume Java 21, ISO calendar, no preview features. Examples are original illustrations. The Java block below is compiled and checked by the dedicated fixture; transport, database and scheduler scenarios are contextual, not running integrations. Practise each spoken answer in 45–90 seconds.

**1. A January 31 subscription drifts to the 28th after two renewals. How should monthly recurrence preserve intent?**

**Say aloud:** “A recurrence is a rule for producing dates, not merely the last date produced. Adding one month to January 31 clamps to the last valid February day. Adding another month to that result then uses the 28th as its new starting day. I would retain the original billing day or an explicit last-day-of-month rule and calculate each occurrence from its target month. These are different product contracts: a day-30 subscription should not accidentally become a last-day subscription. Persist the rule alongside the next occurrence so restarts preserve intent. I would test a full year including leap February and retries of the same billing occurrence; correct date calculation alone does not prevent duplicate charges.”

**Example:** YearMonth.of(2027, 3).atEndOfMonth() gives March 31; repeated plusMonths from January 31 gives March 28.

**Deep dive / verification:** Use YearMonth plus an anchor day and min(anchor, lengthOfMonth()) for clamped-day policy. Constant work per occurrence; preserve the anchor across restarts.

**Follow-ups:** Why not add 30 days? Months have different lengths; fixed-day increments implement another contract.

**Primary reference:** [Java 21 YearMonth](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/YearMonth.html).

---

**2. A one-day retention setting and a calendar-day report disagree across a clock change. Which amount belongs in each?**

**Say aloud:** “A duration is an elapsed amount measured in seconds and nanoseconds. A period is a calendar amount expressed in years, months and days. For a 24-hour retention promise I would use Duration; for the same local time tomorrow I would use calendar arithmetic in the business zone. Those policies can give different instants across a clock change. First I would ask whether the requirement means elapsed hours or a local calendar boundary, then name and store the setting accordingly. Verification should compare actual expiration instants on both sides of a transition. Picking the type makes the policy visible but still requires a defined zone and an explicit boundary comparison.”

**Example:** Duration.ofDays(1) is exactly 86400 seconds; Period.ofDays(1) expresses a calendar day.

**Deep dive / verification:** Constant work for one addition; zone rules and business meaning determine the result. Neither type represents a holiday calendar.

**Follow-ups:** Can a Period be converted to seconds without a date? Not generally: months and calendar transitions need context.

**Primary reference:** [Java 21 Duration](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html).

---

**3. A 36-hour timeout becomes 12 after conversion. What is the difference between total hours and an hours part?**

**Say aloud:** “A duration part is a component after larger units have been removed. Total hours answers how many whole hours fit in the complete duration; an hours part answers the remainder after complete days. For a timeout sent to another service I would preserve the total quantity in the agreed unit, rather than serialize a display component. For a user-facing countdown, separate day and hour components may be appropriate. I would keep the quantity typed as Duration until the transport boundary, validate sign and upper limits there, and document truncation of fractions. Tests should include durations longer than a day and shorter than one hour so a plausible small result cannot conceal unit loss.”

**Example:** Duration.ofHours(36).toHours() is 36; toHoursPart() is 12.

**Deep dive / verification:** Constant work; converting to a narrower unit may lose fractions or overflow for very large amounts. Reject invalid timeout values before sending.

**Follow-ups:** Is zero after conversion necessarily an immediate timeout? Transport APIs vary; validate the destination contract before passing zero.

**Primary reference:** [Java 21 Duration](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Duration.html).

---

**4. An age calculation reads Period.getDays and reports two days after more than a month. What was actually measured?**

**Say aloud:** “A Period stores separate year, month and day components. Its days accessor returns that component, not the total number of calendar days between the endpoints. For elapsed date count I would use DAYS.between on LocalDate values; for an age in completed years I would use the year component of an appropriately computed period. The requirement must also define whether endpoints are inclusive. I would avoid converting months into thirty-day approximations because that silently changes the meaning. Tests should cross month and year boundaries and include reverse endpoints. A negative result might be a useful signed difference or invalid input, depending on the domain, so validation belongs at that boundary.”

**Example:** Period.between(LocalDate.of(2026,1,1), LocalDate.of(2026,2,3)).getDays() is 2; DAYS.between is 33.

**Deep dive / verification:** Constant date arithmetic; date counts exclude the end. Inclusive counts need a separate policy and range checks.

**Follow-ups:** Can normalized() fix total days? No; it normalizes years and months, not months into a universal day count.

**Primary reference:** [Java 21 Period](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Period.html).

---

**5. An event timestamp arrives in epoch seconds but appears near 1970. How should Java expose the unit boundary?**

**Say aloud:** “An epoch value is a count from an agreed origin. A bare long does not say whether its unit is seconds, milliseconds or something else. Passing seconds to ofEpochMilli yields a valid instant with the wrong meaning, so exception handling does not detect this bug. I would define the unit in the schema and field name, convert with the matching Instant factory once at the adapter boundary, and use Instant internally. Range checks based on the business domain can catch obvious mistakes but should supplement the schema, since seconds and milliseconds can both fit numeric ranges. Verification needs known timestamps on both sides of the epoch and a round trip in the declared unit.”

**Example:** Instant.ofEpochSecond(1) is one second after the epoch; Instant.ofEpochMilli(1) is one millisecond after it.

**Deep dive / verification:** Constant conversion work; never infer units solely from digit count. Avoid multiplying before checking overflow.

**Follow-ups:** Does Instant retain a region zone? No; attach a ZoneId when deriving local calendar fields.

**Primary reference:** [Java 21 Instant](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html).

---

**6. Two different nanosecond timestamps collapse to one database key. Can epoch milliseconds preserve their identity?**

**Say aloud:** “Precision is the smallest representable distinction; it is different from accuracy, which concerns closeness to the real event time. Instant can represent nanoseconds, but converting to epoch milliseconds discards finer distinctions. If a database key uses that reduced value, two events in the same millisecond can collide. I would use an independent unique event identifier and specify timestamp precision in storage and wire contracts. A time plus a stable identifier can provide deterministic tie ordering, but cannot prove real causal order across machines. Verification should round-trip two instants within the same millisecond through the actual driver, because Java representation alone says nothing about database precision or clock quality.”

**Example:** Instant.ofEpochSecond(0, 1).toEpochMilli() equals Instant.ofEpochSecond(0, 2).toEpochMilli().

**Deep dive / verification:** Constant conversion; lost precision cannot be reconstructed. Increasing declared precision does not improve clock accuracy.

**Follow-ups:** Can a timestamp be the deduplication identity? Only with additional producer guarantees; prefer a stable event ID.

**Primary reference:** [Java 21 Instant](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Instant.html).

---

**7. A deadline test fails only around midnight on CI. How can an injected Clock make the policy testable?**

**Say aloud:** “A Clock supplies an instant and a zone through an explicit dependency. Instead of calling now throughout the business logic, I would inject a clock and capture the current instant once for one decision. Tests can then fix the instant and exercise before, exactly at and after the deadline without sleeping. If the policy is based on a local business date, its zone must also be explicit. A fixed clock improves reproducibility but does not model scheduling delays or prove production clock synchronization. I would keep those concerns in separate integration checks. Capturing one now also prevents two reads during the same operation from disagreeing at a boundary.”

**Example:** Clock.fixed(Instant.parse("2026-11-16T00:00:00Z"), ZoneOffset.UTC) supplies reproducible now values.

**Deep dive / verification:** Constant decision work with bounded state. Custom Clock implementations need thread safety; fixed clocks never advance by themselves.

**Follow-ups:** How do tests advance time? Supply another fixed/offset clock or a controlled test implementation; avoid wall-clock sleeps.

**Primary reference:** [Java 21 Clock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html).

---

**8. Two OffsetDateTime values describe the same moment but equals returns false. Which identity should a deduplication key use?**

**Say aloud:** “An offset is the numeric difference from UTC. OffsetDateTime preserves both the local date-time and its offset, so two representations can identify the same instant without being equal as full values. For deduplication by moment I would normalize to Instant, while retaining the original representation separately if it is useful for audit. Even identical instants do not necessarily mean identical business events, so event identity still needs a separate contract. I would test two different offsets for one moment and two different moments with the same local clock reading. This distinguishes representation equality from timeline equality before a collection or database uniqueness constraint accidentally chooses the policy.”

**Example:** 2026-11-16T10:00+01:00 and 2026-11-16T09:00Z are isEqual but not equals.

**Deep dive / verification:** Constant comparison; isEqual compares moments. A fixed offset does not encode future regional daylight-saving rules.

**Follow-ups:** Why retain the source offset? It can explain what a sender supplied; it does not establish the sender clock was correct.

**Primary reference:** [Java 21 OffsetDateTime](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/OffsetDateTime.html).

---

**9. A report includes midnight in both adjacent days. How should date-range endpoints compose?**

**Say aloud:** “A half-open interval includes its start and excludes its end. Adjacent intervals then share a boundary without sharing an element. For a date report I would accept a start date and an exclusive end date and use the same convention in queries, loops and exported metadata. For timestamp queries, derive each boundary using the chosen business zone rather than guessing an end-of-day final nanosecond. I would validate reversed input explicitly and decide whether an empty interval is allowed. Tests should place events exactly on both boundaries and immediately around them. This policy avoids depending on the precision of a database column when composing consecutive windows.”

**Example:** For [November 16, November 17), the 16th is included and the 17th is excluded; datesUntil follows that convention.

**Deep dive / verification:** Enumerating n dates costs O(n); validate a maximum span before materializing a list. Boundaries do not provide snapshot isolation against concurrent writes.

**Follow-ups:** Why avoid 23:59:59.999? The storage precision may differ and leave a gap or overlap.

**Primary reference:** [Java 21 LocalDate](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/LocalDate.html).

---

**10. A Monday scheduler skips today even though today is eligible. Which adjuster matches the acceptance rule?**

**Say aloud:** “An adjuster transforms a date according to a rule. next(MONDAY) means a strictly later Monday, whereas nextOrSame(MONDAY) permits the input date itself. I would translate the business statement into that explicit inclusion rule rather than patching a seven-day difference after the calculation. Today being Monday is the key boundary case, but eligibility also depends on whether today's cutoff has passed. A date-only helper does not decide that. I would evaluate the cutoff in the business zone first, then choose the appropriate date rule. Verification should cover all seven input weekdays, the cutoff boundary and a repeated scheduler run so choosing today cannot create duplicate execution.”

**Example:** LocalDate.of(2026,11,16).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY)) remains November 16; next gives November 23.

**Deep dive / verification:** Constant date adjustment. Weekday arithmetic is not a holiday calendar or an execution delivery guarantee.

**Follow-ups:** What about a holiday Monday? Apply an explicit business-calendar policy with a bounded search and tested calendar data.

**Primary reference:** [Java 21 TemporalAdjusters](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/TemporalAdjusters.html).

---

**11. A February 29 anniversary silently becomes February 28. Is that validation or a product policy?**

**Say aloud:** “MonthDay represents a recurring month and day without a year. February 29 is valid in that type because some years contain it. Combining it with a non-leap year through atYear adjusts to February 28, so successful construction does not prove the original anniversary exists in that year. I would ask whether the product means February 28, March 1 or no occurrence in non-leap years and persist that policy explicitly. Use isValidYear when strict existence is required before applying a fallback. Verification should include leap years, ordinary years and century boundaries. Legal or contractual birthday rules need domain approval; a Java convenience conversion does not define them.”

**Example:** MonthDay.of(2,29).isValidYear(2027) is false; atYear(2027) returns February 28.

**Deep dive / verification:** Constant arithmetic; preserve the original MonthDay so the leap-day anchor is not permanently lost after fallback.

**Follow-ups:** Is every year divisible by four a leap year? Century years require divisibility by 400 in the ISO calendar.

**Primary reference:** [Java 21 MonthDay](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/MonthDay.html).

---

**12. A whole-month calculation from January 31 to February 28 returns zero. Why does it differ from a clamped renewal date?**

**Say aloud:** “A complete-unit difference and a date addition answer different questions. MONTHS.between on LocalDate counts complete months according to its endpoint rules; plusMonths adjusts invalid day-of-month values to a valid date. Those operations are therefore not general inverses at month ends. I would choose a contractual billing-period rule rather than derive payment counts from a generic whole-month difference. Store occurrence indices or compute explicit anchored boundaries, then count the satisfied boundaries. Tests should compare end-of-month starts with ordinary starts and include reverse direction. If reporting instead asks for calendar month labels touched, that is another metric and should be named separately from completed subscription periods.”

**Example:** ChronoUnit.MONTHS.between(LocalDate.of(2027,1,31), LocalDate.of(2027,2,28)) is 0 despite plusMonths(1) reaching February 28.

**Deep dive / verification:** Constant unit calculation; boundary enumeration costs O(n) for n occurrences unless replaced with a proven arithmetic rule. Do not assume addition and subtraction invert.

**Follow-ups:** Can YearMonth differences help? They count month labels; they deliberately discard day-of-month eligibility.

**Primary reference:** [Java 21 ChronoUnit](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/temporal/ChronoUnit.html).

---

### Runnable boundary checks

```java
import java.time.*;
import java.time.temporal.*;

public class TimeContracts {
  public static void main(String[] args) {
    LocalDate jan = LocalDate.of(2027, 1, 31);
    check(jan.plusMonths(1).plusMonths(1).getDayOfMonth() == 28);
    check(YearMonth.of(2027, 3).atEndOfMonth().getDayOfMonth() == 31);
    check(Duration.ofDays(1).getSeconds() == 86400);
    check(Duration.ofHours(36).toHours() == 36);
    check(Duration.ofHours(36).toHoursPart() == 12);
    LocalDate start = LocalDate.of(2026, 1, 1), end = LocalDate.of(2026, 2, 3);
    check(Period.between(start, end).getDays() == 2);
    check(ChronoUnit.DAYS.between(start, end) == 33);
    check(Instant.ofEpochSecond(1).toEpochMilli() == 1000);
    check(Instant.ofEpochSecond(0, 1).toEpochMilli() == Instant.ofEpochSecond(0, 2).toEpochMilli());
    Clock clock = Clock.fixed(Instant.parse("2026-11-16T00:00:00Z"), ZoneOffset.UTC);
    check(Instant.now(clock).equals(Instant.parse("2026-11-16T00:00:00Z")));
    OffsetDateTime a = OffsetDateTime.parse("2026-11-16T10:00+01:00");
    OffsetDateTime b = OffsetDateTime.parse("2026-11-16T09:00Z");
    check(a.isEqual(b) && !a.equals(b));
    check(start.datesUntil(start).count() == 0);
    check(start.datesUntil(start.plusDays(1)).count() == 1);
    LocalDate monday = LocalDate.of(2026, 11, 16);
    check(monday.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY)).equals(monday));
    check(monday.with(TemporalAdjusters.next(DayOfWeek.MONDAY)).equals(monday.plusDays(7)));
    check(!MonthDay.of(2, 29).isValidYear(2027));
    check(MonthDay.of(2, 29).atYear(2027).equals(LocalDate.of(2027, 2, 28)));
    check(ChronoUnit.MONTHS.between(jan, jan.plusMonths(1)) == 0);
    System.out.println("20 time boundary checks passed");
  }
  static void check(boolean value) { if (!value) throw new AssertionError(); }
}
```

**Topic coverage:** S30-Q01 anchored recurrence; Q02 elapsed versus calendar amount; Q03 total versus component; Q04 date difference; Q05 epoch units; Q06 precision and identity; Q07 deterministic time; Q08 timeline equality; Q09 half-open windows; Q10 weekday inclusion; Q11 leap-day policy; Q12 complete-unit counting. Cumulative: 376 questions across 30 sets.

**Next set:** Build on explicit time policies with database precision integration, durable scheduler misfire handling and versioned business calendars; broaden framework and distributed scenarios without repeating these conversion exercises.
