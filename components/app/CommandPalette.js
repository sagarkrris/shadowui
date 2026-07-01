import { useMemo, useState } from "react";
import { filterCommandPaletteActions } from "../../lib/commandPalette.mjs";

export default function CommandPalette({ actions = [], onClose, onSelect, open = false, theme }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => filterCommandPaletteActions(actions, query), [actions, query]);

  if (!open) return null;

  return (
    <div style={{ alignItems: "flex-start", background: "rgba(2,6,23,.74)", display: "flex", inset: 0, justifyContent: "center", padding: "12vh 16px 16px", position: "fixed", zIndex: 200 }}>
      <section className="glass-card" style={{ background: "rgba(8,12,22,.98)", border: `1px solid ${theme?.accentBorder || "rgba(255,255,255,.12)"}`, borderRadius: 14, boxShadow: "0 28px 80px rgba(0,0,0,.55)", display: "grid", gap: 10, maxWidth: 720, padding: 14, width: "min(100%, 720px)" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <i className="ti ti-command" style={{ color: theme?.accentStrong || "#8bd3ff", fontSize: 18 }} />
          <input
            autoFocus
            className="glass-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Command palette"
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "#f8fbff", flex: 1, fontSize: 13, outline: "none", padding: "10px 12px" }}
          />
          <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, color: "#94a3b8", cursor: "pointer", padding: "8px 10px" }}>
            Esc
          </button>
        </div>
        <div style={{ display: "grid", gap: 8, maxHeight: "min(58vh, 520px)", overflowY: "auto" }}>
          {filtered.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={() => onSelect(action)}
              style={{ alignItems: "center", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: action.disabled ? "#64748b" : "#e2e8f0", cursor: action.disabled ? "not-allowed" : "pointer", display: "flex", fontSize: 12.5, fontWeight: 800, justifyContent: "space-between", minHeight: 44, opacity: action.disabled ? 0.45 : 1, padding: "10px 12px", textAlign: "left" }}
            >
              <span>{action.label}</span>
              <span style={{ color: theme?.accentStrong || "#8bd3ff", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{action.type}</span>
            </button>
          ))}
          {!filtered.length && (
            <div style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, color: "#94a3b8", fontSize: 12, padding: 12 }}>
              No commands matched. Try workspace, voice, retry, export, or import.
            </div>
          )}
        </div>
        <div style={{ color: "#94a3b8", fontSize: 11.2, lineHeight: 1.4 }}>
          Command Palette · `Ctrl/Cmd + Shift + P`
        </div>
      </section>
    </div>
  );
}
