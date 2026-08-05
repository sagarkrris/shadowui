import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalsSource = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const messageContentSource = readFileSync(new URL("../components/chat/MessageContent.js", import.meta.url), "utf8");
const careerToolkitSource = readFileSync(new URL("../components/welcome/CareerToolkit.js", import.meta.url), "utf8");
const profileSetupSource = readFileSync(new URL("../components/welcome/ProfileSetup.js", import.meta.url), "utf8");
const settingsModalSource = readFileSync(new URL("../components/modals/SettingsModal.js", import.meta.url), "utf8");
const authHookSource = readFileSync(new URL("../hooks/useAuth.js", import.meta.url), "utf8");
const authApiSource = readFileSync(new URL("../pages/api/auth.js", import.meta.url), "utf8");
const apiObservabilitySource = readFileSync(new URL("../lib/apiObservability.mjs", import.meta.url), "utf8");
const persistenceSource = readFileSync(new URL("../lib/serverPersistence.mjs", import.meta.url), "utf8");

test("assistant part-wise answers render with readable section styling", () => {
  assert.match(messageContentSource, /message-part-heading/);
  assert.match(messageContentSource, /isPartHeading/);
  assert.match(globalsSource, /\.assistant-message/);
  assert.match(globalsSource, /\.message-part-heading/);
});

test("chat and form controls expose accessibility hooks", () => {
  assert.match(indexSource, /role="log"/);
  assert.match(indexSource, /aria-live="polite"/);
  assert.match(indexSource, /aria-label="Conversation messages"/);
  assert.match(indexSource, /aria-label="Message composer"/);
  assert.match(careerToolkitSource, /aria-label="Upload resume file"/);
  assert.match(globalsSource, /:focus-visible/);
});

test("mobile glass styling is tuned for smoother scrolling", () => {
  assert.match(indexSource, /className="chat-scroll"/);
  assert.match(globalsSource, /@media \(max-width: 760px\)/);
  assert.match(globalsSource, /backdrop-filter: blur\(8px\)/);
  assert.match(globalsSource, /@media \(max-width: 760px\)[\s\S]*\.icon-btn[\s\S]*backdrop-filter: blur\(8px\)/);
  assert.match(globalsSource, /-webkit-overflow-scrolling: touch/);
  assert.match(globalsSource, /prefers-reduced-motion: reduce/);
  assert.match(globalsSource, /prefers-contrast: more/);
});

test("mobile keyboard mode trims chrome around the composer", () => {
  assert.match(indexSource, /isKeyboardOpen/);
  assert.match(indexSource, /appShellHeight/);
  assert.match(indexSource, /isMobile && !isKeyboardOpen/);
  assert.match(indexSource, /interactive-widget=resizes-content/);
  assert.match(indexSource, /restorePageScroll/);
  assert.match(indexSource, /position:"fixed", inset:0/);
});

test("laptop header wraps controls instead of clipping the right edge", () => {
  assert.match(indexSource, /className="glass-chrome app-topbar"/);
  assert.match(indexSource, /className="header-title"/);
  assert.match(globalsSource, /@media \(min-width: 761px\) and \(max-width: 1439px\)[\s\S]*\.app-topbar[\s\S]*flex-wrap: wrap/);
  assert.match(indexSource, /@media \(min-width: 1440px\) and \(max-width: 1799px\)/);
  assert.match(globalsSource, /\.app-topbar \.header-profile-label/);
  assert.match(globalsSource, /@media \(min-width: 1440px\) and \(max-width: 1799px\)[\s\S]*\.app-topbar[\s\S]*flex-wrap: wrap/);
});

test("account modal stays centered and protects account form interactions", () => {
  assert.match(settingsModalSource, /height: "100dvh"/);
  assert.match(settingsModalSource, /height: "min\(820px, calc\(100dvh - 32px\)\)"/);
  assert.match(settingsModalSource, /settings-modal-surface/);
  assert.match(settingsModalSource, /settings-modal-copy/);
  assert.match(settingsModalSource, /settings-modal-account-email/);
  assert.match(settingsModalSource, /appearance === "light" \? "#17324d"/);
  assert.match(settingsModalSource, /aria-label=\{showPassword \? "Hide password" : "Show password"\}/);
  assert.match(settingsModalSource, /aria-busy=\{submitting\}/);
  assert.match(settingsModalSource, /resendingVerification/);
  assert.match(settingsModalSource, /Sending verification email/);
  assert.match(settingsModalSource, /verificationFeedback/);
  assert.match(settingsModalSource, /auth\.error/);
  assert.match(settingsModalSource, /aria-label="Password strength"/);
});

test("authenticated CSRF state is not replaced by a random token", () => {
  assert.match(authHookSource, /interviewiq_csrf=/);
  assert.match(authHookSource, /if \(cookieToken && !force\) \{ setCsrfToken\(cookieToken\); return cookieToken; \}/);
  assert.match(authHookSource, /cache: "no-store"/);
  assert.match(authApiSource, /existingToken && sessionToken && await verifyCsrfToken/);
  assert.match(authHookSource, /Email delivery is not configured on this deployment/);
  assert.match(authHookSource, /fetchCsrfToken\(\{ force: true \}\)/);
  assert.match(authHookSource, /interviewiq_csrf=; Max-Age=0/);
  assert.match(authHookSource, /const csrfUrl = `\/api\/auth\?action=csrf\$\{force \? `&refresh=\$\{Date\.now\(\)\}`/);
  assert.match(authHookSource, /catch \{ return response; \}/);
  assert.match(authApiSource, /auth\.csrf_rejected/);
  assert.match(authApiSource, /csrfDiagnostics/);
  assert.match(authApiSource, /auth\.email_delivery/);
  assert.match(authApiSource, /resendConfigured/);
  assert.match(authApiSource, /webhookConfigured/);
  assert.match(authApiSource, /action === "forgot"[\s\S]*auth\.email_delivery/);
  assert.match(apiObservabilitySource, /observabilityMeta/);
  assert.match(authApiSource, /rotateCsrfToken\(sessionToken, token\)/);
  assert.match(persistenceSource, /UPDATE interviewiq_sessions SET csrf_hash/);
});

test("profile setup avoids oversized sticky iOS keyboard spacers", () => {
  assert.match(profileSetupSource, /keyboardOpen/);
  assert.match(indexSource, /<ProfileSetup[\s\S]*keyboardOpen=\{isKeyboardOpen\}/);
  assert.doesNotMatch(indexSource, /padding-bottom:\s*180px/);
  assert.doesNotMatch(profileSetupSource, /scrollPaddingBottom:\s*160/);
});

test("profile setup uses a corporate onboarding entry", () => {
  assert.match(profileSetupSource, /corporate-entry/);
  assert.match(profileSetupSource, /Corporate interview prep/);
  assert.match(profileSetupSource, /Product dashboard preview/);
  assert.match(profileSetupSource, /How it works/);
  assert.match(profileSetupSource, /DSA Visual Lab/);
  assert.match(profileSetupSource, /Progress Brain/);
  assert.match(profileSetupSource, /Scenario Bank/);
  assert.match(profileSetupSource, /Company Prep/);
  assert.match(profileSetupSource, /Corporate trust/);
  assert.match(profileSetupSource, /Mobile app preview/);
  assert.match(profileSetupSource, /Personalize Prep/);
  assert.match(profileSetupSource, /Sign in and sync/);
  assert.match(indexSource, /openAuthSettings\("login"\)/);
  assert.match(profileSetupSource, /Sample plan generated from your profile inputs/);
  assert.match(profileSetupSource, /getPrimaryStack/);
  assert.doesNotMatch(profileSetupSource, /72%|58%|81%/);
});

test("public pages share the corporate light theme", () => {
  assert.match(globalsSource, /\.privacyPage[\s\S]*#f7f9fc/);
  assert.match(globalsSource, /\.privacyShell[\s\S]*box-shadow/);
  assert.match(globalsSource, /\.privacyPage h1[\s\S]*#102033/);
});

test("app shell uses restrained corporate glass surfaces", () => {
  assert.match(globalsSource, /Corporate glass surfaces/);
  assert.match(globalsSource, /#132238/);
  assert.match(globalsSource, /blur\(12px\) saturate\(1\.06\)/);
  assert.doesNotMatch(globalsSource, /saturate\(1\.35\)/);
  assert.match(indexSource, /THEME_PREFERENCE_STORAGE_KEY/);
  assert.match(indexSource, /prefers-color-scheme: dark/);
});

test("resume analyzer explains why the score is not perfect", () => {
  assert.match(careerToolkitSource, /Why this score/);
  assert.match(careerToolkitSource, /weakestScoreAreas/);
});
