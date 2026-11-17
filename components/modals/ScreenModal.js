import { useEffect, useRef, useState } from "react";
import { isModalCloseKey } from "../../lib/modalKeyboard.mjs";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export default function ScreenModal({ onCapture, onClose, theme }) {
  const [preview, setPreview] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [mimeType, setMimeType] = useState("image/png");
  const [error, setError] = useState("");
  const [context, setContext] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [screenShareSupported, setScreenShareSupported] = useState(false);
  const fileRef = useRef();
  const modalRef = useRef();
  useFocusTrap(modalRef);
  useEffect(() => {
    setScreenShareSupported(Boolean(navigator.mediaDevices?.getDisplayMedia));
  }, []);

  const capture = async () => {
    if (!screenShareSupported) return;
    setError("");
    setCapturing(true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error("Could not read the shared screen. Upload a screenshot instead."));
        video.srcObject = stream;
      });
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const url = canvas.toDataURL("image/png");
      if (url.length > 7_000_000) throw new Error("Image too large");
      setMimeType("image/png");
      setPreview(url);
      setImgData(url.split(",")[1]);
    } catch (error) {
      setError(error.name === "NotAllowedError" ? "Screen sharing was cancelled or blocked. Try again, or upload a screenshot." : "Could not capture the screen. Try uploading a screenshot instead.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setCapturing(false);
    }
  };

  const readFile = (file) => {
    if (!file) return;
    setError("");
    setPreview(null); setImgData(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("Could not read that image. Please choose it again.");
    reader.onload = () => {
      setMimeType(file.type);
      setPreview(reader.result);
      setImgData(String(reader.result).split(",")[1]);
    };
    reader.readAsDataURL(file);
  };
  const onFile = (event) => { readFile(event.target.files[0]); event.target.value = ""; };
  const onDrop = (event) => { event.preventDefault(); readFile(event.dataTransfer.files[0]); };

  return (
    <div
      className={`screen-modal-overlay theme-${theme.appearance === "light" ? "light" : "dark"}`}
      onClick={onClose}
      onKeyDown={(event) => {
        if (isModalCloseKey(event)) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="screen-modal-title"
      tabIndex={-1}
      ref={modalRef}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "16px", backdropFilter: "blur(4px)" }}
    >
      <div className="screen-modal-panel" onClick={(event) => event.stopPropagation()} style={{
        border: `1px solid ${theme.accentBorder}`,
        borderRadius: 16,
        padding: 20,
        width: "100%",
        maxWidth: 520,
        maxHeight: "calc(100dvh - 32px)",
        overflowY: "auto",
      }}>
        <div style={{ width: 36, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, margin: "0 auto 16px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span id="screen-modal-title" style={{ fontSize: 15, fontWeight: 600, color: "#e8e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            <i aria-hidden="true" className="ti ti-screenshot" style={{ color: theme.accentStrong }} />Analyze Screen
          </span>
          <button aria-label="Close screen analysis" className="icon-btn" onClick={onClose} style={{ color: "#6b7280", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        {!preview ? (
          <div className="glass-card" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}
            style={{ border: `2px dashed ${theme.accentBorder}`, borderRadius: 12, padding: "32px 20px", textAlign: "center", marginBottom: 14, cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}>
            <i aria-hidden="true" className="ti ti-photo-scan" style={{ fontSize: 36, color: "#4b5563", display: "block", marginBottom: 12 }} />
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>Share a screen or upload a screenshot</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" className="glass-button" onClick={(event) => { event.stopPropagation(); capture(); }} disabled={capturing || !screenShareSupported}
                style={{ padding: "9px 16px", border: `1px solid ${theme.accentBorder}`, borderRadius: 9, color: theme.accentText, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <i aria-hidden="true" className="ti ti-screenshot" />{capturing ? "Capturing..." : screenShareSupported ? "Share Screen" : "Screen sharing unavailable"}
              </button>
              <button className="glass-button" onClick={(event) => { event.stopPropagation(); fileRef.current?.click(); }}
                style={{ padding: "9px 16px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, color: "#9ca3af", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                <i aria-hidden="true" className="ti ti-upload" />Upload Image
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Screenshot preview" style={{ width: "100%", maxHeight: "35dvh", objectFit: "contain", borderRadius: 8, border: "1px solid rgba(255,255,255,.08)", marginBottom: 8 }} />
            <button onClick={() => { setPreview(null); setImgData(null); setError(""); }}
              style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Change image</button>
          </div>
        )}

        <p className="screen-modal-help">PNG, JPEG, or WebP · up to 5 MB. Preview your image before sending it to AI.</p>
        {!screenShareSupported && <p className="screen-modal-help">This browser does not support screen sharing. Upload a screenshot instead.</p>}
        {error && <p role="alert" className="screen-modal-error">{error}</p>}
        <input aria-label="Screenshot image" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onFile} />

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="screen-context" style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 5 }}>Context <span style={{ color: "#4b5563" }}>(optional)</span></label>
          <input id="screen-context" maxLength={500} className="glass-input" value={context} onChange={(event) => setContext(event.target.value)} placeholder="e.g. Focus on optimal DP approach..."
            style={{ width: "100%", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e8e8f0", outline: "none" }} />
        </div>

        {!imgData && <p className="screen-modal-help">Choose an image to enable analysis.</p>}
        <button className="glass-button screen-modal-submit" onClick={() => imgData && onCapture(imgData, context, mimeType)} disabled={!imgData} style={{
          width: "100%",
          padding: 11,
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
          <i aria-hidden="true" className="ti ti-robot" />Analyze with AI
        </button>
      </div>
    </div>
  );
}
