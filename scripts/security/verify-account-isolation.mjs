// Opt-in: executes production handlers and persistence against disposable local PostgreSQL.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';

const configured = process.env.ACCOUNT_SECURITY_DATABASE_URL;
if (process.env.ACCOUNT_SECURITY_INTEGRATION !== '1' || !configured) {
  console.error('Not run: set ACCOUNT_SECURITY_INTEGRATION=1 and ACCOUNT_SECURITY_DATABASE_URL to a disposable loopback PostgreSQL database.');
  process.exit(2);
}
let url;
try { url = new URL(configured); } catch { console.error('Invalid local test database URL.'); process.exit(2); }
if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
  console.error('Refusing non-loopback database. No production or remote database is allowed.');
  process.exit(2);
}
const schema = `account_security_${randomBytes(8).toString('hex')}`;
const admin = new Pool({ connectionString: configured, connectionTimeoutMillis: 5000 });
url.searchParams.set('options', `-c search_path=${schema}`);
process.env.DATABASE_URL = url.toString();
process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString('hex');
process.env.NODE_ENV = 'production';
for (const key of ['RESEND_API_KEY', 'EMAIL_WEBHOOK_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'METRICS_WEBHOOK_URL', 'ERROR_TRACKING_WEBHOOK_URL']) delete process.env[key];
// The suite requires no network other than pg's local TCP connection.
globalThis.fetch = async () => { throw new Error('External HTTP is disabled by the integration harness'); };

let persistence;
let schemaCreated = false;
let count = 0;
let clientNumber = 0;
const check = (condition, label) => { assert.ok(condition, label); count++; };
async function request(handler, { method = 'GET', action, session, csrf, body, address } = {}) {
  const req = { method, query: action ? { action } : {}, body, headers: {}, socket: { remoteAddress: address || `synthetic-${++clientNumber}` } };
  if (session) req.headers.cookie = `interviewiq_session=${session.token}; interviewiq_csrf=${session.csrfToken}`;
  if (csrf !== undefined) req.headers['x-csrf-token'] = csrf;
  const res = { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key.toLowerCase()] = value; return this; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; this.headersSent = true; return this; }, send(value) { this.body = value; this.headersSent = true; return this; } };
  await handler(req, res);
  return res;
}
try {
  await admin.query(`CREATE SCHEMA ${schema}`);
  schemaCreated = true;
  persistence = await import('../../lib/serverPersistence.mjs');
  const [{ default: state }, { default: account }, { default: auth }] = await Promise.all([
    import('../../pages/api/state.js'), import('../../pages/api/account.js'), import('../../pages/api/auth.js'),
  ]);
  await persistence.initializePersistence();
  const password = randomBytes(24).toString('base64url');
  const a = await persistence.createUser({ firstName: 'Synthetic', lastName: 'A', email: 'a@example.invalid', password });
  const b = await persistence.createUser({ firstName: 'Synthetic', lastName: 'B', email: 'b@example.invalid', password });
  check(Boolean(await persistence.authenticateUser({ email: a.email, password })), 'correct credentials authenticate');
  check(!await persistence.authenticateUser({ email: a.email, password: 'incorrect-test-password' }), 'incorrect credentials denied');
  check(!('password_hash' in a) && !('password' in a), 'public user excludes password data');
  const sa = await persistence.createSession(a.id);
  const sa2 = await persistence.createSession(a.id);
  const sb = await persistence.createSession(b.id);
  const da = { session: { input: 'synthetic-private-answer-A' } };
  const db = { session: { input: 'synthetic-private-answer-B' } };
  for (const [user, session, value] of [[a, sa, da], [b, sb, db]]) {
    const result = await request(state, { method: 'PUT', session, csrf: session.csrfToken, body: { userId: user.id, state: value, revision: 0 } });
    check(result.statusCode === 200 && result.body.revision === 1, 'own state saved');
  }
  const readA = await request(state, { session: sa, body: { userId: b.id } });
  check(readA.body.userId === a.id && JSON.stringify(readA.body.state) === JSON.stringify(da), 'read ignores forged target identity');
  check(readA.headers['cache-control'].includes('no-store'), 'private state cannot be cached');
  for (const [csrf, userId] of [[undefined, a.id], [sb.csrfToken, a.id], [sa.csrfToken, b.id], [sa.csrfToken, undefined]]) {
    const denied = await request(state, { method: 'PUT', session: sa, csrf, body: { userId, state: db, revision: 1 } });
    check([403, 409].includes(denied.statusCode), 'missing/foreign CSRF or account binding denied');
  }
  check((await request(state, { method: 'PUT', session: sa, csrf: sa.csrfToken, body: { userId: a.id, state: db, revision: 0 } })).statusCode === 409, 'stale revision denied');
  check((await request(state)).statusCode === 401, 'anonymous state denied');
  for (const session of [sa, sb]) {
    const exported = await request(account, { action: 'export', session });
    const expected = session === sa ? a : b;
    const other = session === sa ? b : a;
    check(exported.statusCode === 200 && exported.body.user.id === expected.id, 'export bound to session');
    check(!JSON.stringify(exported.body).includes(other.id) && !JSON.stringify(exported.body).includes('password_hash'), 'export excludes other account and credentials');
    check(exported.headers['cache-control'].includes('no-store'), 'private export cannot be cached');
  }
  check((await request(account, { method: 'DELETE', session: sa, csrf: sb.csrfToken })).statusCode === 403, 'foreign CSRF cannot delete account');
  const database = await persistence.getPersistenceDatabase();
  const tokenRows = await database.query('SELECT token_hash, csrf_hash FROM interviewiq_sessions');
  check(!JSON.stringify(tokenRows.rows).includes(sa.token) && !JSON.stringify(tokenRows.rows).includes(sa.csrfToken), 'session and CSRF values stored only as hashes');
  const verification = await persistence.createVerificationToken(a.id);
  check(Boolean(await persistence.consumeVerificationToken(verification)), 'verification token verifies user');
  check(!await persistence.consumeVerificationToken(verification), 'verification link single use');
  const expiredVerification = await persistence.createVerificationToken(b.id);
  await database.query('UPDATE interviewiq_verification_tokens SET expires_at = NOW() - INTERVAL \'1 second\' WHERE token_hash = $1', [persistence.hashOpaqueToken(expiredVerification)]);
  check(!await persistence.consumeVerificationToken(expiredVerification), 'expired verification link denied');
  const stored = await database.query('SELECT encrypted_state FROM interviewiq_user_state WHERE user_id = $1', [a.id]);
  check(!JSON.stringify(stored.rows).includes('synthetic-private-answer-A'), 'database state encrypted');
  const expired = await persistence.createSession(a.id);
  await database.query('UPDATE interviewiq_sessions SET expires_at = NOW() - INTERVAL \'1 second\' WHERE token_hash = $1', [persistence.hashOpaqueToken(expired.token)]);
  check((await request(state, { session: expired })).statusCode === 401, 'expired session denied');
  check(!await persistence.verifyCsrfToken(expired.token, expired.csrfToken), 'expired session CSRF denied');
  const csrfA = sa.csrfToken;
  const rotated = persistence.createOpaqueToken();
  check(await persistence.rotateCsrfToken(sa.token, rotated), 'CSRF rotation succeeds');
  check(!await persistence.verifyCsrfToken(sa.token, csrfA) && await persistence.verifyCsrfToken(sa.token, rotated), 'rotation invalidates old CSRF');
  sa.csrfToken = rotated;
  const login = await request(auth, { method: 'POST', action: 'login', session: sa, csrf: sa.csrfToken, body: { email: a.email, password } });
  check(login.statusCode === 200, 'real login handler authenticates');
  const cookies = login.headers['set-cookie'];
  check(cookies.some(cookie => cookie.startsWith('interviewiq_session=') && /HttpOnly/.test(cookie) && /SameSite=Lax/.test(cookie) && /Secure/.test(cookie)), 'production session cookie hardened');
  check(cookies.some(cookie => cookie.startsWith('interviewiq_csrf=') && /Secure/.test(cookie) && !/HttpOnly/.test(cookie)), 'CSRF cookie readable and secure');
  check(login.headers['cache-control'].includes('no-store'), 'auth response cannot be cached');
  const reset1 = await persistence.createPasswordResetToken(a.email);
  const reset2 = await persistence.createPasswordResetToken(a.email);
  check(Boolean(await persistence.resetPassword(reset1, randomBytes(24).toString('base64url'))), 'reset token changes password');
  check(!await persistence.resetPassword(reset1, password) && !await persistence.resetPassword(reset2, password), 'password reset consumes every outstanding reset link');
  const expiredReset = await persistence.createPasswordResetToken(b.email);
  await database.query('UPDATE interviewiq_reset_tokens SET expires_at = NOW() - INTERVAL \'1 second\' WHERE token_hash = $1', [persistence.hashOpaqueToken(expiredReset)]);
  check(!await persistence.resetPassword(expiredReset, password), 'expired reset link denied');
  check(!await persistence.getUserBySession(sa.token) && !await persistence.getUserBySession(sa2.token), 'reset revokes all sessions for account');
  check(Boolean(await persistence.getUserBySession(sb.token)), 'reset does not revoke another account');
  const afterReset = await persistence.createSession(a.id);
  check((await request(auth, { action: 'revoke', method: 'POST', session: afterReset, csrf: afterReset.csrfToken })).statusCode === 200, 'revoke handler succeeds');
  check((await request(state, { session: afterReset })).statusCode === 401, 'revoked session denied');
  const logoutSession = await persistence.createSession(a.id);
  check((await request(auth, { action: 'logout', method: 'POST', session: logoutSession, csrf: logoutSession.csrfToken })).statusCode === 200, 'logout handler succeeds');
  check(!await persistence.getUserBySession(logoutSession.token), 'logout invalidates token');
  const deleteSession = await persistence.createSession(a.id);
  check((await request(account, { method: 'DELETE', session: deleteSession, csrf: deleteSession.csrfToken, body: { userId: b.id } })).statusCode === 200, 'delete ignores forged target and deletes session owner');
  check(!await persistence.getUserBySession(deleteSession.token) && !await persistence.loadUserState(a.id), 'delete removes sessions and state');
  check(JSON.stringify(await persistence.loadUserState(b.id)) === JSON.stringify(db), 'delete preserves other account state');
  check((await request(account, { action: 'export', session: sb })).statusCode === 200, 'other account export survives deletion');
  let limited;
  for (let i = 0; i < 11; i++) limited = await request(auth, { action: 'login', method: 'POST', address: 'rate-contract' });
  check(limited.statusCode === 429, 'credential rate boundary enforced');
  check((await request(auth, { action: 'me', address: 'rate-contract' })).statusCode === 200, 'bootstrap bucket separate from credentials');
  console.log(`Account security integration passed: ${count} assertions; real PostgreSQL, persistence, and API handlers; synthetic users only.`);
} catch (error) {
  console.error(`Account security integration failed: ${error.name}${error.code ? ` (${error.code})` : ''}${error.code === 'ERR_ASSERTION' ? `: ${error.message}` : ''}. No credentials or database URLs are printed.`);
  process.exitCode = 1;
} finally {
  await persistence?.closePersistence();
  if (schemaCreated) await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => { console.error('Disposable schema cleanup failed; remove the account_security_* schema from the local test database.'); process.exitCode = 1; });
  await admin.end();
}
