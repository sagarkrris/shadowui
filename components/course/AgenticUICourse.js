import styles from './Course.module.css';
import LessonVisual, { CourseOrientation } from './LessonVisual';
import BeginnerCourse from "./BeginnerCourse";
import { AdvancedWorkshops, ScenarioInterviews } from "./AdvancedCourse";
import { ClassroomSession, InterviewStudio, CourseProject } from "./CourseLearning";
import { AGENTIC_UI_COURSE } from "../../lib/agenticCourse.mjs";

function TrackLabList({ labs, theme }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {labs.map((lab, index) => (
        <div key={lab.title} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10, background: "rgba(255,255,255,.025)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
            <div>
              <div style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 900 }}>Lab {index + 1}</div>
              <strong style={{ display: "block", color: "#e8e8f0", fontSize: 12.5, lineHeight: 1.35 }}>{lab.title}</strong>
            </div>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>{lab.deliverable}</p>
          <ol style={{ color: "#6b7280", fontSize: 11, lineHeight: 1.5, marginBottom: lab.codeSnippet ? 8 : 0 }}>
            {lab.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          {lab.codeSnippet && (
            <pre style={{ margin: 0, border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 9, overflowX: "auto", background: "rgba(0,0,0,.3)", color: "#d1fae5", fontSize: 10.5, lineHeight: 1.45 }}>
              <code>{lab.codeSnippet}</code>
            </pre>
          )}
        </div>
      ))}
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
        <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>Teacher-led lessons, student build labs, debriefs, and detailed interview practice.</p>
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
    <div className={`workspace-content ${styles.course}`}><section style={{ width: "100%", maxWidth: 1180, margin: "0 auto", display: "grid", gap: 14 }}>
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
            <div style={{ color: "#e8e8f0", fontSize: 22, fontWeight: 900, marginTop: 4 }}>{course.modules.length} + {course.stackTracks.length}</div>
            <div style={{ color: "#9ca3af", fontSize: 11 }}>modules plus stack implementation tracks</div>
          </div>
        </div>
      </div>

      <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 14 }}>
        <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Classroom format</div>
        <p style={{ color: "#e8e8f0", fontSize: 13, fontWeight: 800, marginTop: 5 }}>{course.classroom.format}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10, marginTop: 10 }}>
          {[['Teacher', course.classroom.teacherRole], ['Student', course.classroom.studentRole]].map(([role, detail]) => <div key={role} style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 10 }}><strong style={{ color: theme.accentText, fontSize: 11 }}>{role} role</strong><p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 5 }}>{detail}</p></div>)}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, alignItems: "start" }}>
        {course.findings.map((finding) => (
          <div key={finding} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 11, display: "flex", alignItems: "flex-start", gap: 8, color: "#9ca3af", fontSize: 12, lineHeight: 1.5 }}>
            <i className="ti ti-check" style={{ color: theme.accentStrong, marginTop: 3, flexShrink: 0 }} />
            <span>{finding}</span>
          </div>
        ))}
      </div>

      <nav aria-label="Course learning paths" className="glass-card" style={{ padding: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <a href="#beginner-genai" style={{ color: theme.accentText }}>Generative AI for Developers</a>
        <a href="#beginner-rag" style={{ color: theme.accentText }}>RAG from Scratch</a>
        <a href="#rag-playground" style={{ color: theme.accentText }}>RAG playground</a>
        <a href="#module-llm-foundations" style={{ color: theme.accentText }}>6 core modules</a>
        <a href="#advanced-workshops" style={{ color: theme.accentText }}>6 advanced workshops</a>
        <a href="#scenario-interviews" style={{ color: theme.accentText }}>Timed scenario interviews</a>
      </nav>
      <CourseOrientation />
      <BeginnerCourse theme={theme} />
      <CourseProject sessions={course.classroomSessions} references={course.references} theme={theme} />

      <div style={{ display: "grid", gap: 14 }}>
        {course.modules.map((module) => {
          const lesson = course.lessons.find(item => item.id === module.lessonId);
          const session = course.classroomSessions.find(item => item.id === module.sessionId);

          return (
            <article id={module.id} key={module.id} className="glass-card" style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)" }}>
                <div style={{ padding: 14, borderRight: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ color: theme.accentStrong, fontSize: 11, fontWeight: 900, marginBottom: 7 }}>{module.title}</div>
                  <h2 style={{ color: "#e8e8f0", fontSize: 18, lineHeight: 1.25 }}>{lesson.title.replace(/^\d+\.\s*/, "")}</h2>
                  <LessonVisual lessonId={session.id} />
                  <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.55, marginTop: 8 }}>{module.outcome}</p>
                </div>

                <div style={{ padding: 14, display: "grid", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                    <div style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 10, background: theme.accentMuted }}>
                      <strong style={{ display: "block", color: theme.accentText, fontSize: 11, marginBottom: 4 }}>What this means</strong>
                      <span style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.45 }}>{lesson.plainMeaning}</span>
                    </div>
                  </div>
                  <ClassroomSession session={session} theme={theme} />
                  <ul style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.5 }}>
                    {lesson.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ color: "#e8e8f0", fontSize: 18, lineHeight: 1.25 }}>Stack Implementation Tracks</h2>
            <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.55, marginTop: 5 }}>
              Optional extensions after the core project: port the contract to Java / Spring Boot or another stack. These snippets are sketches, not complete applications.
            </p>
          </div>
          <span style={{ color: theme.accentStrong, border: `1px solid ${theme.accentBorder}`, borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900 }}>
            Hands-on labs
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, alignItems: "start" }}>
          {course.stackTracks.map((track) => (
            <article key={track.id} className="glass-card" style={{ border: `1px solid ${track.id === "java-spring" ? theme.accentBorder : "rgba(255,255,255,.08)"}`, borderRadius: 8, padding: 12, display: "grid", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 7 }}>
                  <span style={{ color: theme.accentStrong, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{track.level}</span>
                  {track.id === "java-spring" && <span style={{ color: "#111827", background: theme.accentStrong, borderRadius: 999, padding: "3px 7px", fontSize: 10, fontWeight: 900 }}>Recommended</span>}
                </div>
                <h3 style={{ color: "#e8e8f0", fontSize: 15.5, lineHeight: 1.25 }}>{track.title}</h3>
                <p style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.5, marginTop: 6 }}>{track.bestFor}</p>
                <p style={{ color: theme.accentText, fontSize: 11.5, lineHeight: 1.45, marginTop: 8 }}>{track.outcome}</p>
              </div>
              <TrackLabList labs={track.labs} theme={theme} />
            </article>
          ))}
        </div>
      </section>

      <AdvancedWorkshops theme={theme} />
      <InterviewStudio questions={course.interviewQuestions} theme={theme} />
      <ScenarioInterviews theme={theme} />

      <section className="glass-card" style={{ border: `1px solid ${theme.accentBorder}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <div style={{ color: theme.accentText, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Capstone</div>
            <h2 style={{ color: "#e8e8f0", fontSize: 20, lineHeight: 1.25, marginTop: 5 }}>{course.capstone.title}</h2>
            <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.6, marginTop: 7, maxWidth: 760 }}>{course.capstone.summary}</p>
          </div>
          <span style={{ color: "#111827", background: theme.accentStrong, borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900 }}>Build project</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 11 }}>
            <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 8 }}>Milestones</strong>
            <ol style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.55 }}>
              {course.capstone.milestones.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,.07)", borderRadius: 8, padding: 11 }}>
            <strong style={{ display: "block", color: theme.accentText, fontSize: 12, marginBottom: 8 }}>Done When</strong>
            <ul style={{ color: "#9ca3af", fontSize: 11.5, lineHeight: 1.55 }}>
              {course.capstone.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>
    </section></div>
  );
}
