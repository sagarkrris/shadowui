export const PUBLIC_SUPPORT_EMAIL = 'sgrkrishna23@gmail.com';
export function auditRetentionDays(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.max(7, Math.min(3650, n)) : 90;
}
export function productAnalyticsRetentionDays(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? Math.max(1, Math.min(365, n)) : 30;
}
export function publicDataPolicy(env = {}) {
  const email = String(env.SUPPORT_EMAIL || PUBLIC_SUPPORT_EMAIL).trim();
  return {
    supportEmail: /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email) ? email : PUBLIC_SUPPORT_EMAIL,
    auditDays: auditRetentionDays(env.DATA_RETENTION_DAYS),
    analyticsDays: productAnalyticsRetentionDays(env.PRODUCT_ANALYTICS_RETENTION_DAYS),
    analyticsConfigured: env.PRODUCT_ANALYTICS_ENABLED === 'true' && Boolean(env.DATABASE_URL),
  };
}
