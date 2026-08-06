export default function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} role={type === "error" ? "alert" : "status"} aria-live={type === "error" ? "assertive" : "polite"} aria-atomic="true" style={{ position: "fixed", top: 14, right: 14, zIndex: 9999 }}>
      <i className={`ti ${type === "success" ? "ti-check" : type === "error" ? "ti-x" : "ti-info-circle"}`} />{msg}
    </div>
  );
}
