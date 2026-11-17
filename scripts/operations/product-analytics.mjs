import { createProductAnalyticsStore, analyticsConfiguration } from '../../lib/productAnalyticsStore.mjs';
import { learningAnalytics } from '../../lib/learningAnalytics.mjs';
const config = analyticsConfiguration();
if (!config.database) throw new Error('Configure DATABASE_URL before requesting an operator analytics report.');
const store = createProductAnalyticsStore();
try {
  if (process.argv[2] === '--prune') { await store.prune(); console.log('Expired optional measurement rows pruned.'); }
  else if (process.argv.length === 2) {
    const rows = await store.report();
    console.log(JSON.stringify(learningAnalytics(rows.slice(0,100000),{retentionDays:config.retentionDays,truncated:rows.length>100000}),null,2));
  } else throw new Error('Use product-analytics.mjs [--prune].');
} catch (error) {
  const code = /^[A-Z0-9_]{1,32}$/.test(error.code || '') ? ` (${error.code})` : '';
  console.error(`Product analytics operation failed${code}. Check database access and schema permissions; no report or cleanup was confirmed.`);
  process.exitCode = 1;
} finally { const { closePersistence } = await import('../../lib/serverPersistence.mjs'); await closePersistence(); }
