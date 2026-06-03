export function DesktopWorkspaceNav({ activeTab, onToggleWorkspace, workspaces }) {
  return (
    <>
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          className={`icon-btn ${activeTab === workspace.id ? "active" : ""}`}
          onClick={() => onToggleWorkspace(workspace.id)}
          title={workspace.label}
          aria-label={workspace.label}
        >
          <i className={`ti ${workspace.icon}`} />
        </button>
      ))}
    </>
  );
}

export function MobileBottomNav({ accent = "#8bd3ff", items }) {
  return (
    <nav className="glass-chrome" style={{ display: "flex", alignItems: "stretch", gap: 2, padding: "6px 8px", borderTop: "1px solid rgba(255,255,255,.08)", flexShrink: 0, minWidth: 0, overflow: "hidden", paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
      {items.map(({ icon, label, action, active, danger, disabled }) => (
        <button
          key={label}
          onClick={action}
          disabled={disabled}
          aria-label={label}
          title={label}
          style={{ alignItems: "center", background: "none", border: "none", borderRadius: 8, color: danger ? "#f87171" : active ? accent : "#6b7280", cursor: disabled ? "not-allowed" : "pointer", display: "flex", flex: "1 1 0", justifyContent: "center", minHeight: 36, minWidth: 0, opacity: disabled ? .35 : 1, padding: "6px 2px", transition: "all .15s" }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: 19 }} />
        </button>
      ))}
    </nav>
  );
}
