import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalsSource = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");
const indexSource = readFileSync(new URL("../pages/index.js", import.meta.url), "utf8");
const messageContentSource = readFileSync(new URL("../components/chat/MessageContent.js", import.meta.url), "utf8");
const typingDotsSource = readFileSync(new URL("../components/chat/TypingDots.js", import.meta.url), "utf8");
const javaDigestSource = readFileSync(new URL("../components/java-digest/JavaDigest.js", import.meta.url), "utf8");
const careerToolkitSource = readFileSync(new URL("../components/welcome/CareerToolkit.js", import.meta.url), "utf8");
const profileSetupSource = readFileSync(new URL("../components/welcome/ProfileSetup.js", import.meta.url), "utf8");
const settingsModalSource = readFileSync(new URL("../components/modals/SettingsModal.js", import.meta.url), "utf8");
const authHookSource = readFileSync(new URL("../hooks/useAuth.js", import.meta.url), "utf8");
const cloudStateSyncSource = readFileSync(new URL("../hooks/useCloudStateSync.js", import.meta.url), "utf8");
const authApiSource = readFileSync(new URL("../pages/api/auth.js", import.meta.url), "utf8");
const accountApiSource = readFileSync(new URL("../pages/api/account.js", import.meta.url), "utf8");
const apiObservabilitySource = readFileSync(new URL("../lib/apiObservability.mjs", import.meta.url), "utf8");
const persistenceSource = readFileSync(new URL("../lib/serverPersistence.mjs", import.meta.url), "utf8");
const toastSource = readFileSync(new URL("../components/Toast.js", import.meta.url), "utf8");
const authPageSource = readFileSync(new URL("../components/auth/AuthPage.js", import.meta.url), "utf8");
const welcomeSource = readFileSync(new URL("../components/welcome/Welcome.js", import.meta.url), "utf8");
const interviewReadySource = readFileSync(new URL("../components/interview-ready/InterviewReadyQA.js", import.meta.url), "utf8");

test("assistant part-wise answers render with readable section styling", () => {
  assert.match(messageContentSource, /message-part-heading/);
  assert.match(messageContentSource, /isPartHeading/);
  assert.match(globalsSource, /\.assistant-message/);
  assert.match(globalsSource, /\.message-part-heading/);
  assert.match(globalsSource, /theme-light \.assistant-message \.message-part-heading[\s\S]*?#1d5f91/);
  assert.match(globalsSource, /theme-light \.assistant-message \.message-comparison-heading[\s\S]*?#17324d/);
});

test("light workspace normalizes shared inline semantic text colors", () => {
  assert.match(globalsSource, /color: rgb\(167, 243, 208[\s\S]*?#166534/);
  assert.match(globalsSource, /color: rgb\(191, 219, 254[\s\S]*?#1d4f73/);
  assert.match(globalsSource, /color: rgb\(196, 181, 253[\s\S]*?#5b3f91/);
  assert.match(globalsSource, /color: rgb\(250, 204, 21[\s\S]*?#9a6700/);
  assert.match(globalsSource, /color: rgb\(252, 165, 165[\s\S]*?#b42318/);
});

test("light workspace keeps chat code samples readable", () => {
  assert.match(globalsSource, /theme-light \.code-block[\s\S]*?#f8fbff/);
  assert.match(globalsSource, /theme-light \.code-body[\s\S]*?#17324d/);
  assert.match(globalsSource, /theme-light \.inline-code[\s\S]*?#1d4f73/);
});

test("light workspace keeps the answer-generation status readable before streaming begins", () => {
  assert.match(typingDotsSource, /typing-status-label/);
  assert.match(typingDotsSource, /typing-status-detail/);
  assert.match(typingDotsSource, /typing-status-chip/);
  assert.match(globalsSource, /theme-light \.typing-status-label \{ color: #17324d; \}/);
  assert.match(globalsSource, /theme-light \.typing-status-detail \{ color: #475569; \}/);
  assert.match(globalsSource, /theme-light \.typing-status-chip[\s\S]*?#1d4f73/);
});

test("Java Digest renders curated refresher answers as structured study content", () => {
  assert.match(javaDigestSource, /java-digest-refresher-answer/);
  assert.match(javaDigestSource, /<MessageContent content=\{entry\.answer\}/);
  assert.match(globalsSource, /\.java-digest-refresher-answer \.code-body/);
});

test("light workspace converts dark instructional sub-panels before darkening their text", () => {
  assert.match(globalsSource, /theme-light \.dsa-visual-lab \[style\*="rgba\(0, 0, 0"\][\s\S]*?#f5f9fd/);
  assert.match(globalsSource, /theme-light \.system-design-canvas \[style\*="rgba\(0, 0, 0"\][\s\S]*?#f5f9fd/);
  assert.match(globalsSource, /theme-light \.post-answer-tools \[style\*="rgba\(0, 0, 0"\][\s\S]*?#f5f9fd/);
});

test("light workspace keeps Scenario Bank trap cards readable", () => {
  const styles = readFileSync(new URL("../styles/globals.css", import.meta.url), "utf8");
  const scenarioBank = readFileSync(new URL("../components/scenario-bank/ScenarioBank.js", import.meta.url), "utf8");

  assert.match(scenarioBank, /scenario-bank/);
  assert.match(styles, /\.theme-light \.scenario-bank \[style\*="rgba\(0, 0, 0"\]/);
  assert.match(styles, /\.theme-light \.scenario-bank \[style\*="color: rgb\(254, 243, 199"\]/);
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
  assert.match(indexSource, /focusMode/);
  assert.match(indexSource, /cloud-sync-status/);
  assert.match(globalsSource, /\.focus-mode \.welcome-secondary/);
});

test("workspace loading and navigation preserve user context", () => {
  assert.match(indexSource, /dashboard-skeleton/);
  assert.match(indexSource, /scrollPositionsRef/);
  assert.match(indexSource, /cloudStatus/);
  assert.match(indexSource, /data-tooltip="Topics"/);
  assert.match(globalsSource, /composer-footer/);
  assert.match(indexSource, /FOCUS_MODE_STORAGE_KEY/);
  assert.match(indexSource, /Saved on this device/);
  assert.match(indexSource, /Local prep: \{userPrepLabel\}/);
  assert.match(indexSource, /Local prep profile: \$\{userPrepLabel\}/);
  assert.match(indexSource, /Account & settings/);
  assert.match(indexSource, /Back to today/);
  assert.match(globalsSource, /\.dashboard-section-nav/);
  assert.match(globalsSource, /welcome-secondary > \.dashboard-section/);
  assert.match(welcomeSource, /IntersectionObserver/);
  assert.match(welcomeSource, /aria-current=\{activeSection/);
});

test("auth and destructive account actions provide inline guidance", () => {
  assert.match(authPageSource, /Enter your first and last name/);
  assert.match(authPageSource, /Use a password with at least 12 characters/);
  assert.match(settingsModalSource, /Type DELETE to confirm/);
  assert.match(settingsModalSource, /Confirm permanent account deletion/);
  assert.match(indexSource, /focusModeHint/);
  assert.match(indexSource, /pointerdown/);
  assert.match(indexSource, /ai-progress-status/);
  assert.match(globalsSource, /phone-bottom-nav section/);
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
  assert.match(settingsModalSource, /aria-label="First name"/);
  assert.match(settingsModalSource, /aria-label="Last name"/);
  assert.doesNotMatch(settingsModalSource, /Verification email sent\. Check your inbox and spam folder before using protected features/);
  assert.match(settingsModalSource, /auth\.error/);
  assert.match(settingsModalSource, /aria-label="Password strength"/);
  assert.match(settingsModalSource, /onDeleteSuccess/);
  assert.match(accountApiSource, /type: "account-deleted"/);
  assert.match(accountApiSource, /emailDelivery/);
  assert.match(settingsModalSource, /Delete account permanently/);
  assert.match(settingsModalSource, /Deleting account/);
  assert.match(settingsModalSource, /accountFeedback/);
});

test("feedback and empty states remain accessible and readable", () => {
  assert.match(toastSource, /role=\{type === "error" \? "alert" : "status"\}/);
  assert.match(globalsSource, /\.empty-state/);
  assert.match(globalsSource, /theme-light \.empty-state p/);
  assert.match(authHookSource, /Your security session expired/);
});

test("cloud hydration does not replay a success toast on every refresh", () => {
  assert.doesNotMatch(indexSource, /Synced your workspace from your account/);
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
  assert.match(authHookSource, /SECURITY_SETUP_UNAVAILABLE/);
  assert.match(authApiSource, /auth\.csrf_rejected/);
  assert.match(authApiSource, /csrfDiagnostics/);
  assert.match(authApiSource, /auth\.email_delivery/);
  assert.match(authApiSource, /resendConfigured/);
  assert.match(authApiSource, /webhookConfigured/);
  assert.match(authApiSource, /action === "forgot"[\s\S]*auth\.email_delivery/);
  assert.match(apiObservabilitySource, /observabilityMeta/);
  assert.match(authApiSource, /rotateCsrfToken\(sessionToken, token\)/);
  assert.match(authApiSource, /auth\.stale_session_recovered/);
  assert.match(authApiSource, /staleSessionRecovered/);
  assert.match(authApiSource, /rateLimitBucket = isBootstrapAction \? "bootstrap" : "credential"/);
  assert.match(persistenceSource, /UPDATE interviewiq_sessions SET csrf_hash/);
  assert.match(authHookSource, /await fetchCsrfToken\(\)\.catch\(\(\) => ""\);[\s\S]*setUser\(payload\.user \|\| null\)/);
  assert.match(authHookSource, /const refreshCsrfToken = useCallback\(\(\) => fetchCsrfToken\(\{ force: true \}\)/);
  assert.match(authHookSource, /action=logout[\s\S]*response\.status === 403/);
  assert.match(authHookSource, /if \(!response\.ok\)[\s\S]*throw error/);
  assert.match(authHookSource, /clearPrivateLocalData\(\);[\s\S]*setUser\(null\)/);
  assert.match(authApiSource, /action === "logout"[\s\S]*\$\{CSRF_COOKIE\}=;/);
  assert.match(cloudStateSyncSource, /response\.status === 403[\s\S]*refreshCsrfToken/);
  assert.match(cloudStateSyncSource, /saveSnapshot\(await refreshCsrfToken\(\), true\)/);
  assert.match(indexSource, /refreshCsrfToken: auth\.refreshCsrfToken/);
  assert.match(indexSource, /const handleCloudSyncError = useCallback\(/);
  assert.match(indexSource, /onError: handleCloudSyncError/);
  assert.doesNotMatch(indexSource, /onError: \(\) => showToast\("Cloud sync is temporarily unavailable/);
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

test("verification links render a branded recovery page", () => {
  assert.match(authApiSource, /Email verified/);
  assert.match(authApiSource, /Return to InterviewIQ/);
  assert.match(authApiSource, /Verification link unavailable/);
  assert.match(authApiSource, /meta name=\"viewport\"/);
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

test("Interview Ready Q&A supports custom questions and answer handoff actions", () => {
  assert.match(interviewReadySource, /Ask your own question/);
  assert.match(interviewReadySource, /Generate answer/);
  assert.match(interviewReadySource, /interviewReadyCustomQuestion/);
  assert.match(interviewReadySource, /direct answer first/);
  assert.match(interviewReadySource, /Copy answer/);
  assert.match(interviewReadySource, /Clear filters/);
  assert.match(interviewReadySource, /Answer style presets/);
  assert.match(interviewReadySource, /interviewiq_interview_ready_bookmarks/);
  assert.match(interviewReadySource, /Answer was useful/);
  assert.match(interviewReadySource, /Compact mode/);
  assert.match(interviewReadySource, /aria-pressed=\{compactMode\}/);
  assert.match(interviewReadySource, /zoom: textScale/);
  assert.match(interviewReadySource, /TEXT_SCALE_STEP = 0\.1/);
  assert.match(interviewReadySource, /Text \{Math\.round\(textScale \* 100\)\}%/);
  assert.match(interviewReadySource, /event.key.toLowerCase\(\) === "k"/);
  assert.match(interviewReadySource, /Privacy: practice drafts/);
  assert.match(interviewReadySource, /Export collection/);
  assert.match(interviewReadySource, /Import collection/);
  assert.match(interviewReadySource, /answerHistory/);
  assert.match(interviewReadySource, /HighlightedText/);
  assert.match(interviewReadySource, /Offline mode/);
  assert.match(interviewReadySource, /Regenerate last answer/);
  assert.match(interviewReadySource, /Clear all/);
  assert.match(interviewReadySource, /Practice progress/);
  assert.match(interviewReadySource, /Show saved only/);
  assert.match(interviewReadySource, /AI-generated coaching content/);
  assert.match(interviewReadySource, /Increase text size/);
  assert.match(interviewReadySource, /Send feedback/);
  assert.match(globalsSource, /:focus-visible/);
});
