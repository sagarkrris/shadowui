import { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeInterviewRecordingTranscript,
  buildInterviewRecordingReviewPrompt,
} from "../../lib/interviewRecordingReview.mjs";
import {
  buildSpeechTranscript,
  getRecordingErrorMessage,
  getRecordingSupport,
  getVoiceSupport,
} from "../../lib/voiceSupport.mjs";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const DEFAULT_THEME = {
  accentBorder: "rgba(255,255,255,.12)",
  accentMuted: "rgba(255,255,255,.08)",
  accentStrong: "#60a5fa",
  accentText: "#dbeafe",
};

export default function RecordingReviewModal({
  initialTranscript = "",
  onClose,
  onReviewReady,
  question = "",
  role = "",
  theme = DEFAULT_THEME,
}) {
  const [transcript, setTranscript] = useState(initialTranscript);
  const [recording, setRecording] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [message, setMessage] = useState("");
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const modalRef = useRef(null);
  useFocusTrap(modalRef);

  const recordingSupport = useMemo(
    () => (typeof window === "undefined" ? { supported: false, type: "typed-fallback", message: "" } : getRecordingSupport(window)),
    []
  );
  const voiceSupport = useMemo(
    () => (typeof window === "undefined" ? { supported: false } : getVoiceSupport(window)),
    []
  );
  const review = useMemo(
    () => analyzeInterviewRecordingTranscript(transcript, { durationMs }),
    [durationMs, transcript]
  );
  const prompt = useMemo(
    () => buildInterviewRecordingReviewPrompt(review, { question, role }),
    [question, review, role]
  );

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
  }, []);

  const stopRecording = () => {
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    recognitionRef.current = null;
    streamRef.current = null;
    setRecording(false);
    setDurationMs(startedAt ? Date.now() - startedAt : durationMs);
  };

  const startRecording = async () => {
    if (!recordingSupport.supported) {
      setMessage(recordingSupport.message);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStartedAt(Date.now());
      setDurationMs(0);
      setMessage("Recording locally. Transcript review will use text only.");
      setRecording(true);

      if (voiceSupport.supported && voiceSupport.Constructor) {
        const recognition = new voiceSupport.Constructor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          const speech = buildSpeechTranscript(event.results);
          setTranscript(speech.displayText);
        };
        recognition.onerror = (event) => setMessage(event.message || event.error || voiceSupport.message || "");
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch (error) {
      setRecording(false);
      setMessage(getRecordingErrorMessage(error, recordingSupport));
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const submitReview = () => {
    onReviewReady?.({
      review,
      prompt,
      transcript,
    });
  };

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recording-review-title"
      ref={modalRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="glass-chrome"
        onClick={(event) => event.stopPropagation()}
        style={{
          border: `1px solid ${theme.accentBorder}`,
          borderRadius: "16px 16px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span id="recording-review-title" style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-microphone" style={{ color: theme.accentStrong }} />
            Recording Review
          </span>
          <button className="icon-btn" onClick={onClose} style={{ color: "#6b7280", fontSize: 22, cursor: "pointer" }}>x</button>
        </div>

        <div className="glass-card" style={{ border: `1px solid ${theme.accentMuted}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <button
              className="glass-button"
              onClick={recording ? stopRecording : startRecording}
              style={{
                padding: "9px 14px",
                border: `1px solid ${theme.accentBorder}`,
                borderRadius: 9,
                color: theme.accentText,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <i className={`ti ${recording ? "ti-player-stop" : "ti-microphone"}`} />
              {recording ? "Stop" : "Record"}
            </button>
            <span style={{ color: "#9ca3af", fontSize: 12, alignSelf: "center" }}>
              {recordingSupport.supported ? "Microphone available" : recordingSupport.message}
            </span>
          </div>
          {message ? <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5, margin: 0 }}>{message}</p> : null}
        </div>

        <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 6 }}>Transcript</label>
        <textarea
          className="glass-input"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Type, paste, or record your answer transcript..."
          rows={7}
          style={{
            width: "100%",
            resize: "vertical",
            border: "1px solid rgba(255,255,255,.09)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#e8e8f0",
            fontSize: 13,
            lineHeight: 1.5,
            outline: "none",
            marginBottom: 12,
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
          {[
            ["Duration", review.duration.label],
            ["Fillers", review.fillerWords.total],
            ["STAR", `${review.starCoverage.length}/4`],
            ["Clarity", `${review.clarityScore}/100`],
          ].map(([label, value]) => (
            <div key={label} className="glass-card" style={{ border: `1px solid ${theme.accentMuted}`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 4 }}>{label}</div>
              <div style={{ color: "#e8e8f0", fontSize: 14, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.5, margin: "0 0 12px" }}>{review.displayText}</p>

        <button
          className="glass-button"
          onClick={submitReview}
          disabled={review.empty}
          style={{
            width: "100%",
            padding: 11,
            border: `1px solid ${review.empty ? theme.accentMuted : theme.accentBorder}`,
            borderRadius: 10,
            color: review.empty ? "#4b5563" : theme.accentText,
            fontSize: 13,
            fontWeight: 600,
            cursor: review.empty ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <i className="ti ti-clipboard-check" />
          Generate Review
        </button>
      </div>
    </div>
  );
}
