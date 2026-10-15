import assert from 'node:assert/strict';
import test from 'node:test';
import { DESIGN_PROBLEMS, designHref, getDesignProblem, filterDesignProblems, parseDesignProgress, exportDesignSolution } from '../lib/designLibrary.mjs';
import { discoveryCatalogue } from '../lib/discoveryCatalog.mjs';
import { buildDesignSolutionBoard, wrapBoardText } from '../lib/designSolutionBoard.mjs';

test('every published design problem resolves to a distinct complete worked solution', () => {
  assert.equal(DESIGN_PROBLEMS.length, 24);
  assert.equal(new Set(DESIGN_PROBLEMS.map(designHref)).size, 24);
  for (const problem of DESIGN_PROBLEMS) {
    assert.equal(getDesignProblem(problem.track, problem.slug), problem);
    assert.ok(problem.requirements.length >= 3 && problem.steps.length >= 4 && problem.checks.length >= 3);
    assert.equal(problem.nodes.length, 6);
    for (const [from,to,label] of problem.edges) {
      assert.ok(problem.nodes[from] && problem.nodes[to] && from !== to && label);
    }
    assert.ok(problem.api && problem.data && problem.scope && problem.sources.length);
    assert.ok(exportDesignSolution(problem).includes(problem.steps.at(-1)));
    if (problem.track === 'lld') assert.ok(problem.java.source && problem.java.checks && problem.java.limits);
  }
  assert.equal(getDesignProblem('lld', 'url-shortener'), null);
  assert.equal(getDesignProblem('hld', '__proto__'), null);
});
test('every complete solution board retains authored contracts, interfaces, data and decisions without truncation', () => {
  for (const problem of DESIGN_PROBLEMS) {
    const board = buildDesignSolutionBoard(problem);
    assert.equal(board.top.length,3); assert.equal(board.bottom.length,3);
    assert.ok(board.architectureY > 100 + board.topHeight);
    assert.ok(board.bottomY > board.architectureY + 435);
    assert.ok(board.height > board.bottomY + board.bottomHeight);
    const text = [...board.top,...board.bottom].map(card => card.lines.join('')).join('').replace(/\s/g,'');
    for (const authored of [...problem.requirements,problem.constraint,problem.api,problem.data,...problem.insights]) assert.ok(text.includes(authored.replace(/\s/g,'')));
    if (problem.track === 'hld') assert.equal(problem.nonFunctional.length,3);
  }
  const input = 'A long contract\n' + 'x'.repeat(100) + ' must not vanish.';
  assert.equal(wrapBoardText(input).join('').replace(/\s/g,''), input.replace(/\s/g,''));
  assert.ok(wrapBoardText(input).every(line => line.length <= 43));
});
test('search and filters combine without leaking progress across tracks', () => {
  const progress = { 'hld/rate-limiter': { done: true }, 'lld/rate-limiter': { starred: true } };
  assert.deepEqual(filterDesignProblems(DESIGN_PROBLEMS, { query: 'rate limiter', status: 'Completed' }, progress).map(designHref), ['/hld/rate-limiter']);
  assert.deepEqual(filterDesignProblems(DESIGN_PROBLEMS, { query: ' rate   limiter ', status: 'To revisit' }, progress).map(designHref), ['/lld/rate-limiter']);
  assert.equal(filterDesignProblems(DESIGN_PROBLEMS, { query: 'zz-unmatched' }).length, 0);
  assert.equal(filterDesignProblems(DESIGN_PROBLEMS, { difficulty: 'Easy', topic: 'Money & policies' }).length, 0);
  assert.equal(filterDesignProblems(DESIGN_PROBLEMS, { status: 'Not completed' }, progress).length, 23);
});
test('corrupt and old browser storage does not mark work completed or inject unknown keys', () => {
  for (const raw of ['broken', 'null', '[]', '42']) assert.deepEqual(parseDesignProgress(raw), {});
  assert.deepEqual(parseDesignProgress(JSON.stringify({
    'hld/url-shortener': { done: 'false', starred: 1, notes: 'x'.repeat(20001) },
    'unknown/problem': { done: true },
  })), { 'hld/url-shortener': { done: false, starred: false, notes: 'x'.repeat(20000) } });
});
test('public search discovers every solution without shipping solution bodies as metadata', () => {
  const records = discoveryCatalogue();
  for (const problem of DESIGN_PROBLEMS) {
    const record = records.find(item => item.href === designHref(problem));
    assert.ok(record);
    assert.equal(record.source, undefined);
    assert.equal(record.steps, undefined);
  }
});
