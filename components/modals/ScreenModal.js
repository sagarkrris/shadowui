import { useRef, useState } from "react";

export default function ScreenModal({ onCapture, onClose, theme }) {
  const [preview, setPreview] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [context, setContext] = useState("");
  const [capturing, setCapturing] = useState(false);
  const fileRef = useRef();

  const capture = async () => {
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      await new Promise((resolve) => { video.onloadedmetadata = resolve; });
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      stream.getTracks().forEach((track) => track.stop());
      const url = canvas.toDataURL("image/png");
      setPreview(url);
      setImgData(url.split(",")[1]);
    } catch (error) {
      if (error.name !== "NotAllowedError") alert("Capture failed: " + error.message);
    }
    setCapturing(false);
  };

  const onFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setPreview(readerEvent.target.result);
      setImgData(readerEvent.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      setPreview(readerEvent.target.result);
      setImgData(readerEvent.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0", backdropFilter: "blur(4px)" }}>
      <div onClick={(event) => event.stopPropagation()} style={{
        background: theme.surface,
        border: `1px solid ${theme.accentBorder}`,
        borderRadius: "16px 16px 0 0",
        padding: 20,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-screenshot" style={{ color: theme.accentStrong }} />Analyze Screen
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 22, cursor: "pointer" }}>x</button>
        </div>

        {!preview ? (
          <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop}
            style={{ border: `2px dashed ${theme.accentBorder}`, borderRadius: 12, padding: "32px 20px", textAlign: "center", marginBottom: 14, cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}>
            <i className="ti ti-photo-scan" style={{ fontSize: 36, color: "#4b5563", display: "block", marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>Drag & drop a screenshot or tap to upload</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={(event) => { event.stopPropagation(); capture(); }} disabled={capturing}
                style={{ padding: "9px 16px", background: theme.accentSoft, border: `1px solid ${theme.accentBorder}`, borderRadius: 9, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <i className="ti ti-screenshot" />{capturing ? "Capturing..." : "Share Screen"}
              </button>
              <button onClick={(event) => { event.stopPropagation(); fileRef.current?.click(); }}
                style={{ padding: "9px 16px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, color: "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <i className="ti ti-upload" />Upload Image
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <img src={preview} alt="Preview" style={{ width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", marginBottom: 8 }} />
            <button onClick={() => { setPreview(null); setImgData(null); }}
              style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change image</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 5 }}>Context <span style={{ color: "#4b5563" }}>(optional)</span></label>
          <input value={context} onChange={(event) => setContext(event.target.value)} placeholder="e.g. Focus on optimal DP approach..."
            style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e8e8f0", outline: "none" }} />
        </div>

        <button onClick={() => imgData && onCapture(imgData, context)} disabled={!imgData} style={{
          width: "100%",
          padding: 11,
          background: imgData ? theme.accentSoft : theme.accentMuted,
          border: `1px solid ${imgData ? theme.accentBorder : theme.accentMuted}`,
          borderRadius: 10,
          color: imgData ? theme.accentText : "#4b5563",
          fontSize: 13,
          fontWeight: 600,
          cursor: imgData ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}>
          <i className="ti ti-robot" />Analyze with AI
        </button>
      </div>
    </div>
  );
}
