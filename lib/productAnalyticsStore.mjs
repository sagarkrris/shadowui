import { createHash } from 'node:crypto';
import { getPersistenceDatabase } from './serverPersistence.mjs';
import { DETECTIVE_CASES } from './productionDetective.mjs';
import { EXPLAIN_LOGS } from './explainThisLog.mjs';
import { normalizeAnalyticsEvent } from './analytics.mjs';
import { productAnalyticsRetentionDays } from './dataPolicy.mjs';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hash = value => createHash('sha256').update(value).digest('hex');
export function analyticsConfiguration(env = process.env) { return { enabled: env.PRODUCT_ANALYTICS_ENABLED === 'true' && Boolean(env.DATABASE_URL), database: Boolean(env.DATABASE_URL), retentionDays: productAnalyticsRetentionDays(env.PRODUCT_ANALYTICS_RETENTION_DAYS) }; }
export function analyticsEnvelope(body) {
  if (body?.consent !== true || !UUID.test(body.visitorId || '')) return null;
  const event = normalizeAnalyticsEvent(body.event);
  if (!event || !UUID.test(event.eventId || '') || !UUID.test(event.sessionId || '')) return null;
  if (!UUID.test(event.attemptId || '')) delete event.attemptId;
  if (event.name.startsWith('detective_') && !DETECTIVE_CASES.some(item=>item.slug===event.value)) event.value='';
  if (event.name.startsWith('explain_log_') && !EXPLAIN_LOGS.some(item=>item.slug===event.value)) event.value='';
  return { ...event, visitorId: hash(body.visitorId) };
}
export function analyticsVisitor(value) { return UUID.test(value || '') ? hash(value) : null; }
export function createProductAnalyticsStore({ database = getPersistenceDatabase, env = process.env } = {}) {
  let initialized;
  const days = () => productAnalyticsRetentionDays(env.PRODUCT_ANALYTICS_RETENTION_DAYS);
  async function db() {
    const connection = await database();
    initialized ||= connection.query(`CREATE TABLE IF NOT EXISTS interviewiq_product_events (
      event_id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL,
      attempt_id TEXT, name TEXT NOT NULL, route TEXT NOT NULL, value TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    ); CREATE INDEX IF NOT EXISTS interviewiq_product_events_created_idx ON interviewiq_product_events(created_at);
    CREATE INDEX IF NOT EXISTS interviewiq_product_events_visitor_idx ON interviewiq_product_events(visitor_id,created_at);
    CREATE TABLE IF NOT EXISTS interviewiq_product_withdrawals (visitor_id TEXT PRIMARY KEY, deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`).catch(error => { initialized = null; throw error; });
    await initialized;
    return connection;
  }
  async function prune() {
    const connection = await db();
    await connection.query("DELETE FROM interviewiq_product_events WHERE created_at < NOW() - ($1::text || ' days')::interval", [days()]);
    await connection.query("DELETE FROM interviewiq_product_withdrawals WHERE deleted_at < NOW() - ($1::text || ' days')::interval", [days()]);
  }
  async function transaction(visitor, operation) {
    const connection = await db(); const client = await connection.connect();
    try {
      await client.query('BEGIN');
      // Serialize collection and deletion for one pseudonymous browser. A late
      // opted-in request must not recreate rows after deletion is acknowledged.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [visitor]);
      const result = await operation(client);
      await client.query('COMMIT'); return result;
    } catch (error) { await client.query('ROLLBACK').catch(()=>{}); throw error; }
    finally { client.release(); }
  }
  return {
    async record(event) {
      await prune();
      return transaction(event.visitorId, async client => {
        const withdrawn = await client.query('SELECT visitor_id FROM interviewiq_product_withdrawals WHERE visitor_id=$1', [event.visitorId]);
        if (withdrawn.rows.length) return {inserted:false,withdrawn:true};
        const result = await client.query('INSERT INTO interviewiq_product_events(event_id,visitor_id,session_id,attempt_id,name,route,value) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(event_id) DO NOTHING RETURNING event_id', [event.eventId,event.visitorId,event.sessionId,event.attemptId || null,event.name,event.path,event.value]);
        return { inserted: result.rows.length === 1 };
      });
    },
    async remove(visitorId) { return transaction(visitorId, async client => { await client.query('INSERT INTO interviewiq_product_withdrawals(visitor_id) VALUES($1) ON CONFLICT(visitor_id) DO UPDATE SET deleted_at=NOW()', [visitorId]); await client.query('DELETE FROM interviewiq_product_events WHERE visitor_id=$1', [visitorId]); }); },
    prune,
    async report() {
      const connection = await db();
      return (await connection.query("SELECT event_id,visitor_id,session_id,attempt_id,name,route,value,created_at FROM interviewiq_product_events WHERE created_at >= NOW() - ($1::text || ' days')::interval ORDER BY created_at DESC LIMIT 100001", [days()])).rows;
    },
  };
}
