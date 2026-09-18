import { digestSignup, sameOriginJson } from "../../lib/readerCommunity.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
export const config = { api: { bodyParser: { sizeLimit: "2kb" } } };
export function createDigestHandler({ env = process.env, fetchImpl = fetch, rateLimit = checkDistributedRateLimit } = {}) {
return async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const endpoint = env.DIGEST_SUBSCRIPTION_WEBHOOK;
  const configured = Boolean(endpoint && env.DIGEST_SUBSCRIPTION_TOKEN && env.DIGEST_POSTAL_ADDRESS);
  if (req.method === "GET") { res.status(200).json({ available: configured }); return; }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); res.status(405).json({ error: "Method not allowed." }); return; }
  if (!sameOriginJson(req)) { res.status(403).json({ error: "Use the subscription form on this site." }); return; }
  let signup;
  try { signup = digestSignup(req.body); } catch (error) { res.status(400).json({ error: error.message }); return; }
  if (!configured) { res.status(503).json({ error: "Email subscriptions are not enabled. Your email has not been saved." }); return; }
  const rate = await rateLimit(`digest:${getClientAddress(req)}`, { limit: 3 });
  if (!rate.ok) { res.status(429).json({ error: "Please wait a minute before trying again." }); return; }
  try {
    if (new URL(endpoint).protocol !== "https:") throw new Error("Invalid provider configuration");
    const response = await fetchImpl(endpoint, { method: "POST", signal: AbortSignal.timeout(10000), headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.DIGEST_SUBSCRIPTION_TOKEN}` }, body: JSON.stringify({ ...signup, consentedAt: new Date().toISOString(), source: "public-digest-form", postalAddress: env.DIGEST_POSTAL_ADDRESS }) });
    if (!response.ok || (await response.json()).status !== "pending_confirmation") throw new Error("Confirmation was not acknowledged");
    res.status(202).json({ message: "Check your email to confirm. You are not subscribed until you confirm." });
  } catch { res.status(503).json({ error: "Email confirmation could not be verified. Please try again later; you may still receive a confirmation email." }); }
}

}
export default createDigestHandler();
