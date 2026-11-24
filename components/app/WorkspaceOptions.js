import styles from "../../styles/WorkspaceOptions.module.css";
import useDismissableLayer from "../../hooks/useDismissableLayer";
import { useState } from "react";

export default function WorkspaceOptions({ enabled, children }) {
  const [open, setOpen] = useState(false);
  const ref = useDismissableLayer(enabled && open, () => { if (ref.current) ref.current.open = false; });
  if (!enabled) return children;
  return <details ref={ref} onToggle={event => setOpen(event.currentTarget.open)} className={styles.options} onKeyDown={event => {
    if (event.key === "Escape") {
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary").focus();
    }
  }} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }}>
    <summary aria-label="Workspace options"><i aria-hidden="true" className="ti ti-dots" /> More</summary>
    <div className={styles.content}>{children}</div>
  </details>;
}
