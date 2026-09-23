import { useCallback, useEffect, useRef, useState } from 'react';
import { buildSpeechTranscript, getVoiceSupport, getVoiceErrorMessage } from '../lib/voiceSupport.mjs';
import { conciseSpeechText } from '../lib/techBuddySpeech.mjs';
import { selectIndianEnglishVoice } from '../lib/techBuddyVoice.mjs';

export function useTechBuddyMedia(onTranscript, offline = false) {
  const [media, setMedia] = useState({ listening: false, speaking: false, speechActive: false, voiceLabel: 'Indian English preferred · device voice', notice: '', narration: '', speechMode: offline ? 'device' : 'gemini' });
  const runtime = useRef({ mounted: false, recognition: null, speechTicket: 0, transcript: '', audio: null, speechRequest: null, objectUrl: null });
  const transcriptCallback = useRef(onTranscript);
  useEffect(() => { transcriptCallback.current = onTranscript; }, [onTranscript]);
  const update = useCallback(patch => { if (runtime.current.mounted) setMedia(previous => ({ ...previous, ...patch })); }, []);

  const stopSpeech = useCallback(() => {
    runtime.current.speechTicket++;
    window.speechSynthesis?.cancel();
    runtime.current.speechRequest?.abort();
    runtime.current.speechRequest = null;
    if (runtime.current.audio) {
      runtime.current.audio.onplaying = runtime.current.audio.onended = runtime.current.audio.onerror = null;
      runtime.current.audio.pause();
      runtime.current.audio.removeAttribute('src');
      runtime.current.audio.load();
      runtime.current.audio = null;
    }
    if (runtime.current.objectUrl) URL.revokeObjectURL(runtime.current.objectUrl);
    runtime.current.objectUrl = null;
    update({ speaking: false, speechActive: false });
  }, [update]);

  const stopRecognition = useCallback(() => {
    const recognition = runtime.current.recognition;
    runtime.current.recognition = null;
    if (recognition) {
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
    }
    update({ listening: false });
    return runtime.current.transcript;
  }, [update]);

  const stopAll = useCallback(() => {
    stopRecognition();
    stopSpeech();
    update({ notice: '', narration: '' });
  }, [stopRecognition, stopSpeech, update]);

  useEffect(() => {
    const current = runtime.current;
    current.mounted = true;
    return () => { current.mounted = false; stopAll(); };
  }, [stopAll]);

  useEffect(() => {
    const synthesis = window.speechSynthesis;
    const refresh = () => {
      const voice = selectIndianEnglishVoice(synthesis?.getVoices?.());
      update({ voiceLabel: voice ? `${voice.name} · ${voice.lang}` : 'Indian English preferred · device voice' });
    };
    refresh();
    synthesis?.addEventListener?.('voiceschanged', refresh);
    return () => synthesis?.removeEventListener?.('voiceschanged', refresh);
  }, [update]);

  const listen = (draft) => {
    if (runtime.current.recognition) { stopRecognition(); return; }
    stopSpeech();
    const support = getVoiceSupport(window);
    if (!support.supported) { update({ notice: support.message }); return; }
    const recognition = new support.Constructor();
    runtime.current.recognition = recognition;
    runtime.current.transcript = draft;
    recognition.continuous = !support.isIOS;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = event => {
      if (runtime.current.recognition !== recognition) return;
      const transcript = [draft.trim(), buildSpeechTranscript(event.results).displayText].filter(Boolean).join(' ').slice(0, 12000);
      runtime.current.transcript = transcript;
      transcriptCallback.current(transcript);
    };
    recognition.onend = () => {
      if (runtime.current.recognition !== recognition) return;
      runtime.current.recognition = null;
      update({ listening: false });
    };
    recognition.onerror = error => {
      if (runtime.current.recognition !== recognition) return;
      stopRecognition();
      update({ notice: getVoiceErrorMessage(error, support) });
    };
    update({ listening: true, notice: '' });
    try { recognition.start(); } catch (error) { stopRecognition(); update({ notice: getVoiceErrorMessage(error, support) }); }
  };

  const deviceSpeak = (text, onComplete) => {
    stopRecognition();
    stopSpeech();
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      update({ notice: 'Spoken questions are unavailable. Read the question below.' });
      onComplete?.();
      return;
    }
    const ticket = runtime.current.speechTicket;
    const utterance = new window.SpeechSynthesisUtterance(text.replace(/[_*#`]/g, ''));
    const voice = selectIndianEnglishVoice(window.speechSynthesis.getVoices?.());
    utterance.lang = voice?.lang || 'en-IN';
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onstart = () => { if (ticket === runtime.current.speechTicket) update({ speechActive: true }); };
    utterance.onend = () => {
      if (ticket !== runtime.current.speechTicket) return;
      update({ speaking: false, speechActive: false });
      onComplete?.();
    };
    utterance.onerror = () => { if (ticket === runtime.current.speechTicket) update({ speaking: false, speechActive: false, notice: 'Speech could not play. You can read the question below.' }); };
    update({ speaking: true, narration: text, notice: voice?.lang?.replaceAll('_', '-').toLowerCase() === 'en-in' ? '' : 'An Indian English voice is not available on this device. The browser will use its available voice.' });
    try { window.speechSynthesis.speak(utterance); } catch { utterance.onerror(); }
  };

  const speak = async (text, concise = false, onComplete) => {
    if (media.speechMode === 'device') { deviceSpeak(concise ? conciseSpeechText(text) : text, onComplete); return; }
    stopRecognition();
    stopSpeech();
    const ticket = runtime.current.speechTicket;
    const request = new AbortController();
    runtime.current.speechRequest = request;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; request.abort(); }, 85000);
    const fallbackToDevice = notice => {
      deviceSpeak(concise ? conciseSpeechText(text) : text, onComplete);
      update({ speechMode: 'device', notice });
    };
    update({ speaking: true, notice: '', narration: '' });
    try {
      const response = await fetch('/api/tech-buddy/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal, body: JSON.stringify({ text: String(text).slice(0, 12000), concise }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Speech unavailable');
      if (ticket !== runtime.current.speechTicket || !runtime.current.mounted) return;
      update({ narration: payload.transcript });
      const bytes = Uint8Array.from(atob(payload.wav), character => character.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      runtime.current.objectUrl = url;
      const audio = runtime.current.audio = new Audio(url);
      audio.onplaying = () => { if (ticket === runtime.current.speechTicket) update({ speechActive: true }); };
      audio.onended = () => {
        if (ticket !== runtime.current.speechTicket) return;
        stopSpeech();
        onComplete?.();
      };
      audio.onerror = () => {
        if (ticket !== runtime.current.speechTicket) return;
        stopSpeech();
        fallbackToDevice('Gemini audio could not play. Switched to your device voice.');
      };
      await audio.play();
    } catch (error) {
      if (ticket !== runtime.current.speechTicket || !runtime.current.mounted) return;
      stopSpeech();
      if (error.name !== 'AbortError') fallbackToDevice('Natural speech is unavailable. Switched to your device voice.');
      else if (timedOut) fallbackToDevice('Natural speech timed out. Switched to your device voice.');
      else update({ notice: 'Speech request stopped.' });
    } finally {
      clearTimeout(timeout);
      if (runtime.current.speechRequest === request) runtime.current.speechRequest = null;
    }
  };

  const readThenListen = (text, draft = '') => {
    speak(text, false, () => listen(typeof draft === 'function' ? draft() : draft));
  };

  return { ...media, setSpeechMode: speechMode => { stopSpeech(); update({ speechMode }); }, listen, speak, readThenListen, stopAll, stopSpeech, stopRecognition };
}
