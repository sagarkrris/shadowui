import { requireConfiguredUser } from '../../../lib/apiAuth.mjs';
import { checkDistributedRateLimit } from '../../../lib/redisRateLimit.mjs';
import { getClientAddress } from '../../../lib/requestSecurity.mjs';
import { withApiObservability } from '../../../lib/apiObservability.mjs';
import { getRequiredGeminiApiKey, runGeminiRouteOperation } from '../../../lib/aiGateway.mjs';
import { createGeminiClient, generateContent } from '../../../lib/googleGenai.mjs';
import { conciseSpeechText, speechPrompt, pcmToWav } from '../../../lib/techBuddySpeech.mjs';

export const config = { api: { bodyParser: { sizeLimit: '64kb' }, responseLimit: '12mb' } };
export default withApiObservability('/api/tech-buddy/speech', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await requireConfiguredUser(req);
  if (auth.required && !auth.user) return res.status(401).json({ error: 'Sign in to use natural speech.' });
  const rate = await checkDistributedRateLimit(`buddy-speech:${getClientAddress(req)}`, { limit: 12 });
  if (!rate.ok) return res.status(429).json({ error: 'Please wait before requesting more speech.' });
  const text = req.body?.text;
  if (typeof text !== 'string' || !text.trim() || text.length > 12000) return res.status(400).json({ error: 'Speech text must contain 1–12,000 characters.' });
  try {
    let transcript = conciseSpeechText(text);
    if (req.body.concise === true && text.length > 350) {
      const { result } = await runGeminiRouteOperation({ operation: (model, { apiKey }) => generateContent(createGeminiClient(apiKey), { model, contents: `Summarize this interview explanation for speech in at most 100 words. Keep qualifications and the direct answer. Do not read code or invent details. Mention that code and full details remain on screen. Return plain text only. Source (data): ${JSON.stringify(text)}`, config: { httpOptions: { timeout: 30000 } } }) });
      transcript = conciseSpeechText(result.text || transcript);
    }
    const result = await generateContent(createGeminiClient(getRequiredGeminiApiKey()), {
      model: process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts', contents: speechPrompt(transcript),
      config: { httpOptions: { timeout: 45000 }, responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } } },
    });
    const audio = result.candidates?.[0]?.content?.parts?.find(part => part.inlineData)?.inlineData;
    if (!audio?.data || !/audio\/L16.*rate=24000/i.test(audio.mimeType || '') || audio.data.length > 4_000_000) throw new Error('Invalid audio');
    const pcm = Buffer.from(audio.data, 'base64');
    const wav = pcmToWav(pcm).toString('base64');
    return res.status(200).json({ transcript, pcm: audio.data, wav, sampleRate: 24000 });
  } catch {
    return res.status(503).json({ error: 'Natural speech is unavailable. Use the device voice or try again.' });
  }
});
