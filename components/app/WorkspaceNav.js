import { useEffect, useMemo, useState } from "react";

const WORKSPACE_MENU_DETAILS = {
  offerWarRoom: "Offer-focused prep dashboard, company lanes, loops, stories, and weak-spot drills.",
  interviewReady: "Most-asked questions with polished answers and follow-up drills.",
  company: "Company-specific questions, notes, and final-day prep.",
  canvas: "System design canvas with review and export flow.",
  designLab: "HLD, LLD, and pattern practice in one focused room.",
  scenarioBank: "Scenario drills, prompts, and production-style practice.",
  javaDigest: "Java, backend, and topic refreshers for quick review.",
  dsaLab: "Visual algorithms, beginner flow, and guided practice.",
  course: "Agentic UI course path, lessons, and capstone progress.",
};

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
          aria-current={activeTab === workspace.id ? "page" : undefined}
        >
          <i className={`ti ${workspace.icon}`} />
        </button>
      ))}
    </>
  );
}

export function TabletWorkspaceMenu({ activeTab, accent = "#8bd3ff", onToggleWorkspace, workspaces }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeTab);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const selectWorkspace = (workspaceId) => {
    onToggleWorkspace(workspaceId);
    setMenuOpen(false);
  };

  return (
    <div className="tablet-workspace-menu" style={{ flexShrink: 0, minWidth: 0, position: "relative" }}>
      <button
        type="button"
        className={`glass-button ${activeWorkspace ? "active" : ""}`}
        aria-label="Workspace menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((value) => !value)}
        style={{ alignItems: "center", border: `1px solid ${activeWorkspace ? `${accent}55` : "rgba(255,255,255,.09)"}`, borderRadius: 8, color: activeWorkspace ? accent : "#cbd5e1", cursor: "pointer", display: "inline-flex", fontSize: 11.5, fontWeight: 850, gap: 7, maxWidth: 190, minHeight: 34, padding: "7px 10px", whiteSpace: "nowrap" }}
      >
        <i className={`ti ${activeWorkspace?.icon || "ti-layout-grid"}`} style={{ fontSize: 15 }} />
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{activeWorkspace ? `Workspace: ${activeWorkspace.shortLabel || activeWorkspace.label}` : "Workspaces"}</span>
        <i className={`ti ${menuOpen ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ color: "#6b7280", fontSize: 13 }} />
      </button>
      {menuOpen && (
        <section
          aria-label="Tablet workspace menu"
          className="glass-card"
          style={{ background: "rgba(7,11,20,.985)", border: "1px solid rgba(255,255,255,.13)", borderRadius: 10, boxShadow: "0 22px 54px rgba(0,0,0,.52)", display: "grid", gap: 10, left: 0, maxHeight: "min(72vh, 540px)", overflowY: "auto", padding: 12, pointerEvents: "auto", position: "absolute", top: "calc(100% + 10px)", width: "min(420px, calc(100vw - 24px))", zIndex: 120 }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <strong style={{ color: "#f8fbff", fontSize: 11, fontWeight: 950, letterSpacing: ".04em", textTransform: "uppercase" }}>Workspaces</strong>
              <span style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.35 }}>Choose a focused prep room.</span>
            </div>
            <button type="button" aria-label="Close workspace menu" onClick={() => setMenuOpen(false)} style={{ alignItems: "center", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: "#9ca3af", cursor: "pointer", display: "inline-flex", height: 28, justifyContent: "center", width: 28 }}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr" }}>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                aria-current={activeTab === workspace.id ? "page" : undefined}
                onClick={() => selectWorkspace(workspace.id)}
                style={{ alignItems: "center", background: activeTab === workspace.id ? "rgba(139,211,255,.12)" : "rgba(255,255,255,.04)", border: `1px solid ${activeTab === workspace.id ? `${accent}66` : "rgba(255,255,255,.085)"}`, borderRadius: 8, color: activeTab === workspace.id ? "#f8fbff" : "#dbe6f4", cursor: "pointer", display: "grid", gap: 10, gridTemplateColumns: "32px minmax(0, 1fr) auto", minHeight: 58, minWidth: 0, padding: "10px 11px", pointerEvents: "auto", textAlign: "left" }}
              >
                <span style={{ alignItems: "center", background: activeTab === workspace.id ? `${accent}18` : "rgba(255,255,255,.045)", border: `1px solid ${activeTab === workspace.id ? `${accent}55` : "rgba(255,255,255,.07)"}`, borderRadius: 8, color: activeTab === workspace.id ? accent : "#94a3b8", display: "inline-flex", height: 32, justifyContent: "center", width: 32 }}>
                  <i className={`ti ${workspace.icon}`} style={{ fontSize: 16 }} />
                </span>
                <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
                  <span style={{ color: activeTab === workspace.id ? "#ffffff" : "#edf3fb", fontSize: 12.5, fontWeight: 900, lineHeight: 1.2 }}>{workspace.label}</span>
                  <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 650, lineHeight: 1.35 }}>{WORKSPACE_MENU_DETAILS[workspace.id] || "Open this workspace."}</span>
                </span>
                <span style={{ color: activeTab === workspace.id ? accent : "#64748b", fontSize: 10.5, fontWeight: 900, justifySelf: "end", textTransform: "uppercase" }}>{activeTab === workspace.id ? "Open" : "Go"}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function compactLabel(label = "") {
  return String(label).length > 12 ? `${String(label).slice(0, 11)}...` : label;
}

function MobileNavButton({ accent, item, onClick, menuButton = false, menuOpen = false }) {
  const active = Boolean(item.active || (menuButton && menuOpen));

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={item.disabled}
      aria-label={item.label}
      aria-current={item.active ? "page" : undefined}
      aria-expanded={menuButton ? menuOpen : undefined}
      aria-haspopup={menuButton ? "menu" : undefined}
      title={item.label}
      style={{ alignItems: "center", background: active ? "rgba(255,255,255,.06)" : "none", border: "none", borderRadius: 8, color: item.danger ? "#f87171" : active ? accent : "#6b7280", cursor: item.disabled ? "not-allowed" : "pointer", display: "grid", flex: "1 1 0", gap: 2, justifyItems: "center", minHeight: 38, minWidth: 0, opacity: item.disabled ? .35 : 1, padding: "5px 2px", transition: "all .15s" }}
    >
      <i className={`ti ${item.icon}`} style={{ fontSize: 18 }} />
      <span style={{ fontSize: 9.5, fontWeight: 800, lineHeight: 1.1, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {compactLabel(item.label)}
      </span>
    </button>
  );
}

export function MobileBottomNav({ accent = "#8bd3ff", items = [] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const quickItems = useMemo(() => {
    const home = items.find((item) => item.label === "Home");
    const topics = items.find((item) => item.label === "Topics");
    const activeWorkspace = items.find((item) => item.active && !["Home", "Topics"].includes(item.label));

    return [home, topics, activeWorkspace].filter(Boolean).filter((item, index, list) => (
      list.findIndex((candidate) => candidate.label === item.label) === index
    ));
  }, [items]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const runAction = (item) => {
    if (item.disabled) return;
    item.action?.();
    setMenuOpen(false);
  };

  return (
    <div style={{ flexShrink: 0, minWidth: 0, position: "relative" }}>
      {menuOpen && (
        <section
          aria-label="Mobile workspace menu"
          className="glass-card"
          style={{ background: "rgba(8,12,22,.96)", border: "1px solid rgba(255,255,255,.11)", borderRadius: 10, bottom: "calc(100% + 8px)", boxShadow: "0 16px 40px rgba(0,0,0,.46)", display: "grid", gap: 8, left: 8, padding: 10, position: "absolute", right: 8, zIndex: 30 }}
        >
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong style={{ color: "#f8fbff", fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Workspace Menu</strong>
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} style={{ alignItems: "center", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: "#9ca3af", cursor: "pointer", display: "inline-flex", height: 28, justifyContent: "center", width: 28 }}>
              <i className="ti ti-x" />
            </button>
          </div>
          <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 108px), 1fr))" }}>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={item.disabled}
                aria-current={item.active ? "page" : undefined}
                onClick={() => runAction(item)}
                style={{ alignItems: "center", background: item.active ? "rgba(139,211,255,.11)" : "rgba(255,255,255,.035)", border: `1px solid ${item.active ? `${accent}55` : "rgba(255,255,255,.075)"}`, borderRadius: 8, color: item.danger ? "#f87171" : item.active ? "#f8fbff" : "#cbd5e1", cursor: item.disabled ? "not-allowed" : "pointer", display: "flex", fontSize: 11, fontWeight: 850, gap: 7, minHeight: 34, minWidth: 0, opacity: item.disabled ? .35 : 1, padding: "7px 8px", textAlign: "left" }}
              >
                <i className={`ti ${item.icon}`} style={{ color: item.active ? accent : "currentColor", flexShrink: 0, fontSize: 15 }} />
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <nav className="glass-chrome" style={{ display: "flex", alignItems: "stretch", gap: 4, padding: "6px 8px", borderTop: "1px solid rgba(255,255,255,.08)", minWidth: 0, overflow: "hidden", paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}>
        {quickItems.map((item) => (
          <MobileNavButton key={item.label} accent={accent} item={item} onClick={() => runAction(item)} />
        ))}
        <MobileNavButton
          accent={accent}
          item={{ icon: "ti-dots", label: "More" }}
          menuButton
          menuOpen={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        />
      </nav>
    </div>
  );
}
