export function selectIndianEnglishVoice(voices = []) {
  const language = voice => String(voice.lang || '').replaceAll('_', '-').toLowerCase();
  return voices.find(voice => language(voice) === 'en-in')
    || voices.find(voice => language(voice).startsWith('en-') && voice.default)
    || voices.find(voice => language(voice).startsWith('en-'))
    || null;
}
