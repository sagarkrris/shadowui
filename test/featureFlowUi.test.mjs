import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const companySource = readFileSync(new URL("../components/company/CompanyPrep.js", import.meta.url), "utf8");
const insightsSource = readFileSync(new URL("../components/welcome/PrepInsightsPanel.js", import.meta.url), "utf8");

test("mock interview timer is visible and switches to review-ready state", () => {
  assert.match(indexSource, /MOCK_ANSWER_SECONDS/);
  assert.match(indexSource, /mockTimerRemaining/);
  assert.match(indexSource, /Review ready/);
  assert.match(indexSource, /startAnswerTimer/);
});

test("company prep responds to selected drawer topic with focused prompts", () => {
  assert.match(indexSource, /preserveCompanyPrep: activeTab === "company"/);
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
  assert.match(insightsSource, /Today's 30-Minute Plan/);
  assert.match(insightsSource, /buildDailyPrepPlan/);
  assert.match(insightsSource, /Start step/);
});

test("company readiness score is wired into company prep", () => {
  assert.match(companySource, /Company Readiness/);
  assert.match(companySource, /buildCompanyReadinessScore/);
  assert.match(companySource, /readiness\.score/);
  assert.match(indexSource, /mockScores={mockScores}/);
  assert.match(indexSource, /messages={messages}/);
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
  assert.match(indexSource, /interviewMode: interviewMode/);
  assert.match(indexSource, /roundStrategy/);
  assert.match(apiChatSource, /req\.body\?\.interviewMode/);
  assert.match(apiChatSource, /req\.body\?\.roundStrategy/);
  assert.match(apiChatSource, /buildSystemPrompt\(profile, \{ interviewMode, roundStrategy \}\)/);
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
