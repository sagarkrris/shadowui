import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { cloudHydrationNeedsChoice } from '../lib/cloudStateOwnership.mjs';
import { clearPrivateLocalData } from '../lib/localStoragePrivacy.mjs';
import { encryptState, decryptState } from '../lib/serverPersistence.mjs';

test('new account cannot silently inherit previous account drafts or profile, even with an empty cloud copy', () => {
  for (const local of [{ session: { input: 'private answer' } }, { session: { candidateProfile: { name: 'Private profile' } } }, { applications: [{ id: 'application' }] }, { learningState: { progress: true } }]) {
    assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: 'account-a', userId: 'account-b' }), true);
    assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: 'account-a', userId: 'account-b', restoredLocally: true }), true);
  }
});

test('unowned device work needs one-time import while same-account restore keeps its behavior', () => {
  const local = { session: { input: 'guest draft' } };
  assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: '', userId: 'new-account' }), true);
  assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: '', userId: 'new-account', restoredLocally: true }), true);
  assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: 'new-account', userId: 'new-account' }), false);
  assert.equal(cloudHydrationNeedsChoice({ local: {}, remote: null, previousOwner: '', userId: 'new-account' }), false);
  assert.equal(cloudHydrationNeedsChoice({ local: { session: { candidateProfile: { name: 'Legacy private profile' } } }, remote: null, previousOwner: '', userId: 'new-account' }), true);
  assert.equal(cloudHydrationNeedsChoice({ local: { session: { profileDraft: { stack: 'Legacy private stack' } } }, remote: null, previousOwner: '', userId: 'new-account' }), true);
  assert.equal(cloudHydrationNeedsChoice({ local, remote: local, previousOwner: 'a', userId: 'a' }), false);
  assert.equal(cloudHydrationNeedsChoice({ local, remote: { session: { input: 'different' } }, previousOwner: 'a', userId: 'a' }), true);
  assert.equal(cloudHydrationNeedsChoice({ local, remote: { session: { input: 'different' } }, previousOwner: 'a', userId: 'a', restoredLocally: true }), false);
});

test('account switching protects resume-only, memory-only, progress and practice evidence snapshots', () => {
  const snapshots = [
    { toolkitState: { resumeText: 'Private resume' } },
    { toolkitState: { jobDescription: 'Private target role' } },
    { javaDigestProgress: { completedTopics: ['private-topic'] } },
    { questionMemory: { questions: { question1: { answer: 'Private answer' } } } },
    { prepProgressState: { sessions: [{ id: 'private-session' }] } },
    { session: { practice: { evidence: [{ notes: 'Private evidence' }] } } },
    { session: { practice: { designs: { draft: 'Private design' } } } },
    { session: { practice: { buddy: { draft: 'Private interview draft' } } } },
  ];
  for (const local of snapshots) {
    assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: 'a', userId: 'b' }), true);
    assert.equal(cloudHydrationNeedsChoice({ local, remote: null, previousOwner: '', userId: 'b' }), true);
  }
});

test('account cleanup handles both storage surfaces while preserving unrelated browser data', () => {
  for (let surface = 0; surface < 2; surface++) {
    const values = new Map([['interviewiq.cloudStateOwner.v1', 'a'], ['interviewiq.restoreLocal', '1'], ['interviewiq.diagnostic.v1', 'private'], ['interviewprep.session.v1', 'private'], ['unrelated', 'keep']]);
    clearPrivateLocalData({ get length() { return values.size; }, key(index) { return [...values.keys()][index]; }, removeItem(key) { values.delete(key); } });
    assert.deepEqual([...values], [['unrelated', 'keep']]);
  }
});

test('encrypted state rejects ciphertext tampering', () => {
  const previous = process.env.APP_ENCRYPTION_KEY;
  process.env.APP_ENCRYPTION_KEY = 'synthetic-security-contract-key';
  try {
    const encrypted = encryptState({ answer: 'private synthetic data' });
    const altered = Buffer.from(encrypted.ciphertext, 'base64url');
    altered[0] ^= 1;
    assert.throws(() => decryptState({ ...encrypted, ciphertext: altered.toString('base64url') }));
  } finally {
    if (previous === undefined) delete process.env.APP_ENCRYPTION_KEY;
    else process.env.APP_ENCRYPTION_KEY = previous;
  }
});

test('real database integration is opt-in and refuses remote database targets', () => {
  const script = new URL('../scripts/security/verify-account-isolation.mjs', import.meta.url);
  for (const environment of [{ ACCOUNT_SECURITY_INTEGRATION: '', ACCOUNT_SECURITY_DATABASE_URL: '' }, { ACCOUNT_SECURITY_INTEGRATION: '1', ACCOUNT_SECURITY_DATABASE_URL: 'postgres://example.invalid/disallowed' }]) {
    const result = spawnSync(process.execPath, [script.pathname], { env: { ...process.env, ...environment }, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 2);
    assert.doesNotMatch(result.stderr, /example\.invalid/);
  }
});
