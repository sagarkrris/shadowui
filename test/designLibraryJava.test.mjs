import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DESIGN_JAVA_MODELS } from '../lib/designLibraryJava.mjs';

test('all twelve published Java 17 design cores enforce boundaries and concurrent ownership', { timeout: 120000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'design-models-'));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const binary = name => javaHome ? join(javaHome,'bin',name) : name;
  try {
    const files = Object.values(DESIGN_JAVA_MODELS).map(model => {
      const path = join(dir, `${model.name}.java`); writeFileSync(path, model.source); return path;
    });
    const harness = `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
public class DesignModelChecks {
  static void check(boolean value) { if(!value) throw new AssertionError(); }
  static void reject(Runnable r) { try { r.run(); } catch(IllegalArgumentException e) { return; } throw new AssertionError("expected invalid input"); }
  static void stateReject(Runnable r) { try { r.run(); } catch(IllegalStateException e) { return; } throw new AssertionError("expected illegal state"); }
  static void nullReject(Runnable r) { try { r.run(); } catch(NullPointerException e) { return; } throw new AssertionError("expected null rejection"); }
  static void arithmeticReject(Runnable r) { try { r.run(); } catch(ArithmeticException e) { return; } throw new AssertionError("expected overflow rejection"); }
  static void race(java.util.function.IntPredicate action) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(8);
    CountDownLatch start = new CountDownLatch(1); AtomicInteger successes = new AtomicInteger();
    try {
      List<Future<?>> futures = new ArrayList<>();
      for(int i=0;i<8;i++) { final int n=i; futures.add(pool.submit(() -> { start.await(); if(action.test(n)) successes.incrementAndGet(); return null; })); }
      start.countDown(); for(Future<?> f:futures) f.get(5,TimeUnit.SECONDS);
      check(successes.get()==1);
    } finally { start.countDown(); pool.shutdownNow(); check(pool.awaitTermination(5,TimeUnit.SECONDS)); }
  }
  public static void main(String[] args) throws Exception {
    ${Object.values(DESIGN_JAVA_MODELS).map(model => `{ ${model.checks} }`).join('\n')}
    ParkingLot p = new ParkingLot(); race(i -> p.park("one", "car"+i)!=null);
    LibraryLoans loans = new LibraryLoans(); race(i -> loans.borrow("one", "m"+i)!=null);
    SeatHold seat = new SeatHold(); race(i -> seat.hold("p"+i,0,10)>0);
    RollingQuota quota = new RollingQuota(1,10); race(i -> quota.allow(0));
    JobLease job = new JobLease(); race(i -> job.claim(0,10)>0);
    // Expiry is strict even before another worker/holder reclaims ownership.
    JobLease expired = new JobLease(); long expiredToken=expired.claim(0,10);
    check(!expired.complete(expiredToken,10));
    // Cancel and dispense compete for the same purchase money; at most one wins.
    VendingTransaction purchase=new VendingTransaction(10); purchase.insert(10);
    race(i -> { if(i==0) { try { purchase.dispense(); return true; } catch(IllegalStateException e) { return false; } }
      try { return purchase.cancel()==10; } catch(IllegalStateException e) { return false; } });
    stateReject(() -> purchase.insert(10)); stateReject(purchase::dispense);
    arithmeticReject(() -> new SeatHold().hold("a",Long.MAX_VALUE,1));
    arithmeticReject(() -> new JobLease().claim(Long.MAX_VALUE,1));
    VendingTransaction v=new VendingTransaction(1); v.insert(Long.MAX_VALUE); arithmeticReject(() -> v.insert(1)); check(v.cancel()==Long.MAX_VALUE);
    System.out.println("12 design models and concurrent ownership checks passed");
  }
}`;
    const checkPath = join(dir,'DesignModelChecks.java'); writeFileSync(checkPath,harness);
    execFileSync(binary('javac'), ['--release','17','-d',dir,...files,checkPath], { timeout:60000, stdio:'pipe' });
    const result = execFileSync(binary('java'), ['-cp',dir,'DesignModelChecks'], { timeout:30000, encoding:'utf8' });
    assert.match(result, /12 design models and concurrent ownership checks passed/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
