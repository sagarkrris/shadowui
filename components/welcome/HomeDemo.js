import { useEffect, useState } from "react";
import { trackEvent } from "../../lib/analytics.mjs";

const TOUR_SCENES = [
  { eyebrow: "01 · PERSONALIZED HOME", title: "A prep workspace that starts with your role and stack.", description: "Set your target role, experience, and technologies once. InterviewIQ turns them into focused topics, practice prompts, and a daily plan.", icon: "ti-layout-dashboard", panels: ["Role-aware daily plan", "Interview modes & timers", "Saved workspace sync"] },
  { eyebrow: "02 · PRACTICE ROOMS", title: "Practice the exact interview format you need.", description: "Move between Mock Interview, Interview Ready Q&A, Scenario Bank, Company Prep, and production debugging without losing context.", icon: "ti-message-circle-question", panels: ["Mock interviews", "Production scenarios", "Company question packs"] },
  { eyebrow: "03 · TECHNICAL DEPTH", title: "Build stronger engineering fundamentals, visually.", description: "Use DSA Visual Lab for patterns and code walkthroughs, Java Digest for the curriculum, and System Design Studio for HLD and LLD practice.", icon: "ti-code", panels: ["DSA Visual Lab", "Java + Spring curriculum", "System Design Studio"] },
  { eyebrow: "04 · CAREER EVIDENCE", title: "Turn your experience into interview-ready proof.", description: "Analyze a resume and job description, collect STAR stories, track applications, and sharpen answers with structured feedback.", icon: "ti-briefcase-2", panels: ["Resume & JD analysis", "STAR story builder", "Application tracker"] },
  { eyebrow: "05 · PROGRESS THAT COMPOUNDS", title: "Know what to review next, not just what you finished.", description: "The progress dashboard, mastery map, spaced review queue, and prep reports turn practice history into an actionable next step.", icon: "ti-chart-line", panels: ["Mastery map", "Spaced repetition", "Readiness reports"] },
];

export default function HomeDemo({ onContinue, onSignIn }) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const scene = TOUR_SCENES[sceneIndex];

  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = window.setInterval(() => setSceneIndex((current) => (current + 1) % TOUR_SCENES.length), 4500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const selectScene = (index) => { setSceneIndex(index); setIsPlaying(false); trackEvent("product_tour_scene", { value: String(index + 1) }); };
  const togglePlayback = () => { setIsPlaying((playing) => !playing); trackEvent("product_tour_playback", { value: isPlaying ? "paused" : "played" }); };

  return (
    <section className="home-demo" aria-labelledby="home-demo-title">
      <div className="home-demo__intro">
        <span className="home-demo__eyebrow">INTERVIEWIQ · PRODUCT TOUR</span>
        <h1 id="home-demo-title">Everything you need for stronger interview preparation.</h1>
        <p>Take a visual tour of the practice rooms, technical curriculum, career tools, and progress system available in one workspace.</p>
      </div>
      <div className="home-demo__tour" aria-label="InterviewIQ product tour">
        <div className="home-demo__screen" aria-live={isPlaying ? "off" : "polite"}>
          <div className="home-demo__screen-top"><span><i className={`ti ${scene.icon}`} /> {scene.eyebrow}</span><span>{String(sceneIndex + 1).padStart(2, "0")} / {String(TOUR_SCENES.length).padStart(2, "0")}</span></div>
          <div className="home-demo__screen-copy"><span className="home-demo__screen-icon"><i className={`ti ${scene.icon}`} /></span><h2>{scene.title}</h2><p>{scene.description}</p></div>
          <div className="home-demo__panels">{scene.panels.map((panel, index) => <div key={panel} className="home-demo__panel"><span>{String(index + 1).padStart(2, "0")}</span><strong>{panel}</strong><i className="ti ti-arrow-up-right" /></div>)}</div>
        </div>
        <div className="home-demo__controls">
          <button type="button" className="home-demo__play" onClick={togglePlayback} aria-pressed={isPlaying}><i className={`ti ${isPlaying ? "ti-player-pause-filled" : "ti-player-play-filled"}`} /> {isPlaying ? "Pause tour" : "Play tour"}</button>
          <div className="home-demo__dots" role="tablist" aria-label="Product tour sections">{TOUR_SCENES.map((item, index) => <button key={item.eyebrow} type="button" role="tab" aria-selected={sceneIndex === index} aria-label={`Show ${item.title}`} className={sceneIndex === index ? "is-active" : ""} onClick={() => selectScene(index)} />)}</div>
          <span className="home-demo__control-copy">Self-paced visual walkthrough</span>
        </div>
      </div>
      <div className="home-demo__inventory" aria-label="Included InterviewIQ content">{TOUR_SCENES.flatMap((item) => item.panels).map((item) => <span key={item}><i className="ti ti-check" />{item}</span>)}</div>
      <div className="home-demo__footer"><button type="button" className="home-demo__primary" onClick={() => onContinue({})}>Build my personalized plan <span aria-hidden="true">→</span></button><button type="button" className="home-demo__text-button" onClick={() => onContinue({ skipped: true })}>Skip tour</button><span aria-hidden="true">·</span><button type="button" className="home-demo__text-button" onClick={onSignIn}>Already have an account? Sign in</button></div>
    </section>
  );
}
