export default function Toast({ msg, type, onDismiss }) {
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"} aria-atomic="true" style={{ position: "fixed", top: "clamp(64px, 9vh, 92px)", right: 14, zIndex: 9999, pointerEvents: "auto" }}>
      <i className={`ti ${type === "success" ? "ti-check" : type === "error" ? "ti-alert-circle" : "ti-info-circle"}`} aria-hidden="true" />
      <span>{msg}</span>
      <button type="button" className="toast-dismiss" onClick={onDismiss} aria-label="Dismiss notification"><i className="ti ti-x" /></button>
    </div>
  );
}
