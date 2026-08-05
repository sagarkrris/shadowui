export async function deliverAuthEmail({ type, email, token, userId, fetchImpl = fetch, env = process.env } = {}) {
  const endpoint = env.EMAIL_WEBHOOK_URL;
  if (!endpoint) return { delivered: false, configured: false };
  const response = await fetchImpl(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(env.EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env.EMAIL_WEBHOOK_TOKEN}` } : {}) }, body: JSON.stringify({ type, email, token, userId }) });
  if (!response.ok) throw new Error(`Email provider responded with ${response.status}`);
  return { delivered: true, configured: true };
}
