import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('Set 30 published time contracts and calendar boundaries execute on Java 21', async () => {
  const source = await readFile(new URL('../content/senior-java/daily/set-30.md', import.meta.url), 'utf8');
  const blocks = [...source.matchAll(/```java\n([\s\S]*?)```/g)];
  assert.equal(blocks.length, 1);
  const jdk = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  assert.ok(jdk, 'Configure CONTENT_JAVA_HOME or JAVA_HOME');
  const dir = await mkdtemp(path.join(tmpdir(), 'set30-'));
  try {
    await writeFile(path.join(dir, 'TimeContracts.java'), blocks[0][1]);
    await writeFile(path.join(dir, 'CalendarChecks.java'), `
import java.time.*;
import java.time.temporal.*;
public class CalendarChecks {
 static int checks;
 static void check(boolean b) {if(!b)throw new AssertionError();checks++;}
 public static void main(String[] args) {
  TimeContracts.main(args);
  // Independent exhaustive calendar checks over an entire Gregorian 400-year cycle.
  for(int year=2000;year<2400;year++) {
   boolean leap=year%4==0 && (year%100!=0 || year%400==0);
   check(MonthDay.of(2,29).isValidYear(year)==leap);
   check(MonthDay.of(2,29).atYear(year).getDayOfMonth()==(leap?29:28));
   for(int month=1;month<=12;month++) {
    YearMonth ym=YearMonth.of(year,month);
    int expected=switch(month){case 2->leap?29:28;case 4,6,9,11->30;default->31;};
    check(ym.atEndOfMonth().getDayOfMonth()==expected);
    LocalDate d=ym.atDay(1);
    check(d.datesUntil(ym.plusMonths(1).atDay(1)).count()==expected);
    for(int offset=0;offset<7;offset++) {
     LocalDate date=d.plusDays(offset);
     for(DayOfWeek day:DayOfWeek.values()) {
      LocalDate inclusive=date.with(TemporalAdjusters.nextOrSame(day));
      LocalDate strict=date.with(TemporalAdjusters.next(day));
      check(inclusive.getDayOfWeek()==day && !inclusive.isBefore(date) && inclusive.isBefore(date.plusDays(7)));
      check(strict.getDayOfWeek()==day && strict.isAfter(date) && !strict.isAfter(date.plusDays(7)));
     }
    }
   }
  }
  for(long millis=-2000;millis<=2000;millis++)check(Instant.ofEpochMilli(millis).toEpochMilli()==millis);
  LocalDate date=LocalDate.of(2026,1,1);
  try {date.datesUntil(date.minusDays(1)).count();throw new AssertionError();}catch(IllegalArgumentException expected){checks++;}
  Clock fixed=Clock.fixed(Instant.EPOCH,ZoneOffset.UTC);
  check(!Instant.now(fixed).isBefore(Instant.EPOCH)); // expiry at equality is expired
  check(Instant.now(Clock.offset(fixed,Duration.ofNanos(-1))).isBefore(Instant.EPOCH));
  System.out.println(checks+" calendar assertions passed");
 }
}`);
    execFileSync(path.join(jdk, 'bin/javac'), ['--release', '21', 'TimeContracts.java', 'CalendarChecks.java'], { cwd: dir, timeout: 30000 });
    const output = execFileSync(path.join(jdk, 'bin/java'), ['-cp', dir, 'CalendarChecks'], { cwd: dir, encoding: 'utf8', timeout: 30000 });
    assert.match(output, /calendar assertions passed/);
    console.log(output.trim());
  } finally { await rm(dir, { recursive: true, force: true }); }
});
