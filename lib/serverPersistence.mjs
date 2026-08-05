import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { join } from "node:path";

const DATA_DIR = process.env.INTERVIEWIQ_DATA_DIR || join(process.cwd(), ".data");
const DB_FILE = join(DATA_DIR, "store.json");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
let writeQueue = Promise.resolve();

function encryptionKey() {
  const raw = process.env.APP_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!raw) throw new Error("APP_ENCRYPTION_KEY is required for server persistence");
  return createHash("sha256").update(raw).digest();
}

function defaultStore() { return { version: 1, users: {}, sessions: {}, state: {} }; }

async function readStore() {
  try { return { ...defaultStore(), ...JSON.parse(await readFile(DB_FILE, "utf8")) }; } catch (error) { if (error.code === "ENOENT") return defaultStore(); throw error; }
}

async function writeStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  const temp = `${DB_FILE}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(store), { mode: 0o600 });
  await rename(temp, DB_FILE);
}

async function mutateStore(mutator) {
  const operation = writeQueue.then(async () => { const store = await readStore(); const result = await mutator(store); await writeStore(store); return result; });
  writeQueue = operation.catch(() => undefined);
  return operation;
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

export async function createUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return mutateStore((store) => {
    if (Object.values(store.users).some((user) => user.email === normalizedEmail)) throw Object.assign(new Error("An account with that email already exists."), { code: "EMAIL_EXISTS" });
    const passwordRecord = hashPassword(password);
    const user = { id: `user-${randomUUID()}`, email: normalizedEmail, password: passwordRecord, createdAt: new Date().toISOString() };
    store.users[user.id] = user;
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  });
}

export async function authenticateUser({ email, password }) {
  const store = await readStore();
  const user = Object.values(store.users).find((candidate) => candidate.email === String(email || "").trim().toLowerCase());
  if (!user || !verifyPassword(password, user.password)) return null;
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await mutateStore((store) => { store.sessions[tokenHash] = { userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString() }; });
  return token;
}

export async function getUserBySession(token) {
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const store = await readStore();
  const session = store.sessions[tokenHash];
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null;
  const user = store.users[session.userId];
  return user ? { id: user.id, email: user.email, createdAt: user.createdAt } : null;
}

export async function destroySession(token) {
  if (!token) return;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await mutateStore((store) => { delete store.sessions[tokenHash]; });
}

export async function loadUserState(userId) {
  const store = await readStore();
  const encrypted = store.state[userId];
  return encrypted ? decryptState(encrypted) : null;
}

export async function saveUserState(userId, state) {
  return mutateStore((store) => { store.state[userId] = encryptState(state); return { savedAt: new Date().toISOString() }; });
}
