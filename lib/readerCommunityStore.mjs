import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getPersistenceDatabase } from "./serverPersistence.mjs";
import { EDITORIAL_REQUESTS } from "./readerCommunity.mjs";
let initialized;
export function readerCommunityConfigured(env = process.env) { return Boolean(env.DATABASE_URL && env.SESSION_SECRET); }
export function readerIdentity(cookie, secret) {
  const [id, signature] = String(cookie || "").split(".");
  const sign = value => createHmac("sha256", secret).update(`reader:${value}`).digest("hex");
  if (/^[a-f0-9]{48}$/.test(id || "") && /^[a-f0-9]{64}$/.test(signature || "") && timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(id), "hex"))) return { id, cookie: `${id}.${signature}` };
  const fresh = randomBytes(24).toString("hex"); return { id: fresh, cookie: `${fresh}.${sign(fresh)}` };
}
async function database() {
  const db = await getPersistenceDatabase();
  if (!initialized) initialized = (async () => {
    await db.query(`CREATE TABLE IF NOT EXISTS interviewiq_reader_requests (
      id UUID PRIMARY KEY, kind TEXT NOT NULL, title TEXT NOT NULL, details TEXT NOT NULL, path TEXT NOT NULL DEFAULT '',
      browser_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', origin TEXT NOT NULL DEFAULT 'Reader request', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ); CREATE TABLE IF NOT EXISTS interviewiq_reader_votes (
      request_id UUID NOT NULL REFERENCES interviewiq_reader_requests(id) ON DELETE CASCADE, browser_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (request_id, browser_id)
    ); CREATE INDEX IF NOT EXISTS interviewiq_reader_requests_status_idx ON interviewiq_reader_requests(status, created_at);`);
    for (const item of EDITORIAL_REQUESTS) await db.query("INSERT INTO interviewiq_reader_requests(id,kind,title,details,browser_id,status,origin) VALUES($1,'request',$2,$3,'editorial','published','Editorial suggestion') ON CONFLICT DO NOTHING", [item.id, item.title, item.details]);
  })().catch(error => { initialized = undefined; throw error; });
  await initialized; return db;
}
export async function listReaderRequests(browserId) {
  const db = await database();
  const result = await db.query(`SELECT r.id, r.title, r.details, r.origin, COUNT(v.browser_id)::int AS votes,
    COALESCE(BOOL_OR(v.browser_id=$1),FALSE) AS voted FROM interviewiq_reader_requests r
    LEFT JOIN interviewiq_reader_votes v ON v.request_id=r.id WHERE r.kind='request' AND r.status='published'
    GROUP BY r.id ORDER BY COUNT(v.browser_id) DESC, r.created_at ASC LIMIT 100`, [browserId]);
  return result.rows;
}
export async function submitReaderRequest(submission, browserId) {
  const db = await database(); const id = randomUUID();
  await db.query("INSERT INTO interviewiq_reader_requests(id,kind,title,details,path,browser_id) VALUES($1,$2,$3,$4,$5,$6)", [id, submission.kind, submission.title, submission.details, submission.path, browserId]);
  return id;
}
export async function voteReaderRequest(id, browserId) {
  const db = await database();
  const exists = await db.query("SELECT id FROM interviewiq_reader_requests WHERE id=$1 AND kind='request' AND status='published'", [id]);
  if (!exists.rowCount) return false;
  await db.query("INSERT INTO interviewiq_reader_votes(request_id,browser_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [id, browserId]);
  return true;
}
