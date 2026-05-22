export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    configured: Boolean(process.env.GEMINI_API_KEY),
    message: "Model diagnostics are disabled so API-key-backed provider details are not exposed in browser inspection.",
  });
}
