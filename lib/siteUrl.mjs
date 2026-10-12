// Canonicals, feeds, and sitemaps must agree on the public production origin.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://elevateprep.vercel.app').replace(/\/+$/, '');
