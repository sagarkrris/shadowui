const IOS_PATTERN = /iPad|iPhone|iPod/i;

export function isIOSUserAgent(userAgent = "") {
  return IOS_PATTERN.test(userAgent);
}

export function getVoiceSupport(win = {}) {
  const nav = win.navigator || {};
  const userAgent = nav.userAgent || "";
  const isIOS = isIOSUserAgent(userAgent);
  const Constructor = win.SpeechRecognition || win.webkitSpeechRecognition || null;

  if (!win.isSecureContext) {
    return {
      supported: false,
      isIOS,
      Constructor: null,
      message: "Voice input needs HTTPS or localhost before the browser can allow microphone speech recognition.",
    };
  }

  if (!Constructor) {
    return {
      supported: false,
      isIOS,
      Constructor: null,
      message: isIOS
        ? "On iPhone, use Safari with Siri enabled and allow microphone access. If voice still fails, use the keyboard dictation microphone."
        : "Voice input is not available in this browser. Try Chrome, Edge, or Safari, or use your keyboard dictation microphone.",
    };
  }

  return {
    supported: true,
    isIOS,
    Constructor,
    message: isIOS
      ? "On iPhone, Safari speech recognition may require Siri and microphone permission."
      : "",
  };
}

function chooseRecordingMimeType(MediaRecorder) {
  if (!MediaRecorder?.isTypeSupported) return "";

  return [
    "audio/webm",
    "audio/mp4",
    "audio/ogg",
  ].find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function getRecordingSupport(win = {}) {
  const nav = win.navigator || {};
  const isIOS = isIOSUserAgent(nav.userAgent || "");
  const hasGetUserMedia = typeof nav.mediaDevices?.getUserMedia === "function";
  const hasMediaRecorder = typeof win.MediaRecorder === "function";

  if (!win.isSecureContext) {
    return {
      supported: false,
      type: "secure-context-required",
      isIOS,
      mimeType: "",
      message: "Recording review needs HTTPS or localhost before the browser can allow microphone recording. You can type or paste your answer instead.",
    };
  }

  if (!hasGetUserMedia || !hasMediaRecorder) {
    return {
      supported: false,
      type: "typed-fallback",
      isIOS,
      mimeType: "",
      message: isIOS
        ? "Recording review is not available in this iPhone browser. Type or paste your answer to get the same transcript-first coaching."
        : "Recording review is not available in this browser. Type or paste your answer to get transcript-first coaching.",
    };
  }

  return {
    supported: true,
    type: "recording-supported",
    isIOS,
    mimeType: chooseRecordingMimeType(win.MediaRecorder),
    message: "",
  };
}

export function getRecordingErrorMessage(error = {}, support = {}) {
  const name = error.name || error.error || "";

  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Recording review needs microphone permission. Allow access and try again, or type or paste your answer for the same transcript-first review.";
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone was found. Type or paste your answer to generate a recording review.";
  }

  if (support.message) return support.message;

  return "Recording could not start. Type or paste your answer to generate a recording review.";
}

function joinSpeechSegments(segments) {
  return segments
    .map((segment) => `${segment || ""}`.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeSpeechSegment(segment) {
  return `${segment || ""}`.trim().replace(/\s+/g, " ");
}

function isProgressiveSpeechUpdate(previous, next) {
  if (!previous || !next) return false;
  return next === previous || next.startsWith(`${previous} `);
}

function compactProgressiveSpeechSegments(segments) {
  return segments.reduce((compacted, segment) => {
    const next = normalizeSpeechSegment(segment);
    if (!next) return compacted;

    const previous = compacted[compacted.length - 1];
    if (isProgressiveSpeechUpdate(previous, next)) {
      return [...compacted.slice(0, -1), next];
    }

    if (isProgressiveSpeechUpdate(next, previous)) {
      return compacted;
    }

    return [...compacted, next];
  }, []);
}

export function buildSpeechTranscript(results = []) {
  const finalSegments = [];
  const interimSegments = [];

  for (const result of Array.from(results)) {
    const transcript = result?.[0]?.transcript;

    if (!transcript) continue;

    if (result.isFinal) {
      finalSegments.push(transcript);
    } else {
      interimSegments.push(transcript);
    }
  }

  const finalText = joinSpeechSegments(compactProgressiveSpeechSegments(finalSegments));
  const interimText = joinSpeechSegments(compactProgressiveSpeechSegments(interimSegments));

  return {
    finalText,
    interimText,
    displayText: joinSpeechSegments(compactProgressiveSpeechSegments([finalText, interimText])),
  };
}

export function getVoiceErrorMessage(event = {}, support = {}) {
  const error = event.error || "";

  if (error === "not-allowed" || error === "service-not-allowed") {
    return support.isIOS
      ? "Voice input needs microphone permission. On iPhone, also make sure Siri is enabled, then try Safari again or use keyboard dictation."
      : "Voice input needs microphone permission. Allow microphone access in the browser and try again.";
  }

  if (error === "no-speech") {
    return "I did not catch any speech. Try again, or use keyboard dictation if you are on iPhone.";
  }

  if (error === "network") {
    return "Speech recognition could not reach the browser speech service. Check your connection and try again.";
  }

  if (support.message) return support.message;

  return "Voice recognition error. Try again, or type your answer instead.";
}

export function createVoiceSessionReport({
  transcript = "",
  startedAt = null,
  endedAt = null,
  mode = "push-to-talk",
} = {}) {
  const text = String(transcript || "").trim();
  const startTime = startedAt ? Date.parse(startedAt) : NaN;
  const endTime = endedAt ? Date.parse(endedAt) : NaN;
  const durationMs = Number.isFinite(startTime) && Number.isFinite(endTime) && endTime >= startTime
    ? endTime - startTime
    : 0;
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return {
    mode,
    transcript: text,
    wordCount: words,
    durationSeconds: Math.round(durationMs / 1000),
    speakingRateWpm: durationMs > 0 ? Math.round((words / durationMs) * 60000) : 0,
  };
}
