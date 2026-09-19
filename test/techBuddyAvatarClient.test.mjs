import test from 'node:test';
import assert from 'node:assert/strict';
import { BuddyAvatarConnection } from '../lib/techBuddyAvatarClient.mjs';

test('avatar waits for connected, ignores stale speech events, and releases room and remote session', async () => {
  const original = globalThis.WebSocket;
  let socket, disconnected = 0, cleared = 0;
  const calls = [], states = [];
  class Socket {
    static OPEN = 1;
    constructor() { this.readyState = 1; this.sent = []; socket = this; }
    send(data) { this.sent.push(JSON.parse(data)); }
    close() { this.readyState = 3; this.onclose?.(); }
    emit(message) { this.onmessage({ data: JSON.stringify(message) }); }
  }
  globalThis.WebSocket = Socket;
  const avatar = new BuddyAvatarConnection({ replaceChildren: () => cleared++ }, active => states.push(active), () => {}, {
    fetcher: async (url, request) => {
      calls.push(JSON.parse(request.body));
      return Response.json({ sessionToken: 'scoped', roomUrl: 'wss://room', roomToken: 'viewer', socketUrl: 'wss://socket' });
    },
    loadClient: async () => ({ Room: class { on() {} async connect() {} async startAudio() {} async disconnect() { disconnected++; } }, RoomEvent: {} }),
  });
  try {
    const pending = avatar.connect();
    while (!socket) await new Promise(resolve => setImmediate(resolve));
    avatar.send('agent.start_listening');
    assert.equal(socket.sent.length, 0);
    socket.emit({ type: 'session.state_updated', state: 'connected' });
    await pending;
    avatar.speak('A'.repeat(128000));
    const utterance = avatar.utterance;
    assert.equal(socket.sent.filter(event => event.type === 'agent.speak').length, 2);
    socket.emit({ type: 'agent.speak_started', source_event_id: utterance });
    assert.equal(states.at(-1), true);
    avatar.interrupt();
    socket.emit({ type: 'agent.speak_started', source_event_id: utterance });
    assert.equal(states.at(-1), false);
    avatar.listen(true);
    assert.equal(socket.sent.at(-1).type, 'agent.start_listening');
    avatar.close();
    assert.equal(disconnected, 1);
    assert.equal(cleared, 1);
    assert.equal(calls.at(-1).action, 'stop');
  } finally { avatar.close(); globalThis.WebSocket = original; }
});

test('closing during avatar creation stops the late-created remote session without connecting media', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const actions = [];
  const avatar = new BuddyAvatarConnection(null, () => {}, () => {}, {
    fetcher: async (url, request) => { const action = JSON.parse(request.body).action; actions.push(action); if (action === 'start') await gate; return Response.json({ sessionToken: 'late-token' }); },
    loadClient: async () => { throw new Error('Must not connect after close'); },
  });
  const pending = avatar.connect(); avatar.close(); release(); await pending;
  assert.deepEqual(actions, ['start', 'stop']);
});
