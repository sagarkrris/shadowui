import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

test('published Java checkout survives restarts, lost replies and failed compensation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'checkout-lab-'));
  try {
    const source = fileURLToPath(new URL('../public/microservices-lab/CheckoutLab.java', import.meta.url));
    execFileSync('javac', ['--release', '17', '-d', directory, source], { timeout: 15000 });
    const run = (order, ...args) => execFileSync('java', ['-cp', directory, 'CheckoutLab', join(directory, order), ...args],
      { encoding: 'utf8', timeout: 5000, stdio: 'pipe' }).trim().split('\n').at(-1);

    assert.equal(run('approved', 'place', 'APPROVE'), 'order=RESERVING stock=AVAILABLE payment=UNKNOWN');
    assert.equal(run('approved', 'step', 'LOSE_REPLY'), 'order=RESERVING stock=RESERVED payment=UNKNOWN');
    assert.equal(run('approved', 'place', 'APPROVE'), 'order=RESERVING stock=RESERVED payment=UNKNOWN');
    assert.throws(() => run('approved', 'place', 'DECLINE'), /different payment scenario/);
    assert.equal(run('approved', 'step'), 'order=PAYING stock=RESERVED payment=UNKNOWN');
    assert.equal(run('approved', 'step', 'LOSE_REPLY'), 'order=PAYING stock=RESERVED payment=CAPTURED');
    assert.equal(run('approved', 'status'), 'order=PAYING stock=RESERVED payment=CAPTURED');
    assert.equal(run('approved', 'step'), 'order=CONFIRMED stock=RESERVED payment=CAPTURED');
    assert.equal(run('approved', 'step'), 'order=CONFIRMED stock=RESERVED payment=CAPTURED');

    run('declined', 'place', 'DECLINE');
    run('declined', 'step');
    assert.equal(run('declined', 'step', 'LOSE_REPLY'), 'order=PAYING stock=RESERVED payment=DECLINED');
    assert.equal(run('declined', 'step'), 'order=COMPENSATING stock=RESERVED payment=DECLINED');
    assert.equal(run('declined', 'step', 'FAIL_RELEASE'), 'order=COMPENSATING stock=RESERVED payment=DECLINED');
    assert.equal(run('declined', 'step'), 'order=CANCELLED stock=RELEASED payment=DECLINED');
    assert.throws(() => run('absent', 'step'), /Place an order/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('published Spring capstone guards terminal orders and ships a matching ZIP', () => {
  const directory = mkdtempSync(join(tmpdir(), 'checkout-workflow-'));
  try {
    const source = fileURLToPath(new URL('../public/microservices-spring-lab/src/main/java/lab/checkout/Workflow.java', import.meta.url));
    const fixture = fileURLToPath(new URL('./fixtures/CheckoutWorkflowChecks.java', import.meta.url));
    execFileSync('javac', ['--release', '21', '-d', directory, source, fixture], { timeout: 15000 });
    execFileSync('java', ['-cp', directory, 'lab.checkout.CheckoutWorkflowChecks'], { timeout: 5000 });
    const packager = fileURLToPath(new URL('../scripts/validation/package-checkout-lab.py', import.meta.url));
    execFileSync('python3', [packager, '--check'], { timeout: 5000 });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
