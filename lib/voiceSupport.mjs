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
