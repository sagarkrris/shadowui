import styles from "../../styles/WorkspaceOptions.module.css";

export default function WorkspaceOptions({ enabled, children }) {
  if (!enabled) return children;
  return <details className={styles.options} onKeyDown={event => {
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
