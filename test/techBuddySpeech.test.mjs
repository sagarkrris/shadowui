import test from 'node:test';
import assert from 'node:assert/strict';
import { conciseSpeechText, pcmToWav, speechPrompt, spokenInterviewReview } from '../lib/techBuddySpeech.mjs';

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

test('spoken interview review asks the generated follow-up and keeps feedback concise', () => {
  const narration = spokenInterviewReview({
    feedback: 'Explain the transaction boundary and give one concrete recovery example.',
    strengths: ['You identified the primary failure mode'],
    gaps: ['Name the isolation guarantee'],
    followUp: 'How would you retry safely after a timeout?'
  });
  assert.match(narration, /^Follow-up question: How would you retry safely/);
  assert.match(narration, /Concise feedback:/);
  assert.match(narration, /full feedback is available on screen/i);
});
