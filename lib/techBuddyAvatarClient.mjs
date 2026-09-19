// Receive-only room: the candidate's microphone/camera are never published.
export class BuddyAvatarConnection {
  constructor(container, onSpeech, onDisconnect, { fetcher = (...args) => fetch(...args), loadClient = () => import('livekit-client') } = {}) {
    this.fetcher = fetcher;
    this.loadClient = loadClient;
    this.container = container;
    this.onSpeech = onSpeech;
    this.onDisconnect = onDisconnect;
    this.closed = false;
    this.ready = false;
    this.utterance = null;
  }
  async connect() {
    const response = await this.fetcher('/api/tech-buddy/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start' }) });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error || 'Avatar unavailable');
    this.sessionToken = session.sessionToken;
    if (this.closed) { this.stopRemote(); return; }
    const { Room, RoomEvent } = await this.loadClient();
    if (this.closed) { this.stopRemote(); return; }
    const room = this.room = new Room({ adaptiveStream: true });
    room.on(RoomEvent.TrackSubscribed, track => {
      if (this.closed) return;
      const element = track.attach();
      if (track.kind === 'video') { element.playsInline = true; element.setAttribute('aria-label', 'Live AI interviewer'); }
      if (track.kind === 'audio') {
        element.autoplay = true;
        element.controls = true;
        element.playsInline = true;
        element.muted = false;
        element.volume = 1;
        element.setAttribute('aria-label', 'Interviewer audio');
        void element.play?.().catch(() => {});
      }
      this.container?.appendChild(element);
    });
    room.on(RoomEvent.TrackUnsubscribed, track => track.detach().forEach(element => element.remove()));
    room.on(RoomEvent.Disconnected, () => { if (!this.closed) { this.close(); this.onDisconnect(); } });
    const socket = this.socket = new WebSocket(session.socketUrl);
    const connected = new Promise((resolve, reject) => {
      this.connectTimer = setTimeout(() => reject(new Error('Avatar connection timed out')), 20000);
      socket.onerror = () => reject(new Error('Avatar connection failed'));
      socket.onclose = () => { reject(new Error('Avatar connection closed')); if (!this.closed) { this.close(); this.onDisconnect(); } };
      socket.onmessage = event => {
        let message; try { message = JSON.parse(event.data); } catch { return; }
        if (this.closed) return;
        if (message.type === 'session.state_updated' && message.state === 'connected') { this.ready = true; clearTimeout(this.connectTimer); resolve(); }
        if (message.type === 'error') { reject(new Error('Avatar playback failed')); this.close(); this.onDisconnect(); }
        if (message.source_event_id !== this.utterance) return;
        if (message.type === 'agent.speak_started') this.onSpeech(true);
        if (['agent.speak_ended', 'agent.speak_interrupted'].includes(message.type)) { this.utterance = null; clearTimeout(this.speechTimer); this.onSpeech(false); }
      };
    });
    try { await Promise.all([room.connect(session.roomUrl, session.roomToken), connected]); }
    catch (error) { this.close(); throw error; }
    if (this.closed) { await room.disconnect(); return; }
    await room.startAudio();
    this.heartbeat = setInterval(() => this.send('session.keep_alive'), 60000);
  }
  send(type, payload = {}) {
    if (this.ready && !this.closed && this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type, event_id: crypto.randomUUID(), ...payload }));
  }
  speak(pcm) {
    if (!this.ready || this.closed) throw new Error('Avatar disconnected');
    this.interrupt();
    const id = this.utterance = crypto.randomUUID();
    // 64,000 base64 chars = 48,000 bytes = one second of PCM24k16 mono.
    for (let index = 0; index < pcm.length; index += 64000) this.send('agent.speak', { audio: pcm.slice(index, index + 64000), event_id: id });
    this.send('agent.speak_end');
    this.speechTimer = setTimeout(() => { this.interrupt(); this.onDisconnect(); this.close(); }, 150000);
  }
  interrupt() { this.utterance = null; clearTimeout(this.speechTimer); this.send('agent.interrupt'); this.onSpeech(false); }
  listen(active) { this.send(active ? 'agent.start_listening' : 'agent.stop_listening'); }
  stopRemote() {
    if (!this.sessionToken) return;
    const sessionToken = this.sessionToken; this.sessionToken = null;
    void this.fetcher('/api/tech-buddy/avatar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop', sessionToken }), keepalive: true }).catch(() => {});
  }
  close() {
    this.closed = true; this.ready = false; this.utterance = null;
    clearInterval(this.heartbeat); clearTimeout(this.connectTimer); clearTimeout(this.speechTimer);
    this.socket?.close(); void this.room?.disconnect();
    this.container?.replaceChildren(); this.stopRemote();
  }
}
