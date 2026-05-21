// Debug endpoint — visit /api/models to see what models your API key can access
export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not set" });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    const data = await response.json();

    const usable = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
      }));

    res.status(200).json({ available_models: usable, total: usable.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
