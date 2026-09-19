import test from 'node:test';
import assert from 'node:assert/strict';
import { conciseSpeechText, pcmToWav, speechPrompt } from '../lib/techBuddySpeech.mjs';
import { liveAvatarRequest, startBuddyAvatar } from '../lib/techBuddyAvatarServer.mjs';

test('spoken excerpts omit code and links, remain bounded, and retain visible details', () => {
  const text = conciseSpeechText('**Use a closure.**\n```js\nSECRET_CODE();\n```\n[Details](https://example.com)');
  assert.doesNotMatch(text, /SECRET_CODE|https|\*\*/);
  assert.match(text, /Code is shown/);
  assert.ok(conciseSpeechText('A sentence. '.repeat(300)).length < 950);
  assert.match(speechPrompt(text), /natural contemporary Indian English/);
});
test('PCM conversion creates valid mono PCM24k WAV and rejects invalid samples', () => {
  const wav = pcmToWav(Buffer.alloc(48000));
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(40), 48000);
  assert.throws(() => pcmToWav(Buffer.alloc(3)));
});
test('avatar start uses LITE and returns only scoped client credentials', async () => {
  const calls = [];
  const fetcher = async (url, request) => {
    calls.push({ url, ...request });
    return Response.json({ code: 1000, data: url.endsWith('token') ? { session_token: 'scoped.token' } : { livekit_url: 'wss://room.test', ws_url: 'wss://socket.test', livekit_client_token: 'viewer', livekit_agent_token: 'private-agent' } });
  };
  const session = await startBuddyAvatar({ LIVEAVATAR_API_KEY: 'master-secret', LIVEAVATAR_AVATAR_ID: 'avatar' }, fetcher);
  assert.equal(JSON.parse(calls[0].body).mode, 'LITE');
  assert.equal(calls[1].headers.Authorization, 'Bearer scoped.token');
  assert.doesNotMatch(JSON.stringify(session), /master-secret|private-agent/);
  assert.equal(await startBuddyAvatar({}, fetcher), null);
});
test('failed avatar start releases the remote session', async () => {
  const calls = [];
  await assert.rejects(startBuddyAvatar({ LIVEAVATAR_API_KEY: 'key', LIVEAVATAR_AVATAR_ID: 'avatar' }, async url => {
    calls.push(url);
    if (url.endsWith('start')) return new Response('', { status: 503 });
    return Response.json({ code: 100, data: { session_token: 'token' } });
  }));
  assert.ok(calls.at(-1).endsWith('/stop'));
});
test('avatar provider failures expose only safe diagnostics', async () => {
  await assert.rejects(
    liveAvatarRequest('token', null, {}, async () => Response.json({ code: 4002, message: 'invalid token' }, { status: 401 })),
    (error) => error.name === 'AvatarProviderError' && error.status === 401 && error.code === 4002 && error.message === 'Avatar provider unavailable',
  );
});
