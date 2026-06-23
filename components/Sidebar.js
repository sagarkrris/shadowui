import AgenticUICourse from "./course/AgenticUICourse";
import BrandLogo from "./BrandLogo";

export default function Sidebar({ topics, open, onClose, expandedCat, selectedCat, selectedSub, onToggleCat, onSelectSub, isMobile, theme, prepLabel, userPrepLabel, topicsLocked, onLockedTopic, onOpenCourse }) {
  const drawerWidth = isMobile ? "min(340px, 88vw)" : (open ? 320 : 0);
  const mobileClosedTransform = "translateX(calc(-100% - 14px))";

  return (
    <>
      {isMobile && open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 40, backdropFilter: "blur(2px)" }} />
      )}
      <aside className="glass-chrome" style={{
        width: drawerWidth,
        minWidth: isMobile ? undefined : drawerWidth,
        position: isMobile ? "fixed" : "relative",
        top: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        height: isMobile ? "100%" : undefined,
        zIndex: isMobile ? 50 : undefined,
        transform: isMobile ? (open ? "translateX(0)" : mobileClosedTransform) : undefined,
        borderRight: "1px solid rgba(255,255,255,.06)",
        display: "flex",
        flexDirection: "column",
        transition: "all .25s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        flexShrink: 0,
        pointerEvents: isMobile && !open ? "none" : "auto",
        visibility: isMobile && !open ? "hidden" : "visible",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <BrandLogo theme={theme} size={30} />
            <div style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.accentText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>InterviewIQ</span>
              <span style={{ display: "block", fontSize: 10.5, color: theme.accentStrong, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userPrepLabel || prepLabel}</span>
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 22, lineHeight: 1, cursor: "pointer", padding: "2px 4px" }}>x</button>
          )}
        </div>

        <div style={{ flex: 1, overflowX: "hidden", overflowY: "auto", padding: "5px 0" }}>
          <div style={{ padding: "8px 12px 12px" }}>
            <AgenticUICourse theme={theme} variant="drawer" onOpenCourse={onOpenCourse} />
          </div>
          {topicsLocked && (
            <div className="glass-card" style={{ margin: "8px 12px 10px", padding: 10, borderRadius: 8, border: `1px solid ${theme.accentBorder}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                <i className="ti ti-lock" />Setup required
              </div>
              <p style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.45 }}>
                Fill your name, role, experience, and stack to unlock personalized topics.
              </p>
            </div>
          )}
          {topics.map((topic) => {
            const isActive = selectedCat === topic.cat;
            const isExpanded = expandedCat === topic.cat;
            return (
              <div key={topic.cat}>
                <button className={isActive ? "glass-button" : ""} onClick={() => topicsLocked ? onLockedTopic?.() : onToggleCat(topic.cat)} style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "9px 16px",
                  background: isActive ? theme.accentMuted : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${isActive ? theme.accent : "transparent"}`,
                  textAlign: "left",
                  color: topicsLocked ? "#4b5563" : (isActive ? theme.accentText : "#9ca3af"),
                  cursor: topicsLocked ? "not-allowed" : "pointer",
                  transition: "all .12s",
                  minHeight: 42,
                  opacity: topicsLocked ? .72 : 1,
                }}>
                  <i className={`ti ${topicsLocked ? "ti-lock" : topic.icon}`} style={{ fontSize: 16, color: !topicsLocked && isActive ? topic.color : "#4b5563", flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{topic.cat}</span>
                  <i className={`ti ${topicsLocked ? "ti-info-circle" : `ti-chevron-${isExpanded ? "up" : "down"}`}`} style={{ fontSize: 11, color: "#374151", flexShrink: 0 }} />
                </button>
                {!topicsLocked && isExpanded && topic.subs.map((sub) => (
                  <button key={sub} className={selectedSub === sub ? "glass-button" : ""} onClick={() => onSelectSub(topic.cat, sub)} style={{
                    width: "100%",
                    display: "block",
                    padding: "7px 16px 7px 38px",
                    background: selectedSub === sub ? theme.accentMuted : "transparent",
                    border: "none",
                    textAlign: "left",
                    fontSize: 12.5,
                    color: selectedSub === sub ? theme.accentStrong : "#6b7280",
                    fontWeight: selectedSub === sub ? 500 : 400,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    minHeight: 36,
                  }}>{sub}</button>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "11px 16px", borderTop: "1px solid rgba(255,255,255,.06)", fontSize: 11, color: "#1f2937", flexShrink: 0 }}>
          {userPrepLabel || prepLabel} - Free
        </div>
      </aside>
    </>
  );
}
