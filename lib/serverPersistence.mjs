import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Pool } from "pg";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const TOKEN_TTL_MS = 1000 * 60 * 30;
const RETENTION_DAYS = Math.max(7, Math.min(3650, Number(process.env.DATA_RETENTION_DAYS || 90)));
const scryptAsync = promisify(scrypt);

let pool;
let schemaPromise;

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for server persistence");
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DB_POOL_MAX || 5), idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  return pool;
}

async function db() {
  const database = getPool();
  if (!schemaPromise) schemaPromise = initializeSchema(database).catch((error) => { schemaPromise = undefined; throw error; });
  await schemaPromise;
  return database;
}

export async function initializePersistence() {
  await db();
}

async function initializeSchema(database) {
  await database.query(`
    CREATE TABLE IF NOT EXISTS interviewiq_users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS interviewiq_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES interviewiq_users(id) ON DELETE CASCADE,
      csrf_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interviewiq_user_state (
      user_id TEXT PRIMARY KEY REFERENCES interviewiq_users(id) ON DELETE CASCADE,
      encrypted_state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS interviewiq_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES interviewiq_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interviewiq_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES interviewiq_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS interviewiq_audits (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES interviewiq_users(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      email TEXT,
      ip TEXT,
      provider_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS interviewiq_sessions_user_idx ON interviewiq_sessions(user_id);
    CREATE INDEX IF NOT EXISTS interviewiq_sessions_expiry_idx ON interviewiq_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS interviewiq_audits_user_idx ON interviewiq_audits(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS interviewiq_audits_created_idx ON interviewiq_audits(created_at);
  `);
  await database.query("ALTER TABLE interviewiq_users ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT ''");
  await database.query("ALTER TABLE interviewiq_users ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT ''");
}

export async function pruneExpiredData() {
  const database = await db();
  await database.query("DELETE FROM interviewiq_sessions WHERE expires_at <= NOW()");
  await database.query("DELETE FROM interviewiq_verification_tokens WHERE expires_at <= NOW()");
  await database.query("DELETE FROM interviewiq_reset_tokens WHERE expires_at <= NOW()");
  await database.query("DELETE FROM interviewiq_audits WHERE created_at < NOW() - ($1::text || ' days')::interval", [RETENTION_DAYS]);
}

function encryptionKey() {
  const raw = process.env.APP_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!raw) throw new Error("APP_ENCRYPTION_KEY is required for server persistence");
  return createHash("sha256").update(raw).digest();
}

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const normalized = String(password || "");
  return { salt, hash: scryptSync(normalized, salt, 64).toString("hex") };
}

export function verifyPassword(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const actual = Buffer.from(hashPassword(password, record.salt).hash, "hex");
  const expected = Buffer.from(record.hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function hashPasswordAsync(password, salt = randomBytes(16).toString("hex")) {
  const normalized = String(password || "");
  const derivedKey = await scryptAsync(normalized, salt, 64);
  return { salt, hash: Buffer.from(derivedKey).toString("hex") };
}

export async function verifyPasswordAsync(password, record) {
  if (!record?.salt || !record?.hash) return false;
  const actual = Buffer.from((await hashPasswordAsync(password, record.salt)).hash, "hex");
  const expected = Buffer.from(record.hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function digest(value) { return createHash("sha256").update(String(value)).digest("hex"); }
export function createOpaqueToken() { return randomBytes(32).toString("base64url"); }
export function hashOpaqueToken(value) { return digest(value); }

export function encryptState(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { iv: iv.toString("base64url"), tag: cipher.getAuthTag().toString("base64url"), ciphertext: ciphertext.toString("base64url") };
}

export function decryptState(value) {
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(value.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(value.tag, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64url")), decipher.final()]).toString("utf8"));
}

function publicUser(row) { return row ? { id: row.id, firstName: row.first_name || "", lastName: row.last_name || "", email: row.email, emailVerified: Boolean(row.email_verified), createdAt: new Date(row.created_at).toISOString() } : null; }
function passwordRecord(row) { return { salt: row.password_salt, hash: row.password_hash }; }

export async function createUser({ firstName = "", lastName = "", email, password }) {
  const normalizedFirstName = String(firstName).trim();
  const normalizedLastName = String(lastName).trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const record = await hashPasswordAsync(password);
  const user = { id: `user-${randomUUID()}`, email: normalizedEmail };
  try {
    const database = await db();
    const result = await database.query("INSERT INTO interviewiq_users (id, first_name, last_name, email, password_salt, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, email_verified, created_at", [user.id, normalizedFirstName, normalizedLastName, user.email, record.salt, record.hash]);
    return publicUser(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") throw Object.assign(new Error("An account with that email already exists."), { code: "EMAIL_EXISTS" });
    throw error;
  }
}

export async function authenticateUser({ email, password }) {
  const database = await db();
  const result = await database.query("SELECT id, first_name, last_name, email, password_salt, password_hash, email_verified, created_at FROM interviewiq_users WHERE email = $1", [String(email || "").trim().toLowerCase()]);
  const user = result.rows[0];
  return user && await verifyPasswordAsync(password, passwordRecord(user)) ? publicUser(user) : null;
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const csrfToken = createOpaqueToken();
  const database = await db();
  await database.query("INSERT INTO interviewiq_sessions (token_hash, user_id, csrf_hash, expires_at) VALUES ($1, $2, $3, $4)", [digest(token), userId, digest(csrfToken), new Date(Date.now() + SESSION_TTL_MS)]);
  return { token, csrfToken };
}

export async function getSession(token) {
  if (!token) return null;
  const database = await db();
  const result = await database.query("SELECT token_hash, user_id, csrf_hash, created_at, expires_at FROM interviewiq_sessions WHERE token_hash = $1 AND expires_at > NOW()", [digest(token)]);
  return result.rows[0] || null;
}

export async function getUserBySession(token) {
  const session = await getSession(token);
  if (!session) return null;
  const database = await db();
  const result = await database.query("SELECT id, first_name, last_name, email, email_verified, created_at FROM interviewiq_users WHERE id = $1", [session.user_id]);
  return publicUser(result.rows[0]);
}

export async function rotateCsrfToken(sessionToken, csrfToken) {
  if (!sessionToken || !csrfToken) return false;
  const database = await db();
  const result = await database.query(
    "UPDATE interviewiq_sessions SET csrf_hash = $1 WHERE token_hash = $2 AND expires_at > NOW()",
    [digest(csrfToken), digest(sessionToken)],
  );
  return result.rowCount === 1;
}

export async function revokeAllSessions(userId) {
  const database = await db();
  await database.query("DELETE FROM interviewiq_sessions WHERE user_id = $1", [userId]);
}

export async function verifyCsrfToken(sessionToken, csrfToken) {
  const session = await getSession(sessionToken);
  if (!session || !csrfToken) return false;
  const actual = Buffer.from(session.csrf_hash); const expected = Buffer.from(digest(csrfToken));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function destroySession(token) {
  if (!token) return;
  const database = await db();
  await database.query("DELETE FROM interviewiq_sessions WHERE token_hash = $1", [digest(token)]);
}

export async function createVerificationToken(userId) {
  const token = createOpaqueToken();
  const database = await db();
  await database.query("INSERT INTO interviewiq_verification_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [digest(token), userId, new Date(Date.now() + TOKEN_TTL_MS)]);
  return token;
}

export async function consumeVerificationToken(token) {
  const database = await db();
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT t.user_id, u.email FROM interviewiq_verification_tokens t JOIN interviewiq_users u ON u.id = t.user_id WHERE t.token_hash = $1 AND t.expires_at > NOW() FOR UPDATE", [digest(token)]);
    if (!result.rows[0]) { await client.query("ROLLBACK"); return null; }
    const user = result.rows[0];
    await client.query("UPDATE interviewiq_users SET email_verified = TRUE WHERE id = $1", [user.user_id]);
    await client.query("DELETE FROM interviewiq_verification_tokens WHERE token_hash = $1", [digest(token)]);
    await client.query("COMMIT");
    return { id: user.user_id, email: user.email };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function createPasswordResetToken(email) {
  const database = await db();
  const result = await database.query("SELECT id FROM interviewiq_users WHERE email = $1", [String(email || "").trim().toLowerCase()]);
  if (!result.rows[0]) return null;
  const token = createOpaqueToken();
  await database.query("INSERT INTO interviewiq_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [digest(token), result.rows[0].id, new Date(Date.now() + TOKEN_TTL_MS)]);
  return token;
}

export async function resetPassword(token, password) {
  const database = await db();
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const tokenResult = await client.query("SELECT t.user_id, u.email, u.first_name FROM interviewiq_reset_tokens t JOIN interviewiq_users u ON u.id = t.user_id WHERE t.token_hash = $1 AND t.expires_at > NOW() FOR UPDATE", [digest(token)]);
    if (!tokenResult.rows[0]) { await client.query("ROLLBACK"); return null; }
    const user = tokenResult.rows[0]; const record = await hashPasswordAsync(password);
    await client.query("UPDATE interviewiq_users SET password_salt = $1, password_hash = $2 WHERE id = $3", [record.salt, record.hash, user.user_id]);
    await client.query("DELETE FROM interviewiq_reset_tokens WHERE token_hash = $1", [digest(token)]);
    await client.query("DELETE FROM interviewiq_sessions WHERE user_id = $1", [user.user_id]);
    await client.query("COMMIT");
    return { id: user.user_id, email: user.email, firstName: user.first_name };
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function recordAudit(event = {}) {
  const database = await db();
  await database.query("INSERT INTO interviewiq_audits (id, user_id, type, email, ip, provider_error) VALUES ($1, $2, $3, $4, $5, $6)", [`audit-${randomUUID()}`, event.userId || null, String(event.type || "unknown"), event.email || null, event.ip || null, event.providerError || null]);
}

export async function exportUserData(userId) {
  const database = await db();
  const userResult = await database.query("SELECT id, email, email_verified, created_at FROM interviewiq_users WHERE id = $1", [userId]);
  if (!userResult.rows[0]) return null;
  const [stateResult, auditsResult] = await Promise.all([
    database.query("SELECT encrypted_state FROM interviewiq_user_state WHERE user_id = $1", [userId]),
    database.query("SELECT id, type, email, ip, provider_error, created_at FROM interviewiq_audits WHERE user_id = $1 ORDER BY created_at DESC", [userId])
  ]);
  return { user: publicUser(userResult.rows[0]), state: stateResult.rows[0] ? decryptState(stateResult.rows[0].encrypted_state) : null, audits: auditsResult.rows.map((event) => ({ id: event.id, type: event.type, email: event.email, ip: event.ip, providerError: event.provider_error, createdAt: new Date(event.created_at).toISOString() })) };
}

export async function deleteUser(userId) {
  const database = await db();
  await database.query("DELETE FROM interviewiq_users WHERE id = $1", [userId]);
}

export async function loadUserState(userId) {
  const database = await db();
  const result = await database.query("SELECT encrypted_state FROM interviewiq_user_state WHERE user_id = $1", [userId]);
  return result.rows[0] ? decryptState(result.rows[0].encrypted_state) : null;
}

export async function saveUserState(userId, state) {
  const database = await db();
  await database.query("INSERT INTO interviewiq_user_state (user_id, encrypted_state) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET encrypted_state = EXCLUDED.encrypted_state, updated_at = NOW()", [userId, encryptState(state)]);
  return { savedAt: new Date().toISOString() };
}
