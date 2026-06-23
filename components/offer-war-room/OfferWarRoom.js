import { useEffect, useMemo, useState } from "react";
import BeginnerGuideBanner from "../BeginnerGuideBanner";
import { loadVersionedState, saveVersionedState } from "../../lib/localStateStore.mjs";
import {
  OFFER_WAR_ROOM_STORAGE_KEY,
  OFFER_WAR_ROOM_STORAGE_VERSION,
  buildOfferWarRoomModel,
  createOfferWarRoomState,
} from "../../lib/offerWarRoom.mjs";

const CAREER_TOOLKIT_STORAGE_KEY = "interviewiq.careerToolkit.v1";

const wrap = {
  minWidth: 0,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const responsiveGrid = (minColumnWidth, gap = 10) => ({
  display: "grid",
  gap,
  gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minColumnWidth}px), 1fr))`,
  minWidth: 0,
});

function readToolkitState() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(CAREER_TOOLKIT_STORAGE_KEY) || "{}")?.state || {};
  } catch {
    return {};
  }
}

function ActionButton({ label, icon, tone, onClick }) {
  return (
    <button
      type="button"
      className="glass-button"
      onClick={onClick}
      style={{ alignItems: "center", border: `1px solid ${tone}55`, borderRadius: 7, color: "#f8fbff", cursor: "pointer", display: "inline-flex", fontSize: 10.8, fontWeight: 850, gap: 6, padding: "7px 10px" }}
    >
      <i className={`ti ${icon}`} style={{ color: tone }} />
      {label}
    </button>
  );
}

function Section({ title, eyebrow, accent, children }) {
  return (
    <section className="glass-card" style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, display: "grid", gap: 10, padding: 12 }}>
      <header style={wrap}>
        <div style={{ color: accent, fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>{eyebrow}</div>
        <h3 style={{ color: "#f8fbff", fontSize: 15.5, lineHeight: 1.25, marginTop: 4 }}>{title}</h3>
      </header>
      {children}
    </section>
  );
}

function OverviewPanel({ overview, accent }) {
  return (
    <section style={responsiveGrid(180, 10)}>
      <div style={{ background: "rgba(0,0,0,.16)", border: `1px solid ${accent}33`, borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
        <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Offer readiness</span>
        <strong style={{ color: accent, fontSize: 34, lineHeight: 1 }}>{overview.score}%</strong>
        <span style={{ color: "#dbeafe", fontSize: 11.4, lineHeight: 1.45 }}>{overview.label}</span>
      </div>
      <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
        <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Strongest signal</span>
        <strong style={{ color: "#a7f3d0", fontSize: 16 }}>{overview.strongest}</strong>
      </div>
      <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
        <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Weakest signal</span>
        <strong style={{ color: "#facc15", fontSize: 16 }}>{overview.weakest}</strong>
      </div>
      <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 12 }}>
        <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Recent mock avg</span>
        <strong style={{ color: "#c4b5fd", fontSize: 16 }}>{overview.recentAverage === null ? "New" : `${overview.recentAverage}/10`}</strong>
      </div>
    </section>
  );
}

function CompanyLaneCard({ lane, accent, onAction, onSelect }) {
  return (
    <article style={{ background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: "#f8fbff", fontSize: 12.5 }}>{lane.company}</strong>
        <button type="button" onClick={onSelect} style={{ background: "rgba(255,255,255,.035)", border: `1px solid ${accent}44`, borderRadius: 999, color: accent, cursor: "pointer", fontSize: 10.2, fontWeight: 900, padding: "4px 8px" }}>
          Use for loop
        </button>
      </div>
      <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.1, lineHeight: 1.45, margin: 0 }}>{lane.summary}</p>
      <ul style={{ ...wrap, color: "#dbeafe", display: "grid", fontSize: 11, gap: 5, lineHeight: 1.4, margin: 0, paddingLeft: 17 }}>
        {lane.focusAreas.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <ActionButton label="Daily plan" icon="ti-calendar-bolt" tone={accent} onClick={() => onAction(lane.dailyPrompt, { type: "offerWarRoomCompanyPlan", lane })} />
        <ActionButton label="Full loop" icon="ti-route" tone="#c4b5fd" onClick={() => onAction(lane.loopPrompt, { type: "offerWarRoomCompanyLoop", lane })} />
      </div>
    </article>
  );
}

function RoundCard({ round, onAction }) {
  const tone = round.pressure === "very high" ? "#fda4af" : round.pressure === "high" ? "#facc15" : "#8bd3ff";
  return (
    <article style={{ background: "rgba(0,0,0,.15)", border: `1px solid ${tone}33`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: "#f8fbff", fontSize: 12.4 }}>{round.round}</strong>
        <span style={{ color: tone, fontSize: 10.4, fontWeight: 900, textTransform: "uppercase" }}>{round.pressure}</span>
      </div>
      <p style={{ ...wrap, color: "#dbeafe", fontSize: 11, lineHeight: 1.45, margin: 0 }}>{round.objective}</p>
      <ActionButton label="Run this round" icon="ti-player-play" tone={tone} onClick={() => onAction(round.prompt, { type: "offerWarRoomRound", round })} />
    </article>
  );
}

function SimulatorRoundCard({ round, onAction }) {
  const tone = round.round === "Coding" || round.round === "System Design" ? "#c4b5fd" : "#8bd3ff";
  return (
    <article style={{ background: "rgba(0,0,0,.15)", border: `1px solid ${tone}33`, borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: "#f8fbff", fontSize: 12.4 }}>{`${round.slot}. ${round.round}`}</strong>
        <span style={{ color: tone, fontSize: 10.4, fontWeight: 900 }}>{round.durationMinutes}m</span>
      </div>
      <p style={{ ...wrap, color: "#dbeafe", fontSize: 11, lineHeight: 1.45, margin: 0 }}>{round.objective}</p>
      <p style={{ ...wrap, color: "#a7f3d0", fontSize: 10.8, lineHeight: 1.42, margin: 0 }}>{round.successSignal}</p>
      <ActionButton label="Run round live" icon="ti-player-play" tone={tone} onClick={() => onAction(round.prompt, { type: "offerWarRoomInterviewDayRound", round })} />
    </article>
  );
}

function StoryCard({ story, accent, onAction }) {
  return (
    <article style={{ background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: "#f8fbff", fontSize: 12.4 }}>{story.title}</strong>
        <span style={{ color: accent, fontSize: 10.4, fontWeight: 900 }}>{story.score}/10</span>
      </div>
      <span style={{ color: "#a7f3d0", fontSize: 10.5, fontWeight: 850 }}>{story.bestFor}</span>
      <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.1, lineHeight: 1.45, margin: 0 }}>{story.result}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <ActionButton label="Pressure test" icon="ti-flame" tone="#fda4af" onClick={() => onAction(story.pressurePrompt, { type: "offerWarRoomStoryPressure", story })} />
        {story.actions?.[0] ? (
          <ActionButton label={story.actions[0].label} icon="ti-message-circle-code" tone={accent} onClick={() => onAction(story.actions[0].prompt, { type: "offerWarRoomStoryUse", story })} />
        ) : null}
      </div>
    </article>
  );
}

function RevengeCard({ category, onAction }) {
  const tone = category.count >= 2 ? "#fda4af" : category.count === 1 ? "#facc15" : "#8bd3ff";
  return (
    <article style={{ background: "rgba(0,0,0,.15)", border: `1px solid ${tone}33`, borderRadius: 8, display: "grid", gap: 7, padding: 10 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
        <strong style={{ color: "#f8fbff", fontSize: 12.3 }}>{category.label}</strong>
        <span style={{ color: tone, fontSize: 10.3, fontWeight: 900 }}>{category.status}</span>
      </div>
      <p style={{ ...wrap, color: "#cbd5e1", fontSize: 10.9, lineHeight: 1.42, margin: 0 }}>{category.correction}</p>
      <ActionButton label="Revenge drill" icon="ti-target-arrow" tone={tone} onClick={() => onAction(category.prompt, { type: "offerWarRoomWeakSpot", category })} />
    </article>
  );
}

export default function OfferWarRoom({
  theme = {},
  profile = null,
  topics = [],
  weakSpots = [],
  mockScores = [],
  messages = [],
  selectedCat = "",
  selectedSub = "",
  beginnerMode = false,
  beginnerStep = "watch",
  onBeginnerStepChange,
  onAction,
  onActivity,
}) {
  const [warState, setWarState] = useState(() => createOfferWarRoomState());
  const [toolkitState, setToolkitState] = useState({});
  const accent = theme.accentStrong || "#8bd3ff";
  const model = useMemo(() => buildOfferWarRoomModel({
    state: warState,
    profile,
    topics,
    weakSpots,
    mockScores,
    messages,
    selectedCat,
    selectedSub,
    careerToolkitState: toolkitState,
  }), [warState, profile, topics, weakSpots, mockScores, messages, selectedCat, selectedSub, toolkitState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setWarState(loadVersionedState(window.localStorage, {
      key: OFFER_WAR_ROOM_STORAGE_KEY,
      version: OFFER_WAR_ROOM_STORAGE_VERSION,
      fallback: createOfferWarRoomState(),
      normalize: createOfferWarRoomState,
    }));
    setToolkitState(readToolkitState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    saveVersionedState(window.localStorage, {
      key: OFFER_WAR_ROOM_STORAGE_KEY,
      version: OFFER_WAR_ROOM_STORAGE_VERSION,
      value: warState,
      normalize: createOfferWarRoomState,
    });
  }, [warState]);

  const runAction = (prompt, metadata = {}) => {
    onActivity?.({
      workspaceId: "offerWarRoom",
      type: metadata?.type || "warRoom",
      label: "Started Offer War Room action",
      detail: metadata?.lane?.company || metadata?.round?.round || metadata?.story?.title || metadata?.category?.label || "Offer War Room action",
    });
    onAction?.(prompt, metadata);
  };

  return (
    <section className="glass-card" style={{ background: "linear-gradient(180deg, rgba(14,18,30,.82), rgba(7,10,18,.74))", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#eef4ff", display: "grid", gap: 12, minWidth: 0, padding: 14, width: "100%" }}>
      <BeginnerGuideBanner
        enabled={beginnerMode}
        accent={accent}
        currentStep={beginnerStep}
        onStepSelect={onBeginnerStepChange}
        detail="For Offer War Room: pick a company lane, run one full round, repair the highest-risk weak spot, pressure-test one story, then finish with the final-day plan."
      />

      <header style={wrap}>
        <div style={{ color: accent, fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>Offer War Room</div>
        <h2 style={{ color: "#f8fbff", fontSize: 20, lineHeight: 1.25, marginTop: 4 }}>Prep like a candidate trying to convert interviews into multiple offers</h2>
        <p style={{ color: "#9fb0c7", fontSize: 11.8, lineHeight: 1.55, marginTop: 6 }}>
          This room pulls your mock signal, weak spots, company targets, story proof, and speech quality into one operating surface. The point is not more content. The point is faster conversion from practice into offers.
        </p>
      </header>

      <OverviewPanel overview={model.overview} accent={accent} />

      <Section title={model.overview.mission} eyebrow="Company War Lanes" accent={accent}>
        <div style={responsiveGrid(220, 10)}>
          <label style={{ ...wrap, display: "grid", gap: 6 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Target companies</span>
            <textarea
              value={warState.companyTargets}
              onChange={(event) => setWarState((previous) => ({ ...previous, companyTargets: event.target.value }))}
              rows={2}
              className="glass-input"
              style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#f8fbff", fontSize: 12, lineHeight: 1.45, minHeight: 58, outline: "none", padding: 9, resize: "vertical", width: "100%" }}
            />
          </label>
          <label style={{ ...wrap, display: "grid", gap: 6 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Level calibration</span>
            <select value={warState.roleLevel} onChange={(event) => setWarState((previous) => ({ ...previous, roleLevel: event.target.value }))} className="glass-input" style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#f8fbff", fontSize: 12, outline: "none", padding: "8px 9px", width: "100%" }}>
              {["Junior", "Mid", "Senior", "Staff+"].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
        <div style={responsiveGrid(250, 10)}>
          {model.companyLanes.map((lane) => (
            <CompanyLaneCard
              key={lane.id}
              lane={lane}
              accent={accent}
              onAction={runAction}
              onSelect={() => setWarState((previous) => ({ ...previous, selectedCompany: lane.company }))}
            />
          ))}
        </div>
      </Section>

      <Section title={`${model.mockLoop.company} full loop`} eyebrow="Mock Interview Loops" accent={accent}>
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45, margin: 0 }}>Run the exact round you need, or walk through the whole sequence from recruiter to bar raiser with rising pressure.</p>
        <div style={responsiveGrid(220, 10)}>
          {model.mockLoop.rounds.map((round) => <RoundCard key={round.id} round={round} onAction={runAction} />)}
        </div>
      </Section>

      <Section title={`${model.interviewDaySimulator.company} interview day simulator`} eyebrow="Full Loop Rehearsal" accent={accent}>
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45, margin: 0 }}>
          Rehearse the whole day with continuity, fatigue, and rising pressure. Highest-risk weakness to watch: <span style={{ color: "#facc15", fontWeight: 850 }}>{model.interviewDaySimulator.weaknessToWatch}</span>
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          <ActionButton label="Run full day" icon="ti-route-2" tone={accent} onClick={() => runAction(model.interviewDaySimulator.fullDayPrompt, { type: "offerWarRoomInterviewDaySimulator" })} />
          <ActionButton label="Final day report" icon="ti-report-analytics" tone="#c4b5fd" onClick={() => runAction(model.interviewDaySimulator.finalReportPrompt, { type: "offerWarRoomInterviewDayReport" })} />
        </div>
        <div style={responsiveGrid(240, 10)}>
          {model.interviewDaySimulator.runbook.map((round) => <SimulatorRoundCard key={round.id} round={round} onAction={runAction} />)}
        </div>
      </Section>

      <Section title="Story Vault" eyebrow="Behavioral Proof" accent={accent}>
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.4, lineHeight: 1.45, margin: 0 }}>These are your best proof stories from prior answers. Pressure-test them until they survive metrics, ownership, trade-off, and follow-up scrutiny.</p>
        {model.storyVault.length ? (
          <div style={responsiveGrid(240, 10)}>
            {model.storyVault.map((story) => <StoryCard key={story.id} story={story} accent={accent} onAction={runAction} />)}
          </div>
        ) : (
          <p style={{ color: "#cbd5e1", fontSize: 11.3, lineHeight: 1.45, margin: 0 }}>No strong proof stories have been extracted yet. Score a few mocks and the vault will start filling itself.</p>
        )}
      </Section>

      <Section title={model.revengeMode.summary} eyebrow="Weak-Spot Revenge Mode" accent={accent}>
        <div style={responsiveGrid(220, 10)}>
          {model.revengeMode.categories.map((category) => <RevengeCard key={category.label} category={category} onAction={runAction} />)}
        </div>
        <ActionButton label="Run top revenge drill" icon="ti-flame" tone="#fda4af" onClick={() => runAction(model.revengeMode.revengePrompt, { type: "offerWarRoomRevengeTop", category: model.revengeMode.topCategory })} />
      </Section>

      <Section title="Speech-First Rehearsal" eyebrow="Voice & Delivery" accent={accent}>
        <div style={responsiveGrid(240, 10)}>
          <label style={{ ...wrap, display: "grid", gap: 6 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Question</span>
            <input
              type="text"
              value={warState.speechQuestion}
              onChange={(event) => setWarState((previous) => ({ ...previous, speechQuestion: event.target.value }))}
              className="glass-input"
              style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#f8fbff", fontSize: 12, outline: "none", padding: "8px 9px", width: "100%" }}
            />
          </label>
          <div style={{ background: "rgba(0,0,0,.16)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 6, padding: 10 }}>
            <span style={{ color: "#9fb0c7", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase" }}>Speech score</span>
            <strong style={{ color: accent, fontSize: 24 }}>{model.speechCoach.review.clarityScore}/100</strong>
            <span style={{ color: "#cbd5e1", fontSize: 11.1 }}>STAR: {model.speechCoach.review.starCoverage.length}/4 | Fillers: {model.speechCoach.review.fillerWords.total} | Metrics: {model.speechCoach.review.metrics.hasNumbers ? "Yes" : "No"}</span>
          </div>
        </div>
        <textarea
          value={warState.speechTranscript}
          onChange={(event) => setWarState((previous) => ({ ...previous, speechTranscript: event.target.value }))}
          placeholder="Paste or type the transcript of how you actually sound out loud. This is the quickest way to see if your answer is rambling, vague, or missing structure."
          className="glass-input"
          style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#f8fbff", fontSize: 12.4, lineHeight: 1.55, minHeight: 120, outline: "none", padding: 10, resize: "vertical", width: "100%" }}
        />
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.1, lineHeight: 1.45, margin: 0 }}>{model.speechCoach.review.displayText}</p>
        <ActionButton label="Coach this transcript" icon="ti-microphone" tone={accent} onClick={() => runAction(model.speechCoach.prompt, { type: "offerWarRoomSpeechCoach" })} />
      </Section>

      <Section title="Final-Day Mode" eyebrow="Interview Day Pack" accent={accent}>
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, margin: 0 }}>
          {model.dayPack.company} | {model.dayPack.role} {model.dayPack.round ? `| ${model.dayPack.round}` : ""}
        </p>
        <div style={responsiveGrid(220, 10)}>
          {model.dayPack.warmups.map((item) => (
            <article key={item.title} style={{ background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
              <strong style={{ color: "#f8fbff", fontSize: 12.3 }}>{item.title}</strong>
              <span style={{ color: accent, fontSize: 10.4, fontWeight: 900 }}>{item.minutes}m</span>
              <ActionButton label="Run warmup" icon="ti-player-play" tone={accent} onClick={() => runAction(item.prompt, { type: "offerWarRoomDayPack", item })} />
            </article>
          ))}
        </div>
        <div style={responsiveGrid(220, 9)}>
          {model.dayPack.questions.slice(0, 8).map((question) => (
            <div key={question} style={{ background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#dbeafe", fontSize: 11, lineHeight: 1.42, padding: 9 }}>
              {question}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Mission Control" eyebrow="Daily Operating System" accent={accent}>
        <p style={{ ...wrap, color: "#9fb0c7", fontSize: 11.3, lineHeight: 1.45, margin: 0 }}>{model.missionBoard.summary}</p>
        <div style={responsiveGrid(220, 10)}>
          {model.missionBoard.tasks.map((task) => (
            <article key={task.id} style={{ background: "rgba(0,0,0,.15)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, display: "grid", gap: 8, padding: 10 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 8, justifyContent: "space-between" }}>
                <strong style={{ color: "#f8fbff", fontSize: 12.3 }}>{task.title}</strong>
                <span style={{ color: accent, fontSize: 10.4, fontWeight: 900 }}>{task.minutes}m</span>
              </div>
              <span style={{ color: "#cbd5e1", fontSize: 11 }}>{task.focus}</span>
              <ActionButton label="Start mission" icon="ti-bolt" tone={accent} onClick={() => runAction(task.prompt, { type: "offerWarRoomMission", task })} />
            </article>
          ))}
        </div>
        {model.replay.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            {model.replay.slice(0, 3).map((item) => (
              <div key={item.id} style={{ borderLeft: `2px solid ${accent}`, display: "grid", gap: 3, paddingLeft: 9 }}>
                <span style={{ color: "#f8fbff", fontSize: 11.3, fontWeight: 850 }}>{item.question}</span>
                <span style={{ color: "#9fb0c7", fontSize: 10.9 }}>{item.gaps}</span>
                {item.actions?.[0] ? <ActionButton label="Replay this mock" icon="ti-history" tone="#c4b5fd" onClick={() => runAction(item.actions[0].prompt, { type: "offerWarRoomReplay", replay: item })} /> : null}
              </div>
            ))}
          </div>
        ) : null}
        <ActionButton label="Run today's 30-minute plan" icon="ti-calendar-bolt" tone={accent} onClick={() => model.dailyPlan.items[0] && runAction(model.dailyPlan.items[0].prompt, { type: "offerWarRoomDailyPlanStart" })} />
      </Section>
    </section>
  );
}
