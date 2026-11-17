import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import { createProductAnalyticsStore, analyticsEnvelope, analyticsVisitor } from '../../lib/productAnalyticsStore.mjs';
import { closePersistence } from '../../lib/serverPersistence.mjs';

const raw = process.env.ANALYTICS_TEST_DATABASE_URL;
if (!raw || process.env.ANALYTICS_TEST_ALLOW_DISPOSABLE_SCHEMA !== '1') throw new Error('Set ANALYTICS_TEST_DATABASE_URL and ANALYTICS_TEST_ALLOW_DISPOSABLE_SCHEMA=1 for a disposable local test schema.');
const url = new URL(raw);
if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('Analytics integration checks require a dedicated loopback PostgreSQL server.');
const schema = `analytics_test_${randomUUID().replaceAll('-','')}`;
const admin = new Client({connectionString:raw,connectionTimeoutMillis:3000});
await admin.connect();
try {
  await admin.query(`CREATE SCHEMA "${schema}"`);
  url.searchParams.set('options',`-c search_path=${schema}`);
  process.env.DATABASE_URL=url.toString(); process.env.PRODUCT_ANALYTICS_ENABLED='true';
  process.env.PRODUCT_ANALYTICS_RETENTION_DAYS='30';
  const first = randomUUID(), second = randomUUID();
  const event = (visitorId,id=randomUUID())=>analyticsEnvelope({consent:true,visitorId,event:{eventId:id,sessionId:randomUUID(),name:'ai_completed',value:'123',path:'/practice?answer=must-not-store@example.test',answer:'must-not-store@example.test'}});
  let store=createProductAnalyticsStore();
  const a=event(first);
  assert.equal((await store.record(a)).inserted,true);
  assert.equal((await store.record(a)).inserted,false);
  await closePersistence();
  store=createProductAnalyticsStore();
  assert.equal((await store.report()).length,1,'records survive pool restart');
  await store.record(event(second));
  const concurrent = Array.from({length:8},()=>store.record(event(first)));
  await Promise.all([...concurrent,store.remove(analyticsVisitor(first))]);
  assert.equal((await store.record(event(first))).withdrawn,true,'late collections cannot resurrect deleted rows');
  const rows=await store.report();
  assert.equal(rows.length,1); assert.equal(rows[0].visitor_id,analyticsVisitor(second));
  assert.ok(!JSON.stringify(rows).includes('must-not-store'));
  assert.equal(rows[0].route,'/practice');
  const { getPersistenceDatabase }=await import('../../lib/serverPersistence.mjs');
  const db=await getPersistenceDatabase();
  await db.query("UPDATE interviewiq_product_events SET created_at=NOW()-INTERVAL '40 days'");
  assert.equal((await store.report()).length,0,'expired rows do not enter reports before pruning');
  await store.prune();
  assert.equal(Number((await db.query('SELECT COUNT(*) AS count FROM interviewiq_product_events')).rows[0].count),0);
  console.log('Product analytics PostgreSQL checks passed: persistence, duplicate delivery, deletion race, cross-browser isolation, minimization and retention.');
} finally {
  await closePersistence();
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await admin.end();
}
