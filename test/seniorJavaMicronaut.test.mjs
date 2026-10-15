import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { SENIOR_JAVA_GUIDE_ITEMS, SENIOR_JAVA_GUIDE_PARTS } from '../lib/seniorJavaGuide.mjs';

const root = new URL('../content/senior-java/', import.meta.url);
test('Micronaut chapter is reachable in the guide and all authored ladders survive rendering', async () => {
  const chapter = await readFile(new URL('part-22.md', root), 'utf8');
  const html = await readFile(new URL('rendered/part-22.html', root), 'utf8');
  const index = SENIOR_JAVA_GUIDE_ITEMS.findIndex(item => item.slug === 'part-22');
  assert.ok(index > 0);
  assert.equal(SENIOR_JAVA_GUIDE_ITEMS[index - 1].slug, 'part-21');
  assert.equal(SENIOR_JAVA_GUIDE_ITEMS[index + 1].slug, 'interview-algorithms');
  assert.equal(SENIOR_JAVA_GUIDE_PARTS.filter(item => item.slug === 'part-22').length, 1);
  const questions = Array.from({ length: 28 }, (_, i) => i + 293);
  assert.deepEqual([...chapter.matchAll(/^### Q(\d+) /gm)].map(match => Number(match[1])), questions);
  assert.deepEqual([...html.matchAll(/<h4 id="q(\d+)-/g)].map(match => Number(match[1])), questions);
  for (const block of chapter.split(/^### Q/gm).slice(1)) {
    for (let tier = 1; tier <= 4; tier++) assert.equal((block.match(new RegExp(`^\\*\\*Tier ${tier} -`, 'gm')) || []).length, 1);
    for (let probe = 1; probe <= 3; probe++) assert.equal((block.match(new RegExp(`^\\*\\*Probe ${probe} `, 'gm')) || []).length, 1);
    for (const label of ['Internals', 'Realistic failure', 'Trade-off', 'How to verify']) assert.ok(block.includes(`**${label}:**`));
  }
  assert.doesNotMatch(html, /<(?:script|iframe|style|img)\b|href="(?:javascript:|data:)/i);
  const introduction = await readFile(new URL('rendered/introduction.html', root), 'utf8');
  const target = introduction.match(/href="\/senior-java-interview\/part-22#([^"]+)"/)?.[1];
  assert.ok(target);
  assert.ok(html.includes(`id="${target}"`), 'Introduction bookmark must resolve in the generated chapter');
  const master = await readFile(new URL('Senior-Java-Interview-Master-Guide-Corrected.md', root), 'utf8');
  const file = master.match(/\[Part 22:[^\]]+\]\(([^#]+)#/)?.[1];
  assert.ok(file);
  assert.equal(await readFile(new URL(file, root), 'utf8'), chapter);
});
