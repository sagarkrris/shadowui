import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSpeechTranscript,
  getVoiceErrorMessage,
  getVoiceSupport,
} from "../lib/voiceSupport.mjs";

function recognitionResult(transcript, isFinal) {
  return Object.assign([{ transcript }], { isFinal });
}

test("supports Web Speech when a recognition constructor is available", () => {
  const support = getVoiceSupport({
    isSecureContext: true,
    webkitSpeechRecognition() {},
    navigator: { userAgent: "Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/604.1" },
  });

  assert.equal(support.supported, true);
  assert.equal(support.isIOS, true);
  assert.equal(support.Constructor.name, "webkitSpeechRecognition");
});

test("explains iOS fallback when speech recognition is unavailable", () => {
  const support = getVoiceSupport({
    isSecureContext: true,
    navigator: { userAgent: "Mozilla/5.0 (iPhone) Version/16.0 Mobile Safari/604.1" },
  });

  assert.equal(support.supported, false);
  assert.match(support.message, /Safari/);
  assert.match(support.message, /keyboard dictation/);
});

test("explains secure context requirement before starting voice input", () => {
  const support = getVoiceSupport({
    isSecureContext: false,
    SpeechRecognition() {},
    navigator: { userAgent: "Mozilla/5.0" },
  });

  assert.equal(support.supported, false);
  assert.match(support.message, /HTTPS/);
});

test("maps permission errors to a helpful iOS-specific message", () => {
  const message = getVoiceErrorMessage(
    { error: "not-allowed" },
    {
      isIOS: true,
      message: "Use Safari with Siri enabled.",
    }
  );

  assert.match(message, /microphone permission/);
  assert.match(message, /Siri/);
});

test("builds speech text from the current recognition results without replaying prior finals", () => {
  const firstEvent = buildSpeechTranscript([
    recognitionResult("I use React", true),
  ]);

  assert.equal(firstEvent.finalText, "I use React");
  assert.equal(firstEvent.displayText, "I use React");

  const replayedEvent = buildSpeechTranscript([
    recognitionResult("I use React", true),
    recognitionResult(" and Node", false),
  ]);

  assert.equal(replayedEvent.finalText, "I use React");
  assert.equal(replayedEvent.displayText, "I use React and Node");
});
