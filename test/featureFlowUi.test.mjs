import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const companySource = readFileSync(new URL("../components/company/CompanyPrep.js", import.meta.url), "utf8");
const insightsSource = readFileSync(new URL("../components/welcome/PrepInsightsPanel.js", import.meta.url), "utf8");
const postAnswerToolsUrl = new URL("../components/chat/PostAnswerTools.js", import.meta.url);
const postAnswerToolsSource = existsSync(postAnswerToolsUrl) ? readFileSync(postAnswerToolsUrl, "utf8") : "";
const welcomeSource = readFileSync(new URL("../components/welcome/Welcome.js", import.meta.url), "utf8");
const progressBrainSource = readFileSync(new URL("../components/welcome/UnifiedProgressBrain.js", import.meta.url), "utf8");
const beginnerGuideSource = readFileSync(new URL("../components/BeginnerGuideBanner.js", import.meta.url), "utf8");
const practicePackSource = readFileSync(new URL("../components/welcome/PracticePack.js", import.meta.url), "utf8");
const careerToolkitSource = readFileSync(new URL("../components/welcome/CareerToolkit.js", import.meta.url), "utf8");
const chatPromptSource = readFileSync(new URL("../lib/chatPrompt.mjs", import.meta.url), "utf8");
const workspaceSource = readFileSync(new URL("../lib/workspaces.mjs", import.meta.url), "utf8");

test("mock interview timer is visible and switches to review-ready state", () => {
  assert.match(indexSource, /MOCK_ANSWER_SECONDS/);
  assert.match(indexSource, /mockTimerRemaining/);
  assert.match(indexSource, /Review ready/);
  assert.match(indexSource, /startAnswerTimer/);
});

test("company prep responds to selected drawer topic with focused prompts", () => {
  assert.doesNotMatch(indexSource, /preserveCompanyPrep: activeTab === "company"/);
  assert.match(indexSource, /createTopicSelectionNavigationState\(\{ activeTab \}\)/);
  assert.match(indexSource, /selectedCat={selectedCat}/);
  assert.match(indexSource, /selectedSub={selectedSub}/);
  assert.match(companySource, /Topic Focus/);
  assert.match(companySource, /focusedCompanyQuestions/);
  assert.match(companySource, /Refresh local bank/);
  assert.match(companySource, /Local refresh log/);
  assert.match(companySource, /Mark verified/);
});

test("progress dashboard is rendered from prep metrics", () => {
  assert.match(insightsSource, /Progress Dashboard/);
  assert.match(insightsSource, /buildPrepProgressDashboard/);
  assert.match(insightsSource, /completedMocks/);
  assert.match(insightsSource, /averageScore/);
});

test("session history and answer comparison headings are rendered", () => {
  const messageSource = readFileSync(new URL("../components/chat/MessageContent.js", import.meta.url), "utf8");

  assert.match(insightsSource, /Session History/);
  assert.match(insightsSource, /deriveMockSessionHistory/);
  assert.match(insightsSource, /Retry session/);
  assert.match(messageSource, /isComparisonHeading/);
  assert.match(messageSource, /message-comparison-heading/);
});

test("mock replay and daily prep plan are rendered from prep insights", () => {
  assert.match(insightsSource, /Mock Replay/);
  assert.match(insightsSource, /deriveMockReplayTimelines/);
  assert.match(insightsSource, /Replay mock/);
  assert.match(insightsSource, /Part-wise Replay/);
  assert.match(insightsSource, /replay\.steps/);
  assert.match(insightsSource, /replay\.actions/);
  assert.match(insightsSource, /Today's 30-Minute Plan/);
  assert.match(insightsSource, /buildDailyPrepPlan/);
  assert.match(insightsSource, /Start step/);
});

test("guided prep mission board is rendered from connected prep signals", () => {
  assert.match(insightsSource, /Guided Prep Mission/);
  assert.match(insightsSource, /buildGuidedPrepMissions/);
  assert.match(insightsSource, /missionBoard\.tasks/);
  assert.match(insightsSource, /Offer readiness impact/);
});

test("answer coach and resume bullet generator actions are wired into prep insights", () => {
  assert.match(insightsSource, /Answer Coach/);
  assert.match(insightsSource, /buildAnswerCoachActions/);
  assert.match(insightsSource, /answerCoachActions/);
  assert.match(insightsSource, /Make it concise/);
  assert.match(insightsSource, /Convert to STAR/);
  assert.match(insightsSource, /Resume Bullet Generator/);
  assert.match(insightsSource, /buildResumeBulletGenerator/);
  assert.match(insightsSource, /resumeBulletGenerator\.suggestions/);
  assert.match(insightsSource, /Before/);
  assert.match(insightsSource, /After/);
  assert.match(insightsSource, /onAction\(action\.prompt\)/);
  assert.match(insightsSource, /onAction\(suggestion\.prompt\)/);
});

test("answer rewrite studio and code explanation judge are visible after chat answers", () => {
  assert.match(indexSource, /PostAnswerTools/);
  assert.match(indexSource, /messages\.length > 0/);
  assert.match(postAnswerToolsSource, /Answer Rewrite Studio/);
  assert.match(postAnswerToolsSource, /buildAnswerRewriteStudio/);
  assert.match(postAnswerToolsSource, /answerRewriteStudio\.versions/);
  assert.match(postAnswerToolsSource, /Original answer/);
  assert.match(postAnswerToolsSource, /Concise version/);
  assert.match(postAnswerToolsSource, /Senior version/);
  assert.match(postAnswerToolsSource, /STAR version/);
  assert.match(postAnswerToolsSource, /Metrics-added version/);
  assert.match(postAnswerToolsSource, /Interviewer-ready final answer/);
  assert.match(postAnswerToolsSource, /Code Explanation Judge/);
  assert.match(postAnswerToolsSource, /buildCodeExplanationJudge/);
  assert.match(postAnswerToolsSource, /codeExplanationJudge\.checks/);
  assert.match(postAnswerToolsSource, /Invariant/);
  assert.match(postAnswerToolsSource, /Edge cases/);
  assert.match(postAnswerToolsSource, /Complexity/);
  assert.match(postAnswerToolsSource, /Trade-offs/);
});

test("company readiness score is wired into company prep", () => {
  assert.match(companySource, /Company Readiness/);
  assert.match(companySource, /buildCompanyReadinessScore/);
  assert.match(companySource, /readiness\.score/);
  assert.match(indexSource, /mockScores={mockScores}/);
  assert.match(indexSource, /messages={messages}/);
});

test("company prep room renders role context, JD gaps, story references, and final-day action", () => {
  assert.match(companySource, /buildCompanyPrepRoom/);
  assert.match(companySource, /Prep Room/);
  assert.match(companySource, /Role context/);
  assert.match(companySource, /JD Gaps/);
  assert.match(companySource, /Likely Questions/);
  assert.match(companySource, /Story References/);
  assert.match(companySource, /Final-Day Checklist/);
  assert.match(companySource, /Run final-day rehearsal/);
});

test("prep report export and keyboard power mode are wired into the UI", () => {
  assert.match(insightsSource, /buildPrepReportMarkdown/);
  assert.match(insightsSource, /buildPrepReportHtml/);
  assert.match(insightsSource, /downloadPrepReport/);
  assert.match(insightsSource, /printPrepReport/);
  assert.match(insightsSource, /Save PDF/);
  assert.match(insightsSource, /Markdown/);
  assert.match(indexSource, /Keyboard Power Mode/);
  assert.match(indexSource, /handlePowerKeys/);
  assert.match(indexSource, new RegExp('event\\.key === "/"'));
  assert.match(indexSource, /ctrlKey|metaKey/);
});

test("interview calibration modes and rubric sliders are wired into chat", () => {
  const scoreBadgeSource = readFileSync(new URL("../components/chat/ScoreBadge.js", import.meta.url), "utf8");
  const apiChatSource = readFileSync(new URL("../pages/api/chat.js", import.meta.url), "utf8");

  assert.match(indexSource, /INTERVIEW_MODES/);
  assert.match(indexSource, /interviewMode/);
  assert.match(indexSource, /Round Strategy Mode/);
  assert.match(indexSource, /Recruiter/);
  assert.match(indexSource, /Coding/);
  assert.match(indexSource, /System Design/);
  assert.match(indexSource, /Manager/);
  assert.match(indexSource, /Final/);
  assert.match(indexSource, /Real Pressure/);
  assert.match(indexSource, /interviewMode: interviewMode/);
  assert.match(indexSource, /roundStrategy/);
  assert.match(apiChatSource, /req\.body\?\.interviewMode/);
  assert.match(apiChatSource, /req\.body\?\.roundStrategy/);
  assert.match(apiChatSource, /req\.body\?\.interviewPanel/);
  assert.match(apiChatSource, /buildSystemPrompt\(profile, \{ interviewMode, roundStrategy, interviewPanel \}\)/);
  assert.match(scoreBadgeSource, /parseAnswerRubric/);
  assert.match(scoreBadgeSource, /type="range"/);
  assert.match(scoreBadgeSource, /Correctness/);
});

test("proof vault offer readiness heatmap and interview day pack are rendered", () => {
  assert.match(insightsSource, /Proof Vault/);
  assert.match(insightsSource, /deriveProofVaultStories/);
  assert.match(insightsSource, /story\.actions/);
  assert.match(insightsSource, /Offer Readiness/);
  assert.match(insightsSource, /buildOfferReadinessScore/);
  assert.match(insightsSource, /Answer Quality Heatmap/);
  assert.match(insightsSource, /deriveAnswerQualityHeatmap/);
  assert.match(insightsSource, /Interview Day Pack/);
  assert.match(insightsSource, /buildInterviewDayPack/);
});

test("weak spot radar is rendered from repeated prep insight signals", () => {
  assert.match(insightsSource, /Weak Spot Radar/);
  assert.match(insightsSource, /deriveWeakSpotRadar/);
  assert.match(insightsSource, /radar\.categories/);
  assert.match(insightsSource, /radar\.highestRisk/);
  assert.match(insightsSource, /Repeated signals/);
});

test("question memory and mastery map are wired into practice and prep insights", () => {
  assert.match(indexSource, /QUESTION_MEMORY_STORAGE_KEY/);
  assert.match(indexSource, /recordQuestionAttempt/);
  assert.match(welcomeSource, /questionMemory/);
  assert.match(practicePackSource, /memoryStatus/);
  assert.match(insightsSource, /Mastery Map/);
  assert.match(insightsSource, /buildMasteryMap/);
});

test("interview recording review is wired into the home workflow without persisting raw transcript", () => {
  assert.match(indexSource, /RecordingReviewModal/);
  assert.match(indexSource, /showRecordingReview/);
  assert.match(indexSource, /submitRecordingReview/);
  assert.match(welcomeSource, /Record Review/);
  assert.match(indexSource, /apiText/);
  assert.match(indexSource, /displayText/);
});

test("system design canvas is a first-class workspace with review actions", () => {
  const canvasSource = readFileSync(new URL("../components/system-design/SystemDesignCanvas.js", import.meta.url), "utf8");

  assert.match(indexSource, /SystemDesignCanvas/);
  assert.match(indexSource, /activeTab\s*===\s*"canvas"/);
  assert.match(workspaceSource, /System Canvas/);
  assert.match(indexSource, /startCanvasAction/);
  assert.match(canvasSource, /System Design Canvas/);
  assert.match(canvasSource, /Interactive Whiteboard/);
  assert.match(canvasSource, /Beginner System Design Context/);
  assert.match(canvasSource, /Request Lifecycle Studio/);
  assert.match(canvasSource, /Scenario Mode/);
  assert.match(canvasSource, /Interview Drill Mode/);
  assert.match(canvasSource, /Mermaid\/System Diagram Export/);
  assert.match(canvasSource, /API Gateway/);
  assert.match(canvasSource, /Controller/);
  assert.match(canvasSource, /DB Index/);
  assert.match(canvasSource, /Message Queue/);
  assert.match(canvasSource, /LLD Implementation Simulator/);
  assert.match(canvasSource, /Execution Trace/);
  assert.match(canvasSource, /DB Index Visualizer/);
  assert.match(canvasSource, /Failure Recovery Simulator/);
  assert.match(canvasSource, /Code Mapping View/);
  assert.match(canvasSource, /Practice Templates/);
  assert.match(canvasSource, /Evaluate Diagram/);
  assert.match(canvasSource, /buildCanvasReviewPrompt/);
  assert.match(canvasSource, /onAction/);
});

test("role pack builder and final interview report are visible from prep surfaces", () => {
  assert.match(careerToolkitSource, /Role Pack Builder/);
  assert.match(careerToolkitSource, /buildRolePack/);
  assert.match(insightsSource, /Final Interview Report/);
  assert.match(insightsSource, /rolePack/);
  assert.match(insightsSource, /masteryMap/);
  assert.match(insightsSource, /systemDesignCanvas/);
});

test("unified progress brain beginner mode and replay timeline are wired into prep home", () => {
  assert.match(welcomeSource, /UnifiedProgressBrain/);
  assert.match(progressBrainSource, /buildUnifiedPrepProgress/);
  assert.match(progressBrainSource, /prepProgressState/);
  assert.match(progressBrainSource, /Unified Progress Brain/);
  assert.match(progressBrainSource, /Beginner Guided Mode/);
  assert.match(progressBrainSource, /Practice Replay Timeline/);
  assert.match(progressBrainSource, /Beginner Path/);
  assert.match(progressBrainSource, /Export Daily Prep Plan/);
  assert.match(progressBrainSource, /Copy Plan/);
  assert.match(progressBrainSource, /Download/);
  assert.match(progressBrainSource, /repeat\(auto-fit, minmax\(min\(100%, 260px\), 1fr\)\)/);
  assert.match(progressBrainSource, /maxWidth:\s*"100%"/);
  assert.match(welcomeSource, /onBeginnerStepChange/);
  assert.match(welcomeSource, /onExportPlan/);
  assert.match(indexSource, /BEGINNER_GUIDED_MODE_KEY/);
  assert.match(indexSource, /PREP_PROGRESS_STORAGE_KEY/);
  assert.match(indexSource, /loadVersionedState/);
  assert.match(indexSource, /recordPrepActivity/);
  assert.match(indexSource, /recordBeginnerStep/);
  assert.match(indexSource, /recordWorkspaceActivity/);
  assert.match(indexSource, /onActivity={recordWorkspaceActivity}/);
  assert.match(indexSource, /exportPrepPlan/);
  assert.match(indexSource, /beginnerMode/);
  assert.match(indexSource, /setBeginnerMode/);
  assert.match(indexSource, /prepProgressState/);
});

test("beginner guide banner is reusable across upgraded workspaces", () => {
  const dsaSource = readFileSync(new URL("../components/dsa/DsaVisualLab.js", import.meta.url), "utf8");
  const scenarioSource = readFileSync(new URL("../components/scenario-bank/ScenarioBank.js", import.meta.url), "utf8");
  const javaSource = readFileSync(new URL("../components/java-digest/JavaDigest.js", import.meta.url), "utf8");
  const canvasSource = readFileSync(new URL("../components/system-design/SystemDesignCanvas.js", import.meta.url), "utf8");
  const designSource = readFileSync(new URL("../components/design-lab/DesignLab.js", import.meta.url), "utf8");

  assert.match(beginnerGuideSource, /Beginner Guided Mode/);
  assert.match(beginnerGuideSource, /currentStep/);
  assert.match(beginnerGuideSource, /onStepSelect/);
  assert.match(beginnerGuideSource, /aria-pressed/);
  assert.match(dsaSource, /BeginnerGuideBanner/);
  assert.match(dsaSource, /onActivity/);
  assert.match(scenarioSource, /BeginnerGuideBanner/);
  assert.match(scenarioSource, /onActivity/);
  assert.match(javaSource, /BeginnerGuideBanner/);
  assert.match(javaSource, /onActivity/);
  assert.match(canvasSource, /BeginnerGuideBanner/);
  assert.match(designSource, /BeginnerGuideBanner/);
  assert.match(companySource, /BeginnerGuideBanner/);
  assert.match(companySource, /onActivity/);
  assert.match(indexSource, /beginnerStep={prepProgressState\.beginnerStep}/);
  assert.match(indexSource, /onBeginnerStepChange={setBeginnerStep}/);
});

test("new progress panels avoid dense fixed columns on phone width", () => {
  assert.match(companySource, /repeat\(auto-fit, minmax\(min\(100%, 150px\), 1fr\)\)/);
  assert.match(progressBrainSource, /repeat\(auto-fit, minmax\(min\(100%, 160px\), 1fr\)\)/);
  assert.match(progressBrainSource, /flexWrap:\s*"wrap"/);
});

test("DSA Visual Lab is a first-class learning workspace", () => {
  const dsaLabSource = readFileSync(new URL("../components/dsa/DsaVisualLab.js", import.meta.url), "utf8");

  assert.match(indexSource, /DsaVisualLab/);
  assert.match(indexSource, /activeTab==="dsaLab"/);
  assert.match(workspaceSource, /DSA Lab/);
  assert.match(indexSource, /startDsaLabPractice/);
  assert.match(indexSource, /profile={candidateProfile \|\| profileDraft}/);
  assert.match(dsaLabSource, /DSA Visual Lab/);
  assert.match(dsaLabSource, /DSA Thinking System/);
  assert.match(dsaLabSource, /buildDsaThinkingSystem/);
  assert.match(dsaLabSource, /How To Approach/);
  assert.match(dsaLabSource, /Understand the problem/);
  assert.match(dsaLabSource, /Say brute force first/);
  assert.match(dsaLabSource, /Detect the pattern/);
  assert.match(dsaLabSource, /Build the invariant/);
  assert.match(dsaLabSource, /Dry run before code/);
  assert.match(dsaLabSource, /Write code skeleton/);
  assert.match(dsaLabSource, /Test like an interviewer/);
  assert.match(dsaLabSource, /Explain complexity/);
  assert.match(dsaLabSource, /Interview Pattern Theater/);
  assert.match(dsaLabSource, /Guided Mode/);
  assert.match(dsaLabSource, /Learning Path/);
  assert.match(dsaLabSource, /Pattern modules/);
  assert.match(dsaLabSource, /Most-Asked DSA Classroom/);
  assert.match(dsaLabSource, /Search problem/);
  assert.match(dsaLabSource, /Teacher board/);
  assert.match(dsaLabSource, /Solve it like this/);
  assert.match(dsaLabSource, /Frame Debugger/);
  assert.match(dsaLabSource, /Explain-Then-Code/);
  assert.match(dsaLabSource, /buildDsaExplainThenCodeCoach/);
  assert.match(dsaLabSource, /Explain approach/);
  assert.match(dsaLabSource, /Judge explanation/);
  assert.match(dsaLabSource, /Show code template/);
  assert.match(dsaLabSource, /Quiz edge cases/);
  assert.match(dsaLabSource, /explainThenCodeCoach\.judge\.checks/);
  assert.match(dsaLabSource, /Play/);
  assert.match(dsaLabSource, /Pause/);
  assert.match(dsaLabSource, /Speed/);
  assert.match(dsaLabSource, /State Panel/);
  assert.match(dsaLabSource, /Selected stack code/);
  assert.match(dsaLabSource, /Visualize/);
  assert.match(dsaLabSource, /Dry Run/);
  assert.match(dsaLabSource, /Practice as Mock/);
  assert.match(dsaLabSource, /Blind 75 Visual Track/);
  assert.match(dsaLabSource, /Featured 15/);
  assert.match(dsaLabSource, /All 75/);
  assert.match(dsaLabSource, /Pattern visualizer/);
  assert.match(dsaLabSource, /Edge cases/);
  assert.match(dsaLabSource, /Pattern Mastery Mode/);
  assert.match(dsaLabSource, /Mistake Replay/);
  assert.match(dsaLabSource, /Code Walkthrough/);
  assert.match(dsaLabSource, /Test Case Trainer/);
  assert.match(dsaLabSource, /Not Started/);
  assert.match(dsaLabSource, /Weak/);
  assert.match(dsaLabSource, /Mastered/);
  assert.match(dsaLabSource, /\/75 mastered/);
  assert.match(dsaLabSource, /Mark weak spot/);
  assert.match(dsaLabSource, /Reveal expected/);
});

test("DSA Visual Lab uses the main workspace scroller instead of trapping scroll", () => {
  const dsaLabSource = readFileSync(new URL("../components/dsa/DsaVisualLab.js", import.meta.url), "utf8");

  assert.match(indexSource, /className="chat-scroll"/);
  assert.match(indexSource, /minHeight:\s*0/);
  assert.match(dsaLabSource, /overflow:\s*"visible"/);
  assert.doesNotMatch(dsaLabSource, /overflowY:\s*blind75Filter === "all" \? "auto"/);
  assert.doesNotMatch(dsaLabSource, /maxHeight:\s*blind75Filter === "all" \? 340/);
});

test("PrepOS timeline skill graph and resume story matcher are connected to prep home", () => {
  assert.match(welcomeSource, /PrepOSDashboard/);
  assert.match(welcomeSource, /SmartPrepTimeline/);
  assert.match(insightsSource, /SkillGraphPanel/);
  assert.match(insightsSource, /ResumeStoryMatcherPanel/);
  assert.match(insightsSource, /Skill Graph/);
  assert.match(insightsSource, /Resume Story Matcher/);
});

test("AI Interview Panel Mode is wired into chat prompting", () => {
  assert.match(indexSource, /INTERVIEW_PANEL_OPTIONS/);
  assert.match(indexSource, /interviewPanel/);
  assert.match(indexSource, /AI Interview Panel Mode/);
  assert.match(indexSource, /Senior Engineer/);
  assert.match(indexSource, /Engineering Manager/);
  assert.match(indexSource, /System Design Architect/);
  assert.match(indexSource, /Bar Raiser/);
  assert.match(chatPromptSource, /buildInterviewPanelPrompt/);
});
