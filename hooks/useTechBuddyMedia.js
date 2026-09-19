import { useCallback, useEffect, useRef, useState } from 'react';
import { buildSpeechTranscript, getVoiceSupport, getVoiceErrorMessage } from '../lib/voiceSupport.mjs';
import { conciseSpeechText } from '../lib/techBuddySpeech.mjs';
import { selectIndianEnglishVoice } from '../lib/techBuddyVoice.mjs';

export function useTechBuddyMedia(onTranscript, offline = false) {
  const [media, setMedia] = useState({ listening: false, speaking: false, speechActive: false, voiceLabel: 'Indian English preferred · device voice', cameraOn: false, cameraPending: false, notice: '', narration: '', speechMode: offline ? 'device' : 'gemini', avatarStatus: 'off' });
  const videoRef = useRef(null);
  const avatarRef = useRef(null);
  const runtime = useRef({ mounted: false, stream: null, recognition: null, cameraTicket: 0, speechTicket: 0, transcript: '', audio: null, speechRequest: null, avatar: null, objectUrl: null, avatarTicket: 0, avatarPending: false });
  const transcriptCallback = useRef(onTranscript);
  useEffect(() => { transcriptCallback.current = onTranscript; }, [onTranscript]);
  const update = useCallback(patch => { if (runtime.current.mounted) setMedia(previous => ({ ...previous, ...patch })); }, []);
  const stopSpeech = useCallback(() => {
    runtime.current.speechTicket++;
    window.speechSynthesis?.cancel();
    runtime.current.speechRequest?.abort();
    runtime.current.speechRequest = null;
    if (runtime.current.audio) { runtime.current.audio.onplaying = runtime.current.audio.onended = runtime.current.audio.onerror = null; runtime.current.audio.pause(); runtime.current.audio.removeAttribute('src'); runtime.current.audio.load(); runtime.current.audio = null; }
    if (runtime.current.objectUrl) URL.revokeObjectURL(runtime.current.objectUrl);
    runtime.current.objectUrl = null;
    runtime.current.avatar?.interrupt();
    update({ speaking: false, speechActive: false });
  }, [update]);
  const stopRecognition = useCallback(() => {
    const recognition = runtime.current.recognition;
    runtime.current.recognition = null;
    if (recognition) {
      recognition.onstart = recognition.onresult = recognition.onerror = recognition.onend = null;
      recognition.abort();
    }
    runtime.current.avatar?.listen(false);
    update({ listening: false });
    return runtime.current.transcript;
  }, [update]);
  const stopAll = useCallback(() => {
    stopRecognition();
    stopSpeech();
    runtime.current.avatarTicket++;
    runtime.current.avatarPending = false;
    runtime.current.avatar?.close();
    runtime.current.avatar = null;
    runtime.current.cameraTicket++;
    runtime.current.stream?.getTracks().forEach(track => track.stop());
    runtime.current.stream = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    update({ cameraOn: false, cameraPending: false, avatarStatus: 'off', notice: '', narration: '' });
  }, [stopRecognition, stopSpeech, update]);
  useEffect(() => {
    const current = runtime.current;
    current.mounted = true;
    return () => { current.mounted = false; stopAll(); };
  }, [stopAll]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = runtime.current.stream;
  }, [media.cameraOn]);
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
      runtime.current.avatar?.listen(false);
      update({ listening: false });
    };
    recognition.onerror = error => {
      if (runtime.current.recognition !== recognition) return;
      stopRecognition();
      update({ notice: getVoiceErrorMessage(error, support) });
    };
    runtime.current.avatar?.listen(true);
    update({ listening: true, notice: '' });
    try { recognition.start(); } catch (error) { stopRecognition(); update({ notice: getVoiceErrorMessage(error, support) }); }
  };

  const deviceSpeak = text => {
    stopRecognition();
    stopSpeech();
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { update({ notice: 'Spoken questions are unavailable. Read the question below.' }); return; }
    const ticket = runtime.current.speechTicket;
    const utterance = new window.SpeechSynthesisUtterance(text.replace(/[_*#`]/g, ''));
    const voice = selectIndianEnglishVoice(window.speechSynthesis.getVoices?.());
    utterance.lang = voice?.lang || 'en-IN';
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.onstart = () => { if (ticket === runtime.current.speechTicket) update({ speechActive: true }); };
    utterance.onend = () => { if (ticket === runtime.current.speechTicket) update({ speaking: false, speechActive: false }); };
    utterance.onerror = () => { if (ticket === runtime.current.speechTicket) update({ speaking: false, speechActive: false, notice: 'Speech could not play. You can read the question below.' }); };
    update({ speaking: true, narration: text, notice: voice?.lang?.replaceAll('_', '-').toLowerCase() === 'en-in' ? '' : 'An Indian English voice is not available on this device. The browser will use its available voice.' });
    try { window.speechSynthesis.speak(utterance); } catch { utterance.onerror(); }
  };

  const speak = async (text, concise = false) => {
    if (runtime.current.avatarPending) { update({ notice: 'Wait for the live interviewer to connect before playing speech.' }); return; }
    if (media.speechMode === 'device' && !runtime.current.avatar) { deviceSpeak(concise ? conciseSpeechText(text) : text); return; }
    stopRecognition(); stopSpeech();
    const ticket = runtime.current.speechTicket;
    const request = new AbortController(); runtime.current.speechRequest = request;
    const timeout = setTimeout(() => request.abort(), 85000);
    update({ speaking: true, notice: '', narration: '' });
    try {
      const response = await fetch('/api/tech-buddy/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal, body: JSON.stringify({ text: String(text).slice(0, 12000), concise }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Speech unavailable');
      if (ticket !== runtime.current.speechTicket || !runtime.current.mounted) return;
      update({ narration: payload.transcript });
      if (runtime.current.avatar?.ready) { runtime.current.avatar.speak(payload.pcm); update({ speaking: true }); return; }
      const bytes = Uint8Array.from(atob(payload.wav), char => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      runtime.current.objectUrl = url;
      const audio = runtime.current.audio = new Audio(url);
      audio.onplaying = () => { if (ticket === runtime.current.speechTicket) update({ speechActive: true }); };
      audio.onended = () => { if (ticket === runtime.current.speechTicket) stopSpeech(); };
      audio.onerror = () => { if (ticket === runtime.current.speechTicket) { stopSpeech(); update({ notice: 'Audio could not play. Try the device voice.' }); } };
      await audio.play();
    } catch (error) {
      if (ticket !== runtime.current.speechTicket || !runtime.current.mounted) return;
      stopSpeech();
      update({ notice: error.name === 'AbortError' ? 'Speech request timed out. Try the device voice.' : 'Natural speech is unavailable. Select Device voice to continue.' });
    } finally { clearTimeout(timeout); if (runtime.current.speechRequest === request) runtime.current.speechRequest = null; }
  };

  const connectAvatar = async () => {
    if (runtime.current.avatarPending) return;
    if (runtime.current.avatar) { stopSpeech(); runtime.current.avatar.close(); runtime.current.avatar = null; update({ avatarStatus: 'off' }); return; }
    stopRecognition(); stopSpeech();
    runtime.current.avatarPending = true;
    const ticket = ++runtime.current.avatarTicket;
    update({ avatarStatus: 'connecting', notice: '' });
    let BuddyAvatarConnection;
    try { ({ BuddyAvatarConnection } = await import('../lib/techBuddyAvatarClient.mjs')); } catch { if (runtime.current.avatarTicket === ticket) { runtime.current.avatarPending = false; update({ avatarStatus: 'off', notice: 'Live interviewer could not load. Please retry.' }); } return; }
    if (!runtime.current.mounted || runtime.current.avatarTicket !== ticket) return;
    const avatar = new BuddyAvatarConnection(avatarRef.current, active => {
      if (runtime.current.avatar === avatar) update({ speechActive: active, speaking: active });
    }, () => {
      if (runtime.current.avatar === avatar) { runtime.current.avatarPending = false; runtime.current.avatar = null; stopSpeech(); update({ avatarStatus: 'off', notice: 'Live interviewer disconnected. Continue with voice or reconnect.' }); }
    });
    runtime.current.avatar = avatar;
    try {
      await avatar.connect();
      if (runtime.current.avatar !== avatar || !runtime.current.mounted) { avatar.close(); return; }
      runtime.current.avatarPending = false;
      avatar.listen(Boolean(runtime.current.recognition));
      update({ avatarStatus: 'connected', speechMode: 'gemini' });
    } catch (error) {
      avatar.close();
      if (runtime.current.avatar === avatar) { runtime.current.avatarPending = false; runtime.current.avatar = null; update({ avatarStatus: 'off', notice: error.message }); }
    }
  };

  const camera = async () => {
    if (runtime.current.stream) {
      runtime.current.stream.getTracks().forEach(track => track.stop());
      runtime.current.stream = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      update({ cameraOn: false });
      return;
    }
    const ticket = ++runtime.current.cameraTicket;
    update({ cameraPending: true, notice: '' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (!runtime.current.mounted || ticket !== runtime.current.cameraTicket) { stream.getTracks().forEach(track => track.stop()); return; }
      runtime.current.stream = stream;
      update({ cameraOn: true });
    } catch {
      if (ticket === runtime.current.cameraTicket) update({ notice: 'Camera unavailable or permission denied. You can continue without it.' });
    } finally {
      if (ticket === runtime.current.cameraTicket) update({ cameraPending: false });
    }
  };
  return { ...media, videoRef, avatarRef, connectAvatar, setSpeechMode: speechMode => { stopSpeech(); update({ speechMode }); }, listen, speak, camera, stopAll, stopSpeech, stopRecognition };
}
