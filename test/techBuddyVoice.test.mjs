import test from 'node:test';
import assert from 'node:assert/strict';
import { selectIndianEnglishVoice } from '../lib/techBuddyVoice.mjs';

test('Indian English takes precedence over the device default', () => {
  const us = { name: 'US', lang: 'en-US', default: true };
  const india = { name: 'India', lang: 'en_IN' };
  assert.equal(selectIndianEnglishVoice([us, india]), india);
});
test('voice fallback uses English and tolerates unloaded or unavailable voices', () => {
  const french = { lang: 'fr-FR', default: true };
  const english = { lang: 'en-GB' };
  assert.equal(selectIndianEnglishVoice([french, english]), english);
  assert.equal(selectIndianEnglishVoice([french]), null);
  assert.equal(selectIndianEnglishVoice(), null);
});
