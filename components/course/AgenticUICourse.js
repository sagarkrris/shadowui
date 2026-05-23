import { AGENTIC_UI_COURSE } from "../../lib/agenticCourse.mjs";

function CourseVisual({ type, theme }) {
  const accent = theme.accentStrong || "#86efac";
  const soft = theme.accentText || "#bbf7d0";

  if (type === "autonomy") {
    return (
      <svg viewBox="0 0 320 150" role="img" aria-label="Autonomy levels from assist to approved action" style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x="10" y="18" width="300" height="114" rx="18" fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.12)" />
        {["Suggest", "Draft", "Approve", "Execute"].map((label, index) => {
          const x = 34 + index * 70;
          return (
            <g key={label}>
              <circle cx={x} cy="72" r={index === 2 ? 21 : 16} fill={index === 2 ? accent : "rgba(255,255,255,.08)"} opacity={index === 2 ? 0.95 : 1} />
              <text x={x} y="112" fill={index === 2 ? soft : "#9ca3af"} fontSize="12" fontWeight="700" textAnchor="middle">{label}</text>
              {index < 3 && <path d={`M ${x + 22} 72 H ${x + 48}`} stroke="rgba(255,255,255,.22)" strokeWidth="3" strokeLinecap="round" />}
            </g>
          );
        })}
        <text x="160" y="40" fill="#e8e8f0" fontSize="14" fontWeight="800" textAnchor="middle">User-Controlled Autonomy</text>
      </svg>
    );
  }

  if (type === "approval") {
    return (
      <svg viewBox="0 0 320 150" role="img" aria-label="Human approval gate before action" style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x="18" y="20" width="126" height="92" rx="14" fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.12)" />
        <rect x="176" y="20" width="126" height="92" rx="14" fill="rgba(255,255,255,.045)" stroke={accent} />
        <path d="M145 66 H174" stroke={accent} strokeWidth="4" strokeLinecap="round" />
        <path d="M164 56 L176 66 L164 76" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="81" y="52" fill="#e8e8f0" fontSize="14" fontWeight="800" textAnchor="middle">Agent Draft</text>
        <text x="239" y="52" fill="#e8e8f0" fontSize="14" fontWeight="800" textAnchor="middle">Approve</text>
        <rect x="203" y="68" width="72" height="22" rx="11" fill={accent} opacity=".9" />
        <text x="239" y="84" fill="#111827" fontSize="11" fontWeight="900" textAnchor="middle">Human Gate</text>
        <text x="160" y="134" fill="#9ca3af" fontSize="12" textAnchor="middle">Preview changes before execution</text>
      </svg>
    );
  }

  if (type === "trace") {
    return (
      <svg viewBox="0 0 320 150" role="img" aria-label="Agent trace and guardrail timeline" style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x="16" y="16" width="288" height="118" rx="18" fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.12)" />
        {[
          ["Plan", 38, accent],
          ["Tool", 88, "#60a5fa"],
          ["Check", 138, "#f59e0b"],
          ["Reply", 188, "#34d399"],
        ].map(([label, x, color], index) => (
          <g key={label}>
            <circle cx={x} cy="62" r="11" fill={color} />
            <text x={x} y="96" fill="#e8e8f0" fontSize="11" fontWeight="800" textAnchor="middle">{label}</text>
            {index < 3 && <path d={`M ${x + 15} 62 H ${x + 35}`} stroke="rgba(255,255,255,.22)" strokeWidth="3" strokeLinecap="round" />}
          </g>
        ))}
        <rect x="220" y="48" width="58" height="30" rx="8" fill="rgba(248,113,113,.14)" stroke="rgba(248,113,113,.5)" />
        <text x="249" y="67" fill="#fecaca" fontSize="10" fontWeight="900" textAnchor="middle">Guardrail</text>
        <text x="160" y="122" fill="#9ca3af" fontSize="12" textAnchor="middle">Timeline + policy state builds trust</text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 320 150" role="img" aria-label="Agent loop from intent to action" style={{ width: "100%", height: "auto", display: "block" }}>
      <rect x="14" y="14" width="292" height="122" rx="18" fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.12)" />
      {[
        ["Intent", 160, 38],
        ["Plan", 230, 76],
        ["Act", 160, 114],
        ["Observe", 90, 76],
      ].map(([label, x, y]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="22" fill="rgba(255,255,255,.07)" stroke={accent} />
          <text x={x} y={y + 4} fill={soft} fontSize="11" fontWeight="900" textAnchor="middle">{label}</text>
        </g>
      ))}
      <path d="M183 44 C215 48 236 56 235 72" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M222 96 C204 112 184 118 167 116" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M137 112 C109 104 91 92 90 78" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M97 58 C112 42 133 36 153 37" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function VideoLesson({ module, theme }) {
  return (
    <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ position: "relative", minHeight: 170, padding: 18, display: "grid", alignContent: "center", justifyItems: "center", background: `linear-gradient(135deg, ${theme.accentMuted}, rgba(255,255,255,.04))` }}>
        <div style={{ width: 74, height: 74, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.accentBorder}`, background: theme.accentSoft, boxShadow: "0 16px 40px rgba(0,0,0,.28)" }}>
          <i className="ti ti-player-play-filled" style={{ color: theme.accentStrong, fontSize: 34 }} />
        </div>
        <div style={{ marginTop: 12, color: "#e8e8f0", fontSize: 13, fontWeight: 800, textAlign: "center" }}>{module.video.title}</div>
        <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 11 }}>{module.video.duration}</div>
        <div style={{ position: "absolute", left: 18, right: 18, bottom: 14, height: 5, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
          <div style={{ width: "62%", height: "100%", background: theme.accentStrong, borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 900, marginBottom: 7 }}>Video chapters</div>
        <div style={{ display: "grid", gap: 6 }}>
          {module.video.chapters.map((chapter, index) => (
            <div key={chapter} style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ca3af", fontSize: 11.5 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: theme.accentMuted, color: theme.accentStrong, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{index + 1}</span>
              {chapter}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DrawerCourseTeaser({ course, theme, onOpenCourse }) {
  const openCourse = (event) => {
    event.preventDefault();
    onOpenCourse?.();
  };

  return (
    <section style={{ marginTop: 10 }}>
      <button
        type="button"
        className="glass-card"
        data-testid="agentic-course-drawer-button"
        onClick={openCourse}
        onPointerUp={openCourse}
        style={{ width: "100%", border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, textAlign: "left", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
          <i className="ti ti-sparkles" />{course.kicker}
        </div>
        <h3 style={{ color: "#e8e8f0", fontSize: 15, lineHeight: 1.25, marginTop: 6 }}>{course.title}</h3>
        <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>Open the full course with images, video lessons, patterns, and practice tasks.</p>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.accentStrong, fontSize: 11, fontWeight: 900, marginTop: 10 }}>
          <i className="ti ti-arrow-right" />Open course
        </span>
      </button>
    </section>
  );
}

export default function AgenticUICourse({ theme, variant = "full", onOpenCourse }) {
  const course = AGENTIC_UI_COURSE;
  const isDrawer = variant === "drawer";

  if (isDrawer) {
    return <DrawerCourseTeaser course={course} theme={theme} onOpenCourse={onOpenCourse} />;
  }

  return (
    <section style={{ width: "100%", maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14 }}>
      <div className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: theme.accentText, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
              <i className="ti ti-sparkles" />{course.kicker}
            </div>
            <h1 style={{ color: "#e8e8f0", fontSize: 26, lineHeight: 1.15, marginTop: 7 }}>{course.title}</h1>
            <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.6, marginTop: 8, maxWidth: 680 }}>{course.summary}</p>
          </div>
          <div style={{ minWidth: 170, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 12, background: theme.accentMuted }}>
            <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 900 }}>Course Includes</div>
            <div style={{ color: "#e8e8f0", fontSize: 22, fontWeight: 900, marginTop: 4 }}>{course.modules.length}</div>
            <div style={{ color: "#9ca3af", fontSize: 11 }}>modules with images and video lessons</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
        {course.findings.map((finding) => (
          <div key={finding} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 11, display: "flex", alignItems: "flex-start", gap: 8, color: "#9ca3af", fontSize: 12, lineHeight: 1.5 }}>
            <i className="ti ti-check" style={{ color: theme.accentStrong, marginTop: 3, flexShrink: 0 }} />
            <span>{finding}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {course.modules.map((module, index) => {
          const lesson = course.lessons[index] || course.lessons[0];

          return (
            <article key={module.id} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                <div style={{ padding: 14, borderRight: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ color: theme.accentStrong, fontSize: 11, fontWeight: 900, marginBottom: 7 }}>{module.title}</div>
                  <h2 style={{ color: "#e8e8f0", fontSize: 18, lineHeight: 1.25 }}>{lesson.title.replace(/^\d+\.\s*/, "")}</h2>
                  <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{module.outcome}</p>
                  <div style={{ marginTop: 12, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, overflow: "hidden", background: `linear-gradient(135deg, ${theme.accentMuted}, rgba(255,255,255,.03))` }}>
                    <CourseVisual type={module.image.visual} theme={theme} />
                    <div style={{ padding: "0 12px 12px" }}>
                      <strong style={{ color: theme.accentText, fontSize: 12 }}>{module.image.title}</strong>
                      <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45, marginTop: 4 }}>{module.image.caption}</p>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 14, display: "grid", gap: 10 }}>
                  <VideoLesson module={module} theme={theme} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                    <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 10, background: theme.accentMuted }}>
                      <strong style={{ display: "block", color: theme.accentText, fontSize: 11, marginBottom: 4 }}>What this means</strong>
                      <span style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>{lesson.plainMeaning}</span>
                    </div>
                    <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10 }}>
                      <strong style={{ display: "block", color: theme.accentText, fontSize: 11, marginBottom: 4 }}>Practice task</strong>
                      <span style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>{module.practice}</span>
                    </div>
                  </div>
                  <ul style={{ paddingLeft: 16, color: "#6b7280", fontSize: 11.5, lineHeight: 1.5 }}>
                    {lesson.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
