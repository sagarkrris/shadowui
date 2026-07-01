export default function VoiceBar({ transcript, onStop, liveMode = "push-to-talk", report = null }) {
  return (
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: "rgba(10,10,15,.96)", border: "1px solid rgba(239,68,68,.35)", borderRadius: 12, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, minWidth: 260, maxWidth: "90vw", boxShadow: "0 8px 28px rgba(0,0,0,.5)" }}>
      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ef4444", flexShrink: 0, animation: "pulse 1.3s infinite" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#fca5a5", fontSize: 10.2, fontWeight: 900, marginBottom: 3, textTransform: "uppercase" }}>Voice Live Mode · {liveMode}</div>
        <span style={{ display: "block", fontSize: 13, color: transcript ? "#e8e8f0" : "#6b7280", lineHeight: 1.4 }}>{transcript || "Listening... speak now"}</span>
        {report && (
          <span style={{ color: "#94a3b8", display: "block", fontSize: 10.8, lineHeight: 1.35, marginTop: 4 }}>
            Voice report: {report.wordCount} words · {report.durationSeconds}s · {report.speakingRateWpm} WPM
          </span>
        )}
      </div>
      <button onClick={onStop} style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 7, padding: "5px 11px", color: "#f87171", fontSize: 12, cursor: "pointer" }}>Stop</button>
    </div>
  );
}
