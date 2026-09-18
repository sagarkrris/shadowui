import { sameOriginJson, validateReaderSubmission, validVoteId, EDITORIAL_REQUESTS } from "../../lib/readerCommunity.mjs";
import { readerCommunityConfigured, readerIdentity, listReaderRequests, submitReaderRequest, voteReaderRequest } from "../../lib/readerCommunityStore.mjs";
import { checkDistributedRateLimit } from "../../lib/redisRateLimit.mjs";
import { getClientAddress } from "../../lib/requestSecurity.mjs";
export const config = { api: { bodyParser: { sizeLimit: "8kb" } } };
export function createReaderCommunityHandler({ store = { readerCommunityConfigured, readerIdentity, listReaderRequests, submitReaderRequest, voteReaderRequest }, env = process.env, rateLimit = checkDistributedRateLimit } = {}) {
return async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); res.status(405).json({ error: "Method not allowed." }); return; }
  if (req.method === "POST" && !sameOriginJson(req)) { res.status(403).json({ error: "Submit from this site using the form." }); return; }
  if (!store.readerCommunityConfigured(env)) { res.status(req.method === "GET" ? 200 : 503).json({ available: false, items: EDITORIAL_REQUESTS, error: "The shared request board is not configured yet. Submissions and voting are unavailable." }); return; }
  const identity = store.readerIdentity(req.cookies?.interviewiq_reader, env.SESSION_SECRET);
  res.setHeader("Set-Cookie", `interviewiq_reader=${identity.cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${env.NODE_ENV === "production" ? "; Secure" : ""}`);
  try {
    if (req.method === "GET") { res.status(200).json({ available: true, items: await store.listReaderRequests(identity.id) }); return; }
    const rate = await rateLimit(`reader:${getClientAddress(req)}`, { limit: 6 });
    if (!rate.ok) { res.status(429).json({ error: "Too many requests. Please try again in a minute." }); return; }
    if (req.body?.action === "vote") {
      if (!validVoteId(req.body.id)) { res.status(400).json({ error: "Choose a published topic." }); return; }
      if (!await store.voteReaderRequest(req.body.id, identity.id)) { res.status(404).json({ error: "This topic is not available for voting." }); return; }
      res.status(200).json({ available: true, items: await store.listReaderRequests(identity.id) }); return;
    }
    let submission;
    try { submission = validateReaderSubmission(req.body); } catch (error) { res.status(400).json({ error: error.message }); return; }
    const receipt = await store.submitReaderRequest(submission, identity.id);
    res.status(202).json({ receipt, status: "pending", message: "Received for editorial review. This submission is not public yet." });
  } catch { res.status(503).json({ error: "The request board is temporarily unavailable. Your submission was not confirmed; please retry later." }); }
}

}
export default createReaderCommunityHandler();
