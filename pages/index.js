import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import CompanyPrep from "../components/company/CompanyPrep";
import MessageContent from "../components/chat/MessageContent";
import PostAnswerTools from "../components/chat/PostAnswerTools";
import ScoreBadge from "../components/chat/ScoreBadge";
import TechBackground from "../components/TechBackground";
import TypingDots from "../components/chat/TypingDots";
import CommandPalette from "../components/app/CommandPalette";
import { DesktopWorkspaceNav, MobileBottomNav, TabletWorkspaceMenu } from "../components/app/WorkspaceNav";
const AgenticUICourse = dynamic(() => import("../components/course/AgenticUICourse"), { ssr: false });
const DesignLab = dynamic(() => import("../components/design-lab/DesignLab"), { ssr: false });
const DsaVisualLab = dynamic(() => import("../components/dsa/DsaVisualLab"), { ssr: false });
const InterviewReadyQA = dynamic(() => import("../components/interview-ready/InterviewReadyQA"), { ssr: false });
const JavaDigest = dynamic(() => import("../components/java-digest/JavaDigest"), { ssr: false });
const OfferWarRoom = dynamic(() => import("../components/offer-war-room/OfferWarRoom"), { ssr: false });
const ScenarioBank = dynamic(() => import("../components/scenario-bank/ScenarioBank"), { ssr: false });
import RecordingReviewModal from "../components/modals/RecordingReviewModal";
import ScreenModal from "../components/modals/ScreenModal";
import AboutModal from "../components/modals/AboutModal";
import SettingsModal from "../components/modals/SettingsModal";
const SystemDesignCanvas = dynamic(() => import("../components/system-design/SystemDesignCanvas"), { ssr: false });
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import VoiceBar from "../components/VoiceBar";
import ProfileSetup from "../components/welcome/ProfileSetup";
import Welcome from "../components/welcome/Welcome";
import { buildInterviewRecordingReviewPrompt } from "../lib/interviewRecordingReview.mjs";
import { INTERVIEW_PANELISTS, normalizeInterviewPanel } from "../lib/interviewPanel.mjs";
import { deriveWeakSpots } from "../lib/companyPrep.mjs";
import { createHomeNavigationState, createTopicSelectionNavigationState } from "../lib/homeNavigation.mjs";
import { loadVersionedState, saveVersionedState } from "../lib/localStateStore.mjs";
import { buildUserPrepLabel, getDisplayName, getStackGreeting } from "../lib/personalization.mjs";
import { deriveMockScores } from "../lib/prepCoach.mjs";
import {
  PREP_PROGRESS_STORAGE_KEY,
  PREP_PROGRESS_STORAGE_VERSION,
  createPrepProgressState,
  recordBeginnerStep,
  recordPrepActivity,
} from "../lib/prepProgressBrain.mjs";
import { getPrepLabel, getRecommendedTopics } from "../lib/prepTopics.mjs";
import { loadQuestionMemory, recordQuestionAttempt } from "../lib/questionMemory.mjs";
import { DEFAULT_PROFILE, DIFFS } from "../lib/prompts.mjs";
import { buildAiFollowUpPrompt, buildAiRetryRequest } from "../lib/aiGateway.mjs";
import { buildCommandPaletteActions } from "../lib/commandPalette.mjs";
import { resolveVersionedStateConflict } from "../lib/localStateStore.mjs";
import { createSessionEnvelope, createSessionSnapshot, exportSessionSnapshot, importSessionSnapshot, loadSessionEnvelope, loadSessionSnapshot, saveSessionSnapshot, SESSION_STORAGE_KEY } from "../lib/sessionPersistence.mjs";
import { createSystemDesignCanvasState } from "../lib/systemDesignCanvas.mjs";
import { getTechTheme, getWorkspaceTheme } from "../lib/techTheme.mjs";
import { THEME_PREFERENCE_STORAGE_KEY, normalizeThemePreference, resolveThemeMode } from "../lib/themePreference.mjs";
import { canUseChatComposer, canUseInterviewTools, canUsePrepTopics, shouldShowCodeTools } from "../lib/uiVisibility.mjs";
import { getAppShellHeight, getStableViewportHeight, getVisibleViewportHeight, isCompactViewport, isVirtualKeyboardOpen } from "../lib/viewportMode.mjs";
import { buildSpeechTranscript, createVoiceSessionReport, getVoiceErrorMessage, getVoiceSupport } from "../lib/voiceSupport.mjs";
import { buildWorkspaceActionDisplayText } from "../lib/workspaceActionDisplay.mjs";
import { getWorkspaceById, getWorkspaceTitle, listDesktopWorkspaces, listMobileWorkspaces, normalizeWorkspaceTab } from "../lib/workspaces.mjs";
import { useInterviewSession } from "../hooks/useInterviewSession";
import { useWorkspaceNavigation } from "../hooks/useWorkspaceNavigation";
import { useAuth } from "../hooks/useAuth";
import { useCloudStateSync } from "../hooks/useCloudStateSync";

const MOCK_ANSWER_SECONDS = 120;
const BEGINNER_GUIDED_MODE_KEY = "interviewiq.beginnerGuidedMode.v1";
const FOCUS_MODE_STORAGE_KEY = "interviewiq.focusMode.v1";
const APPLICATION_TRACKER_STORAGE_KEY = "interviewiq.applicationTracker.v1";
const JAVA_DIGEST_PROGRESS_STORAGE_KEY = "interviewiq.javaDigestProgress.v1";
const INTERVIEW_MODES = [
  { key: "strict", label: "Strict Interviewer" },
  { key: "coach", label: "Coach Mode" },
  { key: "barRaiser", label: "Bar Raiser" },
  { key: "behavioralStar", label: "Behavioral STAR" },
  { key: "realPressure", label: "Real Pressure" },
];
const ROUND_STRATEGY_MODES = [
  { key: "recruiter", label: "Recruiter" },
  { key: "coding", label: "Coding" },
  { key: "systemDesign", label: "System Design" },
  { key: "manager", label: "Manager" },
  { key: "final", label: "Final" },
];
const INTERVIEW_PANEL_OPTIONS = INTERVIEW_PANELISTS.filter((item) => [
  "Recruiter",
  "Senior Engineer",
  "Engineering Manager",
  "System Design Architect",
  "Bar Raiser",
].includes(item.label));

function extractScoreFromFeedback(content) {
  const match = String(content || "").match(/score:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  return match ? Number(match[1]) : null;
}

function normalizeInterviewMode(value) {
  if (INTERVIEW_MODES.some((item) => item.key === value)) return value;
  return "strict";
}

function normalizeRoundStrategy(value) {
  if (ROUND_STRATEGY_MODES.some((item) => item.key === value)) return value;
  return "coding";
}

function normalizeInterviewPanelSelection(value) {
  return normalizeInterviewPanel(value).key;
}

function toApiMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: message.apiContent || message.content,
  }));
}

async function readJsonIfAvailable(response) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new Error("Expected JSON response");
  }

  return response.json();
}

export default function Home() {
  const [messages, setMessages]       = useState([]);
  const [expandedCat, setExpanded]    = useState(null);
  const [selectedCat, setSelCat]      = useState(null);
  const [selectedSub, setSelSub]      = useState(null);
  const [mode, setMode]               = useState("interview");
  const [interviewMode, setInterviewMode] = useState("strict");
  const [roundStrategy, setRoundStrategy] = useState("coding");
  const [interviewPanel, setInterviewPanel] = useState("seniorEngineer");
  const [difficulty, setDifficulty]   = useState("Mid");
  const [input, setInput]             = useState("");
  const [codeInput, setCodeInput]     = useState("");
  const [showCode, setShowCode]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [sidebarOpen, setSidebar]     = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [isListening, setListening]   = useState(false);
  const [voiceText, setVoiceText]     = useState("");
  const [showScreen, setShowScreen]   = useState(false);
  const [showRecordingReview, setShowRecordingReview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [themePreference, setThemePreference] = useState("system");
  const [systemThemeMode, setSystemThemeMode] = useState("light");
  const [topControlsOpen, setTopControlsOpen] = useState(false);
  const { activeTab, setActiveTab, toggleWorkspace: toggleWorkspaceTab } = useWorkspaceNavigation("chat");
  const { session: interviewSessionState, reset: resetInterviewSession, startQuestion: startInterviewQuestion, submitAnswer: submitInterviewAnswer, score: scoreInterviewAnswer, review: reviewInterviewAnswer } = useInterviewSession({ mode: "strict", round: "coding", panel: "seniorEngineer" });
  const auth = useAuth();
  const router = useRouter();
  const openAuthSettings = useCallback((mode = "login") => {
    router.push(mode === "register" ? "/sign-up" : "/sign-in");
  }, [router]);
  const [questionMemory, setQuestionMemory] = useState({ questions: {} });
  const [systemDesignCanvas, setSystemDesignCanvas] = useState(() => createSystemDesignCanvasState());
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [prepProgressState, setPrepProgressState] = useState(() => createPrepProgressState());
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("idle");
  const [toast, setToast]             = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(DEFAULT_PROFILE);
  const [voiceHint, setVoiceHint]     = useState("");
  const [aiHealth, setAiHealth]       = useState(null);
  const [mockTimerEndsAt, setMockTimerEndsAt] = useState(null);
  const [mockTimerRemaining, setMockTimerRemaining] = useState(MOCK_ANSWER_SECONDS);
  const [mockTimerStatus, setMockTimerStatus] = useState("idle");
  const [applications, setApplications] = useState([]);
  const [javaDigestProgress, setJavaDigestProgress] = useState({ completedTopics: [], masteredTopics: [] });
  const [toolkitState, setToolkitState] = useState({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [offlineState, setOfflineState] = useState({ online: true, conflict: null });
  const [voiceSessionReport, setVoiceSessionReport] = useState(null);

  const chatRef    = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);
  const recogRef   = useRef(null);
  const voiceFinal = useRef("");
  const pendingPracticeCard = useRef(null);
  const toastTimer = useRef(null);
  const userMenuRef = useRef(null);
  const scrollPositionsRef = useRef({});
  const previousActiveTabRef = useRef(activeTab);
  const viewportBaselineHeight = useRef(0);
  const viewportWidthRef = useRef(0);
  const keyboardOpenRef = useRef(false);
  const viewportRestoreTimers = useRef([]);
  const activityThrottleRef = useRef({});
  const sessionEnvelopeRef = useRef(null);
  const lastRequestRef = useRef(null);
  const voiceSessionStartedAt = useRef(null);
  const visibleTopics = getRecommendedTopics(candidateProfile || profileDraft);
  const stackTheme = getTechTheme(candidateProfile?.stack || profileDraft.stack);
  const resolvedThemeMode = resolveThemeMode(themePreference, systemThemeMode);
  const techTheme = getWorkspaceTheme(stackTheme, activeTab, resolvedThemeMode);
  const prepLabel = getPrepLabel(candidateProfile?.stack || profileDraft.stack);
  const displayName = getDisplayName(candidateProfile);
  const stackGreeting = getStackGreeting(candidateProfile);
  const userPrepLabel = candidateProfile ? buildUserPrepLabel(candidateProfile) : prepLabel;
  const weakSpots = deriveWeakSpots(messages, interviewSessionState);
  const mockScores = deriveMockScores(messages, interviewSessionState);
  const showComposer = canUseChatComposer({ activeTab, candidateProfile });
  const showInterviewTools = canUseInterviewTools({ activeTab, candidateProfile });
  const canSelectPrepTopics = canUsePrepTopics({ candidateProfile });
  const showCodeTools = shouldShowCodeTools({ activeTab, candidateProfile, selectedCat });
  const canSend = Boolean(input.trim() || (showCodeTools && codeInput.trim()));
  const footerHint = showCodeTools ? "screen · voice · code · Enter to send" : "screen · voice · Enter to send";
  const mockTimerLabel = mockTimerStatus === "answering"
    ? `${Math.floor(mockTimerRemaining / 60)}:${String(mockTimerRemaining % 60).padStart(2, "0")}`
    : "Review ready";
  const currentLabel = selectedSub || selectedCat;
  const headerTitle = getWorkspaceTitle({
    activeTab,
    candidateProfile,
    currentLabel,
    displayName,
    stackGreeting,
  });
  const desktopWorkspaces = listDesktopWorkspaces();
  const mobileWorkspaces = listMobileWorkspaces();
  const recordWorkspaceActivity = useCallback((event = {}) => {
    const key = event.dedupeKey || `${event.workspaceId || "chat"}:${event.type || "activity"}`;
    const dedupeMs = Number(event.dedupeMs || 0);
    const currentTime = Date.now();

    if (dedupeMs > 0 && currentTime - (activityThrottleRef.current[key] || 0) < dedupeMs) return;
    activityThrottleRef.current[key] = currentTime;

    setPrepProgressState((previous) => {
      const next = recordPrepActivity(previous, {
        ...event,
        happenedAt: event.happenedAt || new Date().toISOString(),
      });

      if (typeof window !== "undefined") {
        saveVersionedState(window.localStorage, {
          key: PREP_PROGRESS_STORAGE_KEY,
          version: PREP_PROGRESS_STORAGE_VERSION,
          value: next,
          normalize: createPrepProgressState,
        });
      }

      return next;
    });
  }, []);
  const setBeginnerStep = useCallback((stepId) => {
    setPrepProgressState((previous) => {
      const next = recordBeginnerStep(previous, stepId);

      if (typeof window !== "undefined") {
        saveVersionedState(window.localStorage, {
          key: PREP_PROGRESS_STORAGE_KEY,
          version: PREP_PROGRESS_STORAGE_VERSION,
          value: next,
          normalize: createPrepProgressState,
        });
      }

      return next;
    });
  }, []);
  const toggleWorkspace = useCallback((workspaceId) => {
    const normalized = normalizeWorkspaceTab(workspaceId);
    const nextTab = activeTab === normalized ? "chat" : normalized;
    toggleWorkspaceTab(workspaceId);
    if (nextTab !== "chat") {
      recordWorkspaceActivity({
        workspaceId: nextTab,
        type: "open",
        label: `Opened ${getWorkspaceById(nextTab)?.label || "workspace"}`,
        detail: "Opened from the workspace navigation.",
        dedupeMs: 12000,
      });
    }
  }, [activeTab, recordWorkspaceActivity, toggleWorkspaceTab]);
  const openWorkspace = useCallback((workspaceId) => {
    const normalized = normalizeWorkspaceTab(workspaceId);
    setActiveTab(normalized);
    if (normalized !== "chat") {
      recordWorkspaceActivity({
        workspaceId: normalized,
        type: "open",
        label: `Opened ${getWorkspaceById(normalized)?.label || "workspace"}`,
        detail: "Opened from a progress recommendation.",
        dedupeMs: 12000,
      });
    }
    if (isMobile) setSidebar(false);
  }, [isMobile, recordWorkspaceActivity, setActiveTab]);

  // ── Local session persistence ────────────────────────────────────────────
  // QUESTION_MEMORY_STORAGE_KEY is owned by lib/questionMemory.mjs; this shell loads the durable memory through its helpers.
  useEffect(() => {
    const savedEnvelope = loadSessionEnvelope(window.localStorage);
    const savedSession = savedEnvelope?.snapshot || null;
    if (savedSession) {
      sessionEnvelopeRef.current = savedEnvelope;
      setCandidateProfile(savedSession.candidateProfile);
      setProfileDraft(savedSession.profileDraft);
      setMessages(savedSession.messages);
      setSelCat(savedSession.selectedCat);
      setSelSub(savedSession.selectedSub);
      setExpanded(savedSession.expandedCat);
      setMode(savedSession.mode);
      setInterviewMode(normalizeInterviewMode(savedSession.interviewMode));
      setRoundStrategy(normalizeRoundStrategy(savedSession.roundStrategy));
      setInterviewPanel(normalizeInterviewPanelSelection(savedSession.interviewPanel));
      setDifficulty(savedSession.difficulty);
      setActiveTab(savedSession.activeTab);
      resetInterviewSession(savedSession.interviewSession);
    }
    setQuestionMemory(loadQuestionMemory(window.localStorage));
    setBeginnerMode(window.localStorage.getItem(BEGINNER_GUIDED_MODE_KEY) === "1");
    setFocusMode(window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === "1");
    setApplications(loadVersionedState(window.localStorage, {
      key: APPLICATION_TRACKER_STORAGE_KEY,
      version: 1,
      fallback: [],
      normalize: (value) => Array.isArray(value) ? value : [],
    }));
    setJavaDigestProgress(loadVersionedState(window.localStorage, {
      key: JAVA_DIGEST_PROGRESS_STORAGE_KEY,
      version: 1,
      fallback: { completedTopics: [], masteredTopics: [] },
      normalize: (value = {}) => ({
        completedTopics: Array.isArray(value.completedTopics) ? value.completedTopics : [],
        masteredTopics: Array.isArray(value.masteredTopics) ? value.masteredTopics : [],
        bookmarkedQuestions: Array.isArray(value.bookmarkedQuestions) ? value.bookmarkedQuestions : [],
        reviewedQuestions: Array.isArray(value.reviewedQuestions) ? value.reviewedQuestions : [],
        masteredQuestions: Array.isArray(value.masteredQuestions) ? value.masteredQuestions : [],
      }),
    }));
    setPrepProgressState(loadVersionedState(window.localStorage, {
      key: PREP_PROGRESS_STORAGE_KEY,
      version: PREP_PROGRESS_STORAGE_VERSION,
      fallback: createPrepProgressState(),
      normalize: createPrepProgressState,
    }));
    setThemePreference(normalizeThemePreference(window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY)));
    setOfflineState((previous) => ({ ...previous, online: window.navigator.onLine }));
    setSessionReady(true);
  }, [resetInterviewSession, setActiveTab]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = (event) => setSystemThemeMode(event.matches ? "dark" : "light");
    setSystemThemeMode(mediaQuery.matches ? "dark" : "light");
    if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", updateSystemTheme);
    else mediaQuery.addListener?.(updateSystemTheme);
    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", updateSystemTheme);
      else mediaQuery.removeListener?.(updateSystemTheme);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedThemeMode;
    document.documentElement.style.colorScheme = resolvedThemeMode;
  }, [resolvedThemeMode]);

  useEffect(() => {
    if (!sessionReady || typeof window === "undefined") return;
    window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, normalizeThemePreference(themePreference));
  }, [sessionReady, themePreference]);

  useEffect(() => {
    if (!sessionReady) return;
    window.localStorage.setItem(BEGINNER_GUIDED_MODE_KEY, beginnerMode ? "1" : "0");
  }, [beginnerMode, sessionReady]);

  useEffect(() => {
    if (!sessionReady) return;
    window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, focusMode ? "1" : "0");
  }, [focusMode, sessionReady]);

  useEffect(() => {
    if (!sessionReady) return;

    const snapshot = createSessionSnapshot({
      candidateProfile,
      profileDraft,
      messages,
      selectedCat,
      selectedSub,
      expandedCat,
      mode,
      interviewMode,
      roundStrategy,
      interviewPanel,
      difficulty,
      activeTab,
      interviewSession: interviewSessionState,
    });
    saveSessionSnapshot(window.localStorage, snapshot);
    sessionEnvelopeRef.current = createSessionEnvelope(snapshot);
  }, [sessionReady, candidateProfile, profileDraft, messages, selectedCat, selectedSub, expandedCat, mode, interviewMode, roundStrategy, interviewPanel, difficulty, activeTab, interviewSessionState]);

  useEffect(() => {
    if (!sessionReady) return;
    saveVersionedState(window.localStorage, {
      key: APPLICATION_TRACKER_STORAGE_KEY,
      version: 1,
      value: applications,
      normalize: (value) => Array.isArray(value) ? value : [],
    });
  }, [applications, sessionReady]);

  useEffect(() => {
    if (!sessionReady) return;
    saveVersionedState(window.localStorage, {
      key: JAVA_DIGEST_PROGRESS_STORAGE_KEY,
      version: 1,
      value: javaDigestProgress,
      normalize: (value = {}) => ({
        completedTopics: Array.isArray(value.completedTopics) ? value.completedTopics : [],
        masteredTopics: Array.isArray(value.masteredTopics) ? value.masteredTopics : [],
        bookmarkedQuestions: Array.isArray(value.bookmarkedQuestions) ? value.bookmarkedQuestions : [],
        reviewedQuestions: Array.isArray(value.reviewedQuestions) ? value.reviewedQuestions : [],
        masteredQuestions: Array.isArray(value.masteredQuestions) ? value.masteredQuestions : [],
      }),
    });
  }, [javaDigestProgress, sessionReady]);

  useEffect(() => {
    let active = true;
    fetch("/api/models")
      .then((response) => {
        if (!response.ok) throw new Error("Model diagnostics unavailable");
        return readJsonIfAvailable(response);
      })
      .then((data) => {
        if (active) setAiHealth(data);
      })
      .catch(() => {
        if (active) setAiHealth({ configured: true });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setOfflineState((previous) => ({ ...previous, online: true }));
    const onOffline = () => setOfflineState((previous) => ({ ...previous, online: false }));
    const onStorage = (event) => {
      if (event.key !== SESSION_STORAGE_KEY || !event.newValue) return;

      try {
        const incoming = JSON.parse(event.newValue);
        const local = sessionEnvelopeRef.current;
        if (!local?.savedAt || !incoming?.savedAt) return;

        const resolution = resolveVersionedStateConflict(
          { version: 1, savedAt: local.savedAt, state: local.snapshot },
          { version: 1, savedAt: incoming.savedAt, state: incoming.snapshot },
        );

        if (resolution.winner === "incoming") {
          setOfflineState((previous) => ({ ...previous, conflict: incoming }));
        }
      } catch {
        // Ignore cross-tab session payload issues; local session should remain usable.
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // ── Viewport ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => { const m = isCompactViewport(window.innerWidth); setIsMobile(m); if (!m) setSidebar(true); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!topControlsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setTopControlsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [topControlsOpen]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setUserMenuOpen(false); };
    const closeOnOutsideClick = (event) => { if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => { window.removeEventListener("keydown", closeOnEscape); document.removeEventListener("pointerdown", closeOnOutsideClick); };
  }, [userMenuOpen]);

  useEffect(() => {
    const clearViewportRestoreTimers = () => {
      viewportRestoreTimers.current.forEach((timer) => window.clearTimeout(timer));
      viewportRestoreTimers.current = [];
    };
    const restorePageScroll = () => {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    };
    const setViewportHeight = () => {
      const visualViewportHeight = window.visualViewport?.height;
      const viewportWidth = window.innerWidth;
      const height = getStableViewportHeight({
        innerHeight: window.innerHeight,
        visualViewportHeight,
      });
      const visibleHeight = getVisibleViewportHeight({
        innerHeight: window.innerHeight,
        visualViewportHeight,
      });
      const activeElement = document.activeElement;
      const widthChanged = viewportWidthRef.current && Math.abs(viewportWidth - viewportWidthRef.current) > 20;

      if (widthChanged) {
        viewportBaselineHeight.current = 0;
      }
      viewportWidthRef.current = viewportWidth;

      const baselineHeight = Math.max(viewportBaselineHeight.current, height);
      const keyboardOpen = isVirtualKeyboardOpen({
        viewportWidth,
        innerHeight: baselineHeight,
        visualViewportHeight: visibleHeight,
        activeElementTagName: activeElement?.tagName,
        activeElementIsContentEditable: activeElement?.isContentEditable,
      });

      if (!keyboardOpen) {
        viewportBaselineHeight.current = baselineHeight;
      }

      document.documentElement.style.setProperty("--vh", `${baselineHeight * 0.01}px`);
      document.documentElement.style.setProperty("--vvh", `${visibleHeight * 0.01}px`);
      if (keyboardOpenRef.current && !keyboardOpen) {
        restorePageScroll();
      }
      keyboardOpenRef.current = keyboardOpen;
      setKeyboardOpen(keyboardOpen);
    };
    const scheduleViewportRestore = () => {
      clearViewportRestoreTimers();
      [80, 220, 420].forEach((delay) => {
        viewportRestoreTimers.current.push(window.setTimeout(() => {
          setViewportHeight();
          if (!keyboardOpenRef.current) restorePageScroll();
        }, delay));
      });
    };
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("focusin", setViewportHeight);
    window.addEventListener("focusout", scheduleViewportRestore);
    window.visualViewport?.addEventListener("resize", setViewportHeight);
    window.visualViewport?.addEventListener("scroll", setViewportHeight);
    return () => {
      clearViewportRestoreTimers();
      window.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("focusin", setViewportHeight);
      window.removeEventListener("focusout", scheduleViewportRestore);
      window.visualViewport?.removeEventListener("resize", setViewportHeight);
      window.visualViewport?.removeEventListener("scroll", setViewportHeight);
    };
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (activeTab === "chat" && messages.length === 0 && !loading) {
      chatRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [activeTab, messages.length, loading, candidateProfile, selectedCat, selectedSub, mode, interviewMode]);

  useEffect(() => {
    if (previousActiveTabRef.current === activeTab) return;
    const previousTab = previousActiveTabRef.current;
    if (chatRef.current) scrollPositionsRef.current[previousTab] = chatRef.current.scrollTop;
    previousActiveTabRef.current = activeTab;
    requestAnimationFrame(() => chatRef.current?.scrollTo({ top: scrollPositionsRef.current[activeTab] || 0, behavior: "auto" }));
  }, [activeTab]);

  useEffect(() => {
    if (!showCodeTools) {
      setShowCode(false);
      setCodeInput("");
    }
  }, [showCodeTools]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    if (!focusMode || typeof window === "undefined") return;
    const hintKey = "interviewiq.focusModeHint.v1";
    if (window.localStorage.getItem(hintKey) !== "1") {
      showToast("Focus mode keeps your next prep action visible and hides secondary dashboard sections.", "info");
      window.localStorage.setItem(hintKey, "1");
    }
  }, [focusMode, showToast]);

  const cloudSnapshot = useMemo(() => ({ session: createSessionSnapshot({ candidateProfile, profileDraft, messages, selectedCat, selectedSub, expandedCat, mode, interviewMode, roundStrategy, interviewPanel, difficulty, activeTab, interviewSession: interviewSessionState }), themePreference, toolkitState, applications, javaDigestProgress, questionMemory, prepProgressState }), [candidateProfile, profileDraft, messages, selectedCat, selectedSub, expandedCat, mode, interviewMode, roundStrategy, interviewPanel, difficulty, activeTab, interviewSessionState, themePreference, toolkitState, applications, javaDigestProgress, questionMemory, prepProgressState]);
  const applyCloudState = useCallback((snapshot) => {
    const session = snapshot.session || snapshot;
    setCandidateProfile(session.candidateProfile);
    setProfileDraft(session.profileDraft);
    setMessages(session.messages);
    setSelCat(session.selectedCat);
    setSelSub(session.selectedSub);
    setExpanded(session.expandedCat);
    setMode(session.mode);
    setInterviewMode(normalizeInterviewMode(session.interviewMode));
    setRoundStrategy(normalizeRoundStrategy(session.roundStrategy));
    setInterviewPanel(normalizeInterviewPanelSelection(session.interviewPanel));
    setDifficulty(session.difficulty);
    setActiveTab(session.activeTab);
    if (snapshot.themePreference) setThemePreference(normalizeThemePreference(snapshot.themePreference));
    resetInterviewSession(session.interviewSession);
    if (snapshot.session) { setToolkitState(snapshot.toolkitState || {}); setApplications(Array.isArray(snapshot.applications) ? snapshot.applications : []); setJavaDigestProgress(snapshot.javaDigestProgress || { completedTopics: [], masteredTopics: [] }); setQuestionMemory(snapshot.questionMemory || { questions: {} }); setPrepProgressState(snapshot.prepProgressState || createPrepProgressState()); }
  }, [resetInterviewSession, setActiveTab]);
  const handleCloudSyncStatus = useCallback((status) => {
    setCloudStatus(status);
    if (status === "saved") setToast((current) => current?.msg === "Cloud sync is temporarily unavailable; local work is safe." ? null : current);
  }, []);
  useCloudStateSync({ user: auth.user, ready: auth.ready && sessionReady, csrfToken: auth.csrfToken, snapshot: cloudSnapshot, onRemoteState: applyCloudState, onStatus: handleCloudSyncStatus, onError: () => showToast("Cloud sync is temporarily unavailable; local work is safe.", "error") });

  useEffect(() => {
    if (mockTimerStatus !== "answering" || !mockTimerEndsAt) return undefined;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((mockTimerEndsAt - Date.now()) / 1000));
      setMockTimerRemaining(remaining);
      if (remaining > 0) return;
      setMockTimerEndsAt(null);
      setMockTimerStatus("review");
      setMode("practice");
      showToast("Time is up. Review ready - send what you have for feedback.", "info");
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [mockTimerEndsAt, mockTimerStatus, showToast]);

  const exportPrepPlan = useCallback(async (markdown, mode = "copy") => {
    const text = String(markdown || "").trim();
    if (!text) {
      showToast("No daily prep plan is ready yet.", "info");
      return;
    }

    const downloadPlan = () => {
      const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "interviewiq-daily-prep-plan.md";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    if (mode === "download") {
      downloadPlan();
      showToast("Daily prep plan downloaded.", "info");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast("Daily prep plan copied.", "info");
    } catch {
      downloadPlan();
      showToast("Clipboard unavailable, downloaded the plan instead.", "info");
    }
  }, [showToast]);

  const exportCurrentSession = useCallback(async () => {
    const payload = exportSessionSnapshot(createSessionSnapshot({
      candidateProfile,
      profileDraft,
      messages,
      selectedCat,
      selectedSub,
      expandedCat,
      mode,
      interviewMode,
      roundStrategy,
      interviewPanel,
      difficulty,
      activeTab,
      interviewSession: interviewSessionState,
    }));

    try {
      await navigator.clipboard.writeText(payload);
      showToast("Session export copied to clipboard.", "info");
    } catch {
      const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "interviewiq-session-export.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("Session export downloaded.", "info");
    }
  }, [activeTab, candidateProfile, difficulty, expandedCat, interviewMode, interviewPanel, interviewSessionState, messages, mode, profileDraft, roundStrategy, selectedCat, selectedSub, showToast]);

  const importCurrentSession = useCallback(() => {
    const raw = window.prompt("Paste exported session JSON");
    if (!raw) return;

    const snapshot = importSessionSnapshot(raw);
    if (!snapshot) {
      showToast("Session import failed: invalid export payload.", "error");
      return;
    }

    setCandidateProfile(snapshot.candidateProfile);
    setProfileDraft(snapshot.profileDraft);
    setMessages(snapshot.messages);
    setSelCat(snapshot.selectedCat);
    setSelSub(snapshot.selectedSub);
    setExpanded(snapshot.expandedCat);
    setMode(snapshot.mode);
    setInterviewMode(normalizeInterviewMode(snapshot.interviewMode));
    setRoundStrategy(normalizeRoundStrategy(snapshot.roundStrategy));
    setInterviewPanel(normalizeInterviewPanelSelection(snapshot.interviewPanel));
    setDifficulty(snapshot.difficulty);
    setActiveTab(snapshot.activeTab);
    resetInterviewSession(snapshot.interviewSession);
    showToast("Session imported.", "info");
  }, [resetInterviewSession, setActiveTab, showToast]);

  // ── API call ──────────────────────────────────────────────────────────────
  const callAPI = useCallback(async (userText, options = {}) => {
    const hasCode = showCodeTools ? codeInput.trim() : "";
    const promptText = String(userText || "").trim() || (hasCode ? "Please review this code." : "");
    if (loading || (!promptText && !hasCode)) return;
    if (mockTimerStatus === "answering" && !options.startAnswerTimer) {
      setMockTimerEndsAt(null);
      setMockTimerStatus("review");
      setMode("practice");
    }
    setLoading(true);

    const codeLanguage = techTheme.key === "default" ? "text" : techTheme.key;
    const apiPromptText = String(options.apiText || promptText).trim();
    const finalText = hasCode
      ? `${apiPromptText}\n\n\`\`\`${codeLanguage}\n${hasCode}\n\`\`\``
      : apiPromptText;
    const displayText = String(options.displayText || finalText).trim();
    const shouldEvaluateStructuredAnswer = !options.isInterviewPrompt && interviewSessionState.state === "question" && Boolean(interviewSessionState.currentQuestionId);
    const currentStructuredTurn = interviewSessionState.turns.find((turn) => turn.id === interviewSessionState.currentQuestionId);
    if (shouldEvaluateStructuredAnswer) {
      submitInterviewAnswer(promptText);
      fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: currentStructuredTurn?.question || selectedSub || selectedCat || "Interview question", answer: promptText, profile: candidateProfile, round: roundStrategy }) })
        .then((response) => response.json())
        .then((payload) => { if (payload.evaluation) { scoreInterviewAnswer(payload.evaluation); reviewInterviewAnswer({ notes: payload.evaluation.gaps.join("; "), nextAction: payload.evaluation.recommendations[0] || "Repeat this question with one concrete example." }); } })
        .catch(() => undefined);
    }
    lastRequestRef.current = {
      text: promptText,
      apiText: finalText,
      metadata: {
        interviewMode: options.interviewMode === undefined ? interviewMode : options.interviewMode,
        roundStrategy: options.roundStrategy === undefined ? roundStrategy : options.roundStrategy,
        interviewPanel: options.interviewPanel === undefined ? interviewPanel : options.interviewPanel,
        displayText,
      },
    };
    setInput(""); setCodeInput(""); setShowCode(false);

    const userMessage = displayText === finalText
      ? { role:"user", content:displayText }
      : { role:"user", content:displayText, apiContent:finalText };
    const newMsgs = [...messages, userMessage];
    const apiMessages = [...toApiMessages(messages), { role:"user", content:finalText }];
    setMessages([...newMsgs, { role:"assistant", content:"", streaming:true }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          messages: apiMessages,
          profile: candidateProfile,
          // Default request shape used to be interviewMode: interviewMode; options can now override it for canvas/review flows.
          interviewMode: options.interviewMode === undefined ? interviewMode : options.interviewMode,
          roundStrategy: options.roundStrategy === undefined ? roundStrategy : options.roundStrategy,
          interviewPanel: options.interviewPanel === undefined ? interviewPanel : options.interviewPanel,
        }), signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const e = await res.json();
        const requestId = res.headers.get("x-request-id") || e.requestId;
        throw new Error(`${e.error || "Request failed"}${requestId ? ` (Request ID: ${requestId})` : ""}`);
      }

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = "", aiText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream:true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          let p;
          try { p = JSON.parse(data); } catch { continue; }
          if (p.error) throw new Error(`${p.error}${p.requestId ? ` (Request ID: ${p.requestId})` : ""}`);
          if (p.text) { aiText += p.text; setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:true}; return u; }); }
        }
      }
      setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:false}; return u; });
      if (!options.skipQuestionMemory && pendingPracticeCard.current) {
        const score = extractScoreFromFeedback(aiText);
        if (score !== null) {
          const { card, pack } = pendingPracticeCard.current;
          const nextMemory = recordQuestionAttempt(window.localStorage, {
            questionId: card.id,
            question: card.question,
            packId: pack?.id || card.packId || "",
            topic: pack?.topic || selectedSub || selectedCat || "",
            stack: candidateProfile?.stack || "",
            score,
          });
          setQuestionMemory(nextMemory);
        }
      }
    } catch(err) {
      if (err.name !== "AbortError") {
        setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:"⚠️ "+(err.message||"Something went wrong."),streaming:false}; return u; });
        showToast(err.message || "API error", "error");
      }
    } finally {
      if (!options.skipQuestionMemory) {
        pendingPracticeCard.current = null;
      }
      setLoading(false);
      if (options.startAnswerTimer) {
        setMockTimerRemaining(MOCK_ANSWER_SECONDS);
        setMockTimerEndsAt(Date.now() + MOCK_ANSWER_SECONDS * 1000);
        setMockTimerStatus("answering");
      }
    }
  }, [messages, codeInput, loading, showToast, candidateProfile, techTheme.key, showCodeTools, mockTimerStatus, interviewMode, roundStrategy, interviewPanel, selectedCat, selectedSub, interviewSessionState, submitInterviewAnswer, scoreInterviewAnswer, reviewInterviewAnswer]);

  // ── Screen analyze ────────────────────────────────────────────────────────
  const analyzeScreen = useCallback(async (b64, ctx) => {
    setShowScreen(false);
    if (loading) return;
    setLoading(true);
    const label = `📸 Screenshot${ctx?" — "+ctx:""}`;
    const newMsgs = [...messages, { role:"user", content:label }];
    setMessages([...newMsgs, { role:"assistant", content:"", streaming:true }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/analyze-screen", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ imageBase64:b64, mimeType:"image/png", context:ctx, profile: candidateProfile }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const e = await res.json();
        const requestId = res.headers.get("x-request-id") || e.requestId;
        throw new Error(`${e.error || "Screen analysis failed"}${requestId ? ` (Request ID: ${requestId})` : ""}`);
      }

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = "", aiText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream:true });
        const lines = buf.split("\n"); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          let p;
          try { p = JSON.parse(data); } catch { continue; }
          if (p.error) throw new Error(`${p.error}${p.requestId ? ` (Request ID: ${p.requestId})` : ""}`);
          if (p.text) { aiText += p.text; setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:true}; return u; }); }
        }
      }
      setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:false}; return u; });
    } catch(err) {
      if (err.name !== "AbortError") {
        setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:"⚠️ "+(err.message||"Screen analysis error"),streaming:false}; return u; });
        showToast("Screen analysis failed", "error");
      }
    } finally { setLoading(false); }
  }, [messages, loading, showToast, candidateProfile]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const stopVoice = useCallback(() => {
  if (recogRef.current) {
    recogRef.current.stop();
  }

  setListening(false);
}, []);

  const startVoice = useCallback(() => {
  const support = getVoiceSupport(window);

  if (!support.supported) {
    setVoiceHint(support.message);
    showToast(support.message, "error");
    inputRef.current?.focus();
    return;
  }

  try {
    const recognition = new support.Constructor();

    recognition.continuous = !support.isIOS;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    voiceFinal.current = "";
    setVoiceHint(support.message);

    recognition.onstart = () => {
      voiceSessionStartedAt.current = new Date().toISOString();
      setVoiceSessionReport(null);
      setListening(true);
      setVoiceText("");
    };

    recognition.onresult = (event) => {
      const transcript = buildSpeechTranscript(event.results);

      voiceFinal.current = transcript.finalText;
      setVoiceText(transcript.displayText);
    };

    recognition.onerror = (event) => {
      console.warn("Voice recognition fallback", { name: event.error });

      setListening(false);

      const message = getVoiceErrorMessage(event, support);
      setVoiceHint(message);
      showToast(message, "error");
      inputRef.current?.focus();
    };

    recognition.onend = () => {
      setListening(false);

      const finalSpeech =
        voiceFinal.current.trim();

      setVoiceSessionReport(createVoiceSessionReport({
        transcript: finalSpeech || voiceText,
        startedAt: voiceSessionStartedAt.current,
        endedAt: new Date().toISOString(),
        mode: "live",
      }));

      if (finalSpeech) {
        callAPI(finalSpeech);
      }

      voiceFinal.current = "";
      setVoiceText("");
      voiceSessionStartedAt.current = null;
    };

    recogRef.current = recognition;

    recognition.start();
  } catch (err) {
    console.warn("Voice recognition unavailable", { name: err.name, message: err.message });

    const message = getVoiceErrorMessage(err, support);
    setVoiceHint(message);
    showToast(message, "error");
    inputRef.current?.focus();
  }
}, [callAPI, showToast, voiceText]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopVoice();
      return;
    }

    startVoice();
  }, [isListening, startVoice, stopVoice]);

  const retryLastAiRequest = useCallback(() => {
    const retry = buildAiRetryRequest(lastRequestRef.current);
    if (!retry.apiText) {
      showToast("No previous AI request to retry yet.", "info");
      return;
    }

    callAPI(retry.text || retry.apiText, {
      apiText: retry.apiText,
      ...retry.metadata,
    });
  }, [callAPI, showToast]);

  const continueAiFollowUp = useCallback(() => {
    const latestUser = [...messages].reverse().find((message) => message.role === "user")?.content || "";
    const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant" && !message.streaming)?.content || "";
    const prompt = buildAiFollowUpPrompt({
      latestUserMessage: latestUser,
      latestAssistantMessage: latestAssistant,
      focus: "go one level deeper and end with a practical follow-up",
    });

    if (!prompt) {
      showToast("Start one AI session first, then follow up from here.", "info");
      return;
    }

    callAPI(prompt, {
      displayText: "Follow-up on the current AI session",
      skipQuestionMemory: true,
    });
  }, [callAPI, messages, showToast]);

  const applyIncomingSessionConflict = useCallback(() => {
    const snapshot = offlineState.conflict?.snapshot;
    if (!snapshot) return;

    setCandidateProfile(snapshot.candidateProfile);
    setProfileDraft(snapshot.profileDraft);
    setMessages(snapshot.messages);
    setSelCat(snapshot.selectedCat);
    setSelSub(snapshot.selectedSub);
    setExpanded(snapshot.expandedCat);
    setMode(snapshot.mode);
    setInterviewMode(normalizeInterviewMode(snapshot.interviewMode));
    setRoundStrategy(normalizeRoundStrategy(snapshot.roundStrategy));
    setInterviewPanel(normalizeInterviewPanelSelection(snapshot.interviewPanel));
    setDifficulty(snapshot.difficulty);
    setActiveTab(snapshot.activeTab);
    setOfflineState((previous) => ({ ...previous, conflict: null }));
    showToast("Imported the newer session from another tab.", "info");
  }, [offlineState.conflict, setActiveTab, showToast]);

  const commandPaletteActions = buildCommandPaletteActions({
    workspaces: desktopWorkspaces,
    hasCandidateProfile: Boolean(candidateProfile),
    canRetryLastAi: Boolean(lastRequestRef.current?.apiText),
  });

  const startCompanyMock = (prompt) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "company",
      type: "mock",
      label: "Started company mock",
      detail: "Launched a company-focused practice prompt.",
    });
    callAPI(prompt);
  };

  const startCanvasAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "canvas",
      type: metadata?.type || "action",
      label: "Ran System Canvas action",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      roundStrategy: "systemDesign",
      interviewPanel: "systemDesignArchitect",
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const startDesignLabAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "designLab",
      type: metadata?.type || "action",
      label: "Ran Design Lab action",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      roundStrategy: "systemDesign",
      interviewPanel: "systemDesignArchitect",
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const startScenarioBankAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "scenarioBank",
      type: metadata?.type || "scenario",
      label: "Started scenario practice",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      roundStrategy: metadata?.state?.track === "database" ? "systemDesign" : "coding",
      interviewPanel: metadata?.state?.track === "database" ? "systemDesignArchitect" : "seniorEngineer",
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const startJavaDigestAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    if (metadata?.article?.id) {
      setJavaDigestProgress((previous) => ({
        ...previous,
        completedTopics: Array.from(new Set([...(previous.completedTopics || []), metadata.article.id])),
        masteredTopics: metadata.type === "javaDigestMock"
          ? Array.from(new Set([...(previous.masteredTopics || []), metadata.article.id]))
          : [...(previous.masteredTopics || [])],
      }));
    }
    recordWorkspaceActivity({
      workspaceId: "javaDigest",
      type: metadata?.type || "java",
      label: "Started Java drill",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      interviewMode: metadata?.type === "javaDigestMock" || metadata?.type === "javaSeniorRefresherScore" ? "strict" : "directAnswer",
      roundStrategy: metadata?.type === "javaDigestMock" || metadata?.type === "javaSeniorRefresherScore" ? "coding" : "directAnswer",
      interviewPanel: metadata?.type === "javaDigestMock" || metadata?.type === "javaSeniorRefresherScore" ? "seniorEngineer" : null,
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const startInterviewReadyAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "interviewReady",
      type: metadata?.type || "answer",
      label: "Started interview-ready Q&A action",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      interviewMode: metadata?.type === "interviewReadyMock" ? "strict" : "directAnswer",
      roundStrategy: metadata?.type === "interviewReadyMock" ? "manager" : "directAnswer",
      interviewPanel: metadata?.type === "interviewReadyMock" ? "seniorEngineer" : null,
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const startOfferWarRoomAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "offerWarRoom",
      type: metadata?.type || "warRoom",
      label: "Started Offer War Room action",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      interviewMode: metadata?.type?.includes("Story") || metadata?.type?.includes("Speech") ? "coach" : "strict",
      roundStrategy: metadata?.type?.includes("Round") || metadata?.type?.includes("Loop") ? "final" : "manager",
      interviewPanel: metadata?.type?.includes("Story") ? "engineeringManager" : "barRaiser",
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const startDsaLabPractice = (prompt, metadata = {}) => {
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "dsaLab",
      type: "practice",
      label: "Started DSA visual practice",
      detail: buildWorkspaceActionDisplayText(prompt, metadata),
    });
    callAPI(prompt, {
      roundStrategy: "coding",
      interviewPanel: "seniorEngineer",
      displayText: buildWorkspaceActionDisplayText(prompt, metadata),
      skipQuestionMemory: true,
    });
  };

  const goHome = useCallback(() => {
    abortRef.current?.abort();
    const homeState = createHomeNavigationState({
      candidateProfile,
      profileDraft,
      messages,
      activeTab,
      loading,
    });

    setActiveTab(homeState.activeTab);
    setMessages(homeState.messages);
    setLoading(homeState.loading);
    setShowCode(false);
    setCodeInput("");
    if (isMobile) setSidebar(false);
    requestAnimationFrame(() => {
      chatRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [activeTab, candidateProfile, loading, messages, profileDraft, isMobile, setActiveTab]);

  const openCourse = () => {
    setActiveTab("course");
    if (isMobile) setSidebar(false);
  };

  const handleCommandPaletteSelect = useCallback((action) => {
    if (action.type === "workspace" && action.workspaceId) {
      openWorkspace(action.workspaceId);
    } else if (action.id === "home") {
      goHome();
    } else if (action.id === "voice") {
      toggleVoice();
    } else if (action.id === "retry-ai") {
      retryLastAiRequest();
    } else if (action.id === "export-session") {
      exportCurrentSession();
    } else if (action.id === "import-session") {
      importCurrentSession();
    }

    setCommandPaletteOpen(false);
  }, [exportCurrentSession, goHome, importCurrentSession, openWorkspace, retryLastAiRequest, toggleVoice]);

  const startPracticeMock = ({ prompt, question, card, pack }) => {
    if (card) {
      pendingPracticeCard.current = { card, pack };
    }
    resetInterviewSession({ mode: "practice", round: roundStrategy, panel: interviewPanel, profile: candidateProfile });
    startInterviewQuestion({ questionId: card?.id || "practice", question: question || prompt });
    setActiveTab("chat");
    recordWorkspaceActivity({
      workspaceId: "chat",
      type: "mock",
      label: "Started practice pack mock",
      detail: question || "Practice pack question started.",
    });
    callAPI(prompt, {
      displayText: `Practice as mock: ${question}`,
      isInterviewPrompt: true,
    });
  };

  const submitRecordingReview = ({ review, prompt, transcript }) => {
    setShowRecordingReview(false);
    recordWorkspaceActivity({
      workspaceId: "chat",
      type: "review",
      label: "Submitted recording review",
      detail: review.displayText || "Interview recording review",
    });
    const apiText = [
      buildInterviewRecordingReviewPrompt(review, {
        role: candidateProfile?.position,
        question: selectedSub || selectedCat,
      }),
      "",
      "Transcript for this one-time review:",
      transcript,
    ].join("\n");
    callAPI(review.displayText || "Interview recording review", {
      apiText: prompt ? `${prompt}\n\nTranscript:\n${transcript}` : apiText,
      displayText: review.displayText || "Interview recording review",
      skipQuestionMemory: true,
    });
  };

  const saveProfile = () => {
    const nextProfile = {
      name: profileDraft.name.trim(),
      position: profileDraft.position.trim(),
      experience: profileDraft.experience.trim(),
      stack: profileDraft.stack.trim(),
    };
    if (!nextProfile.name || !nextProfile.position || !nextProfile.experience || !nextProfile.stack) return;
    const nextTopics = getRecommendedTopics(nextProfile);
    setCandidateProfile(nextProfile);
    setSelCat(nextTopics[0]?.cat || null);
    setExpanded(nextTopics[0]?.cat || null);
    setSelSub(null);
    setMessages([]);
    setSidebar(!isMobile);
  };

  // ── Session start ─────────────────────────────────────────────────────────
  const startSession = useCallback(() => {
    if (!candidateProfile || !selectedCat || loading) return;
    const topic = selectedSub || selectedCat;
    const style = INTERVIEW_MODES.find((item) => item.key === interviewMode)?.label || "Strict Interviewer";
    const round = ROUND_STRATEGY_MODES.find((item) => item.key === roundStrategy)?.label || "Coding";
    const panel = INTERVIEW_PANEL_OPTIONS.find((item) => item.key === interviewPanel)?.label || "Senior Engineer";
    const pressureRules = interviewMode === "realPressure"
      ? "Real Pressure rules: strict timed one-question mode, no hints, interruption follow-ups, and final hire/no-hire scorecard."
      : "";
    const prompt = mode === "interview"
      ? `Start a ${style} mock interview for ${displayName} on "${topic}". Round Strategy Mode: ${round}. AI Interview Panel Mode: ${panel}. Difficulty: ${difficulty}. ${pressureRules} Ask your first question.`
      : `Give ${displayName} a comprehensive ${difficulty}-level practice session on "${topic}". Include working code when useful.`;
    setMessages([]);
    setActiveTab("chat");
    setMockTimerStatus("idle");
    setMockTimerEndsAt(null);
    recordWorkspaceActivity({
      workspaceId: "chat",
      type: mode === "interview" ? "mock" : "practice",
      label: mode === "interview" ? "Started mock interview" : "Started practice session",
      detail: `${difficulty} ${topic}`,
    });
    if (mode === "interview") {
      resetInterviewSession({ mode: "interview", round: roundStrategy, panel: interviewPanel, profile: candidateProfile });
      startInterviewQuestion({ questionId: `${selectedCat}-${Date.now()}`, question: `Interview question about ${topic}` });
    }
    setTimeout(() => callAPI(prompt, { startAnswerTimer: mode === "interview", isInterviewPrompt: true }), 50);
  }, [callAPI, candidateProfile, difficulty, displayName, interviewMode, interviewPanel, loading, mode, recordWorkspaceActivity, roundStrategy, selectedCat, selectedSub, setActiveTab, resetInterviewSession, startInterviewQuestion]);

  const clearChat = useCallback(() => {
    abortRef.current?.abort(); setMessages([]); setLoading(false);
    setMockTimerStatus("idle"); setMockTimerEndsAt(null);
  }, []);

  // ── Sidebar handlers ──────────────────────────────────────────────────────
  const showProfileRequired = () => {
    setActiveTab("chat");
    showToast("Fill your target details first to unlock personalized topics.", "info");
  };
  const handleToggleCat = (cat) => {
    if (!canSelectPrepTopics) {
      showProfileRequired();
      return;
    }
    const workspaceState = createTopicSelectionNavigationState({ activeTab });
    setActiveTab(workspaceState.activeTab);
    setExpanded(p => p === cat ? null : cat);
    setSelCat(cat); setSelSub(null);
  };
  const handleSelectSub = (cat, sub) => {
    if (!canSelectPrepTopics) {
      showProfileRequired();
      return;
    }
    const workspaceState = createTopicSelectionNavigationState({ activeTab });
    setActiveTab(workspaceState.activeTab);
    setSelCat(cat); setSelSub(sub);
    if (isMobile) setSidebar(false);
  };

  useEffect(() => {
    const handlePowerKeys = (event) => {
      const target = event.target;
      const isEditable = target?.tagName === "TEXTAREA" || target?.tagName === "INPUT" || target?.isContentEditable;
      const hasCommand = event.ctrlKey || event.metaKey;

      if (event.key === "/" && !isEditable) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }

      if (!hasCommand) return;

      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setSidebar((previous) => !previous);
      } else if (event.shiftKey && key === "p") {
        event.preventDefault();
        setCommandPaletteOpen((previous) => !previous);
      } else if (key === "enter") {
        event.preventDefault();
        startSession();
      } else if (event.shiftKey && key === "c") {
        event.preventDefault();
        clearChat();
      } else if (event.shiftKey && key === "v") {
        event.preventDefault();
        toggleVoice();
      } else if (event.shiftKey && key === "s") {
        event.preventDefault();
        setShowScreen(true);
      }
    };

    window.addEventListener("keydown", handlePowerKeys);
    return () => window.removeEventListener("keydown", handlePowerKeys);
  }, [clearChat, startSession, toggleVoice]);

  const themeVars = {
    "--tech-accent": techTheme.accent,
    "--tech-accent-soft": techTheme.accentSoft,
    "--tech-accent-muted": techTheme.accentMuted,
    "--tech-accent-border": techTheme.accentBorder,
    "--tech-accent-strong": techTheme.accentStrong,
    "--tech-accent-text": techTheme.accentText,
    "--tech-surface": techTheme.surface,
    "--tech-panel": techTheme.panel,
    "--tech-panel-strong": techTheme.panelStrong,
    "--tech-glass-panel": techTheme.glass.panel,
    "--tech-glass-panel-strong": techTheme.glass.panelStrong,
    "--tech-glass-tint": techTheme.glass.tint,
    "--tech-glass-tint-strong": techTheme.glass.tintStrong,
    "--tech-glass-shine": techTheme.glass.shine,
    "--tech-glass-edge": techTheme.glass.edge,
    "--tech-glass-edge-soft": techTheme.glass.edgeSoft,
    "--tech-glass-shadow": techTheme.glass.shadow,
  };
  const appShellHeight = getAppShellHeight({
    isCompact: isMobile,
    keyboardOpen: isKeyboardOpen,
    hasVisualViewport: true,
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>InterviewIQ</title>
        <meta name="description" content="AI-powered interview intelligence for modern software engineers" />
        <meta name="theme-color" content={techTheme.surface} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

      <CommandPalette
        open={commandPaletteOpen}
        actions={commandPaletteActions}
        onClose={() => setCommandPaletteOpen(false)}
        onSelect={handleCommandPaletteSelect}
        theme={techTheme}
      />

      {/* Voice bar */}
      {isListening && <VoiceBar transcript={voiceText} onStop={stopVoice} liveMode="live" report={voiceSessionReport} />}

      {/* Screen modal */}
      {showScreen && <ScreenModal theme={techTheme} onCapture={analyzeScreen} onClose={() => setShowScreen(false)} />}

      {/* Recording review modal */}
      {showRecordingReview && (
        <RecordingReviewModal
          theme={techTheme}
          role={candidateProfile?.position || ""}
          question={selectedSub || selectedCat || ""}
          onClose={() => setShowRecordingReview(false)}
          onReviewReady={submitRecordingReview}
        />
      )}

      {/* Settings modal */}
      {showSettings && <AboutModal theme={techTheme} onClose={() => setShowSettings(false)} appearance={resolvedThemeMode} />}
      {showAccountSettings && <SettingsModal onClose={() => setShowAccountSettings(false)} onDeleteSuccess={(result) => { setShowAccountSettings(false); showToast(result.emailDelivery?.delivered ? "Account deleted. Confirmation email sent." : "Account deleted, but confirmation email could not be sent.", result.emailDelivery?.delivered ? "info" : "error"); }} theme={techTheme} auth={auth} themePreference={themePreference} onThemePreferenceChange={setThemePreference} appearance={resolvedThemeMode} />}

      {/* App shell */}
      <div className={`app-shell theme-${resolvedThemeMode} ${focusMode ? "focus-mode" : ""}`} style={{ ...themeVars, position:"fixed", inset:0, isolation:"isolate", display:"flex", height:appShellHeight, overflow:"hidden", background:techTheme.surface }}>
        <TechBackground theme={techTheme} />

        {/* Sidebar */}
        <Sidebar
          topics={visibleTopics}
          open={sidebarOpen} onClose={() => setSidebar(false)}
          expandedCat={expandedCat} selectedCat={selectedCat} selectedSub={selectedSub}
          onToggleCat={handleToggleCat} onSelectSub={handleSelectSub}
          isMobile={isMobile}
          theme={techTheme}
          prepLabel={prepLabel}
          userPrepLabel={candidateProfile ? userPrepLabel : null}
          topicsLocked={!canSelectPrepTopics}
          onLockedTopic={showProfileRequired}
          onOpenCourse={openCourse}
        />

        {/* Main */}
        <main className="glass-panel" style={{ position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0, minHeight:0 }}>
          {(!offlineState.online || offlineState.conflict) && (
            <div role="status" className="glass-chrome" style={{ alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.08)", color: "#cbd5e1", display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 12px" }}>
              {!offlineState.online && <span>Offline draft mode active. Changes stay local until the network returns.</span>}
              {offlineState.conflict && (
                <>
                  <span>Newer session detected from another tab. Choose which version to keep.</span>
                  <button type="button" className="glass-button" onClick={applyIncomingSessionConflict} style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>
                    Use newer session
                  </button>
                  <button type="button" className="glass-button" onClick={() => setOfflineState((previous) => ({ ...previous, conflict: null }))} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#cbd5e1", fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>
                    Keep this tab
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Top bar ── */}
          <header className="glass-chrome app-topbar" style={{ position:"relative", zIndex:130, display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0, minHeight:52 }}>
            <button className={`icon-btn ${activeTab==="chat" && messages.length===0 ? "active" : ""}`} onClick={goHome} title="Home" data-tooltip="Home" aria-label="Home">
              <i className="ti ti-home" />
            </button>
            <button className="icon-btn" onClick={() => setSidebar(p => !p)} title="Topics" data-tooltip="Topics" aria-label="Topics">
              <i className="ti ti-menu-2" />
            </button>
            <div className="desktop-workspace-nav">
              <DesktopWorkspaceNav
                activeTab={activeTab}
                workspaces={desktopWorkspaces}
                onToggleWorkspace={toggleWorkspace}
              />
            </div>
            <TabletWorkspaceMenu
              activeTab={activeTab}
              accent={techTheme.accentStrong}
              appearance={resolvedThemeMode}
              workspaces={desktopWorkspaces}
              onToggleWorkspace={toggleWorkspace}
            />

            <span className="header-title" style={{ flex:1, fontSize:13, fontWeight:500, color: currentLabel?"#e8e8f0":"#4b5563", minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {activeTab !== "chat" ? <><span className="header-breadcrumb-root">Today</span><span className="header-breadcrumb-separator">/</span>{headerTitle}</> : headerTitle}
            </span>
            <span className={`cloud-sync-status cloud-sync-${cloudStatus}`} role="status" aria-live="polite" title="Workspace sync status">
              <i className={`ti ${cloudStatus === "saving" || cloudStatus === "hydrating" ? "ti-loader-2" : cloudStatus === "error" ? "ti-alert-circle" : "ti-cloud-check"}`} />
              {cloudStatus === "saving" ? "Saving…" : cloudStatus === "hydrating" ? "Loading…" : cloudStatus === "error" ? "Sync issue" : auth.user ? "Saved" : "Saved on this device"}
            </span>
            {candidateProfile && (
              <span className="header-profile-label" style={{ display:isMobile?"none":"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:999, border:`1px solid ${techTheme.accentBorder}`, background:techTheme.accentMuted, color:techTheme.accentText, fontSize:10.5, fontWeight:600, whiteSpace:"nowrap" }}>
                <i className={`ti ${techTheme.icon}`} style={{ fontSize:12 }} />{userPrepLabel}
              </span>
            )}

            <div className="header-account-actions" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }} aria-label="Account actions">
              {auth.user ? <div ref={userMenuRef} className="user-menu-wrap" style={{ position: "relative" }}>
                <button type="button" className="glass-button" onClick={() => setUserMenuOpen((value) => !value)} aria-haspopup="menu" aria-expanded={userMenuOpen} style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "5px 9px", whiteSpace: "nowrap" }}><i className="ti ti-user-circle" /> Account <i className={`ti ${userMenuOpen ? "ti-chevron-up" : "ti-chevron-down"}`} /></button>
                {userMenuOpen && <div className="user-menu-panel glass-card" role="menu" aria-label="Account menu">
                  <button type="button" role="menuitem" onClick={() => { setShowAccountSettings(true); setUserMenuOpen(false); }}><i className="ti ti-settings" />Account & settings</button>
                  <button type="button" role="menuitem" onClick={() => { setFocusMode((value) => !value); setUserMenuOpen(false); }}><i className="ti ti-focus-2" />{focusMode ? "Exit focus mode" : "Focus mode"}</button>
                </div>}
              </div> : <>
                <button type="button" className="glass-button" onClick={() => openAuthSettings("login")} style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "5px 9px", whiteSpace: "nowrap" }}>Sign in</button>
                <button type="button" className="glass-button" onClick={() => openAuthSettings("register")} style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, cursor: "pointer", fontSize: 11, fontWeight: 850, padding: "5px 9px", whiteSpace: "nowrap" }}>Create account</button>
              </>}
            </div>
            {!auth.user && <button type="button" className={`glass-button focus-mode-toggle ${focusMode ? "active" : ""}`} onClick={() => setFocusMode((value) => !value)} aria-pressed={focusMode} title="Focus mode" data-tooltip="Focus mode" style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, fontSize: 11, fontWeight: 850, padding: "5px 9px", whiteSpace: "nowrap" }}><i className="ti ti-focus-2" /> {focusMode ? "Exit focus" : "Focus"}</button>}

            {activeTab !== "chat" && <button type="button" className="glass-button today-back-button" onClick={goHome} title="Back to today's plan" data-tooltip="Back to today" style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, fontSize: 11, fontWeight: 850, padding: "5px 9px", whiteSpace: "nowrap" }}><i className="ti ti-arrow-left" /> Today</button>}

            {/* Desktop-only controls */}
            {showInterviewTools && <div style={{ display:"flex", alignItems:"center", gap:6 }} className="desktop-controls">
              <button className="icon-btn" onClick={() => setShowScreen(true)} title="Analyze Screen" aria-label="Analyze Screen"><i className="ti ti-screenshot" /></button>
              <button className={`icon-btn ${isListening?"recording":""}`} onClick={toggleVoice} title="Voice" aria-label="Voice"><i className={`ti ${isListening?"ti-microphone-off":"ti-microphone"}`} /></button>
              <button className="icon-btn" onClick={() => setShowRecordingReview(true)} title="Record Review" aria-label="Record Review"><i className="ti ti-wave-sine" /></button>

              <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:7, padding:2, border:"1px solid rgba(255,255,255,.07)" }}>
                {["interview","practice"].map(m => (
                <button key={m} className={mode===m?"glass-button":""} onClick={() => setMode(m)} style={{ padding:"3px 10px", fontSize:11, fontWeight:500, borderRadius:5, border:mode===m?`1px solid ${techTheme.accentBorder}`:"none", cursor:"pointer", color: mode===m?techTheme.accentText:"#6b7280", background: mode===m?techTheme.accentSoft:"transparent", textTransform:"capitalize" }}>{m}</button>
                ))}
              </div>

              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                aria-label="Difficulty level"
                className="glass-input"
                style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none" }}>
                {DIFFS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select value={interviewMode} onChange={e => setInterviewMode(e.target.value)}
                aria-label="Interview calibration mode"
                className="glass-input"
                style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none", maxWidth:150 }}>
                {INTERVIEW_MODES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={roundStrategy} onChange={e => setRoundStrategy(e.target.value)}
                aria-label="Round Strategy Mode"
                className="glass-input"
                style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none", maxWidth:130 }}>
                {ROUND_STRATEGY_MODES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <select value={interviewPanel} onChange={e => setInterviewPanel(e.target.value)}
                aria-label="AI Interview Panel Mode"
                className="glass-input"
                style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none", maxWidth:165 }}>
                {INTERVIEW_PANEL_OPTIONS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>

              <button className="glass-button" aria-label="Start mock round" onClick={startSession} disabled={!candidateProfile || !selectedCat || loading}
                style={{ padding:"4px 12px", fontSize:12, fontWeight:600, borderRadius:7, border:`1px solid ${techTheme.accentBorder}`, color:techTheme.accentText, cursor: candidateProfile&&selectedCat&&!loading?"pointer":"not-allowed", opacity: candidateProfile&&selectedCat&&!loading?1:.4, display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-player-play" style={{ fontSize:11 }} />Start
              </button>
            </div>}

            {showInterviewTools && (
              <div className="compact-controls-menu" style={{ flexShrink: 0, position: "relative" }}>
                <button
                  type="button"
                  className="glass-button"
                  aria-label="Prep controls"
                  aria-haspopup="menu"
                  aria-expanded={topControlsOpen}
                  onClick={() => setTopControlsOpen((value) => !value)}
                  style={{ alignItems: "center", border: "1px solid rgba(255,255,255,.09)", borderRadius: 8, color: "#cbd5e1", cursor: "pointer", display: "inline-flex", fontSize: 11.5, fontWeight: 850, gap: 7, minHeight: 34, padding: "7px 10px", whiteSpace: "nowrap" }}
                >
                  <i className="ti ti-adjustments-horizontal" style={{ color: techTheme.accentStrong, fontSize: 15 }} />
                  <span>Prep controls</span>
                  <i className={`ti ${topControlsOpen ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ color: "#6b7280", fontSize: 13 }} />
                </button>
                {topControlsOpen && (
                  <section
                    aria-label="Compact prep controls menu"
                    className="glass-card"
                    style={{ background: "rgba(8,12,22,.97)", border: "1px solid rgba(255,255,255,.11)", borderRadius: 10, boxShadow: "0 16px 40px rgba(0,0,0,.42)", display: "grid", gap: 10, minWidth: 292, padding: 10, position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 45 }}
                  >
                    <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong style={{ color: "#f8fbff", fontSize: 11, fontWeight: 950, textTransform: "uppercase" }}>Prep Controls</strong>
                      <button type="button" aria-label="Close prep controls" onClick={() => setTopControlsOpen(false)} style={{ alignItems: "center", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, color: "#9ca3af", cursor: "pointer", display: "inline-flex", height: 28, justifyContent: "center", width: 28 }}>
                        <i className="ti ti-x" />
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 7 }}>
                      <button className="glass-button" onClick={() => { setShowScreen(true); setTopControlsOpen(false); }} title="Analyze Screen" aria-label="Analyze Screen" style={{ alignItems: "center", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: techTheme.accentText, cursor: "pointer", display: "grid", fontSize: 10.5, fontWeight: 800, gap: 5, justifyItems: "center", minHeight: 50, padding: 7 }}>
                        <i className="ti ti-screenshot" style={{ fontSize: 17 }} />Screen
                      </button>
                      <button className={`glass-button ${isListening ? "recording" : ""}`} onClick={() => { toggleVoice(); setTopControlsOpen(false); }} title="Voice" aria-label="Voice" style={{ alignItems: "center", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: isListening ? "#f87171" : techTheme.accentText, cursor: "pointer", display: "grid", fontSize: 10.5, fontWeight: 800, gap: 5, justifyItems: "center", minHeight: 50, padding: 7 }}>
                        <i className={`ti ${isListening ? "ti-microphone-off" : "ti-microphone"}`} style={{ fontSize: 17 }} />Voice
                      </button>
                      <button className="glass-button" onClick={() => { setShowRecordingReview(true); setTopControlsOpen(false); }} title="Record Review" aria-label="Record Review" style={{ alignItems: "center", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: techTheme.accentText, cursor: "pointer", display: "grid", fontSize: 10.5, fontWeight: 800, gap: 5, justifyItems: "center", minHeight: 50, padding: 7 }}>
                        <i className="ti ti-wave-sine" style={{ fontSize: 17 }} />Review
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", background: "rgba(255,255,255,.04)", borderRadius: 8, padding: 2, border: "1px solid rgba(255,255,255,.07)" }}>
                        {["interview","practice"].map(m => (
                          <button key={m} className={mode===m?"glass-button":""} onClick={() => setMode(m)} style={{ flex: 1, padding: "6px 10px", fontSize: 11, fontWeight: 800, borderRadius: 6, border: mode===m?`1px solid ${techTheme.accentBorder}`:"none", cursor: "pointer", color: mode===m?techTheme.accentText:"#9ca3af", background: mode===m?techTheme.accentSoft:"transparent", textTransform:"capitalize" }}>{m}</button>
                        ))}
                      </div>
                      <select value={difficulty} onChange={e => setDifficulty(e.target.value)} aria-label="Difficulty level" className="glass-input" style={{ fontSize: 12, padding: "8px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", color:"#cbd5e1", outline:"none" }}>
                        {DIFFS.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <select value={interviewMode} onChange={e => setInterviewMode(e.target.value)} aria-label="Interview calibration mode" className="glass-input" style={{ fontSize: 12, padding: "8px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", color:"#cbd5e1", outline:"none" }}>
                        {INTERVIEW_MODES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                      <select value={roundStrategy} onChange={e => setRoundStrategy(e.target.value)} aria-label="Round Strategy Mode" className="glass-input" style={{ fontSize: 12, padding: "8px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", color:"#cbd5e1", outline:"none" }}>
                        {ROUND_STRATEGY_MODES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                      <select value={interviewPanel} onChange={e => setInterviewPanel(e.target.value)} aria-label="AI Interview Panel Mode" className="glass-input" style={{ fontSize: 12, padding: "8px 9px", borderRadius: 7, border: "1px solid rgba(255,255,255,.09)", color:"#cbd5e1", outline:"none" }}>
                        {INTERVIEW_PANEL_OPTIONS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                      </select>
                      <button className="glass-button" aria-label="Start mock round" onClick={() => { startSession(); setTopControlsOpen(false); }} disabled={!candidateProfile || !selectedCat || loading} style={{ alignItems: "center", border: `1px solid ${techTheme.accentBorder}`, borderRadius: 8, color: techTheme.accentText, cursor: candidateProfile&&selectedCat&&!loading ? "pointer" : "not-allowed", display: "flex", fontSize: 12, fontWeight: 900, gap: 6, justifyContent: "center", minHeight: 39, opacity: candidateProfile&&selectedCat&&!loading ? 1 : .4, padding: "8px 12px" }}>
                        <i className="ti ti-player-play" style={{ fontSize: 12 }} />Start mock
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}

            {messages.length > 0 && (
              <button className="icon-btn" onClick={clearChat} title="Clear" aria-label="Clear"><i className="ti ti-trash" /></button>
            )}
            {candidateProfile && (
              <button className="icon-btn" onClick={() => { setProfileDraft(candidateProfile); setCandidateProfile(null); setMessages([]); }} title="Edit Profile" aria-label="Edit Profile"><i className="ti ti-user-cog" /></button>
            )}
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="About and help" data-tooltip="About & help" aria-label="Info"><i className="ti ti-info-circle" /></button>
          </header>

          <div className="glass-chrome" style={{ alignItems: "center", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", flexWrap: "wrap", gap: 7, padding: "8px 12px" }}>
            <button type="button" className="glass-button" onClick={retryLastAiRequest} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#cbd5e1", fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>
              Retry AI
            </button>
            <button type="button" className="glass-button" onClick={continueAiFollowUp} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#cbd5e1", fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>
              Follow-up
            </button>
            <button type="button" className="glass-button" onClick={exportCurrentSession} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#cbd5e1", fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>
              Export Session
            </button>
            <button type="button" className="glass-button" onClick={importCurrentSession} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 7, color: "#cbd5e1", fontSize: 11, fontWeight: 800, padding: "5px 8px" }}>
              Import Session
            </button>
            <button type="button" className="glass-button" onClick={() => setCommandPaletteOpen(true)} style={{ border: `1px solid ${techTheme.accentBorder}`, borderRadius: 7, color: techTheme.accentText, fontSize: 11, fontWeight: 900, padding: "5px 8px" }}>
              Command Palette
            </button>
            {voiceSessionReport && (
              <span style={{ color: "#94a3b8", fontSize: 10.8 }}>
                Voice report: {voiceSessionReport.wordCount} words · {voiceSessionReport.durationSeconds}s
              </span>
            )}
          </div>

          {aiHealth?.configured === false && (
            <div role="status" style={{ alignItems: "center", background: "rgba(250,204,21,.09)", borderBottom: "1px solid rgba(250,204,21,.18)", color: "#fde68a", display: "flex", flexShrink: 0, fontSize: 11.5, gap: 8, lineHeight: 1.4, padding: "7px 12px" }}>
              <i className="ti ti-alert-triangle" style={{ color: "#facc15", flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                AI provider not configured. Local Scenario Bank, Java Digest, DSA, Canvas, and Design Lab still work; set GEMINI_API_KEY to enable chat, screen, and generated drills.
              </span>
            </div>
          )}

          {/* ── Chat area ── */}
          <div ref={chatRef} className="chat-scroll" role="log" aria-live="polite" aria-relevant="additions text" aria-busy={loading || !sessionReady} aria-label="Conversation messages" style={{ flex:1, minHeight:0, overflowY:"auto", padding: isMobile?"12px 10px":"20px 16px", display:"flex", flexDirection:"column" }}>
            {!sessionReady ? <div className="dashboard-skeleton" role="status" aria-label="Loading InterviewIQ workspace"><span /><span /><span /><span /></div> : null}
            {sessionReady ? <>
            {loading ? <div className="ai-progress-status" role="status" aria-live="polite"><span className="dot" />InterviewIQ is preparing your response…</div> : null}
            {activeTab === "course" ? (
              <AgenticUICourse theme={techTheme} variant="full" />
            ) : activeTab==="scenarioBank" ? (
              <ScenarioBank
                theme={techTheme}
                onAction={startScenarioBankAction}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
                onActivity={recordWorkspaceActivity}
              />
            ) : activeTab==="offerWarRoom" ? (
              <OfferWarRoom
                theme={techTheme}
                profile={candidateProfile || profileDraft}
                topics={visibleTopics}
                weakSpots={weakSpots}
                mockScores={mockScores}
                messages={messages}
                selectedCat={selectedCat}
                selectedSub={selectedSub}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
                onAction={startOfferWarRoomAction}
                onActivity={recordWorkspaceActivity}
              />
            ) : activeTab==="interviewReady" ? (
              <InterviewReadyQA
                theme={techTheme}
                profile={candidateProfile || profileDraft}
                onAction={startInterviewReadyAction}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
                onActivity={recordWorkspaceActivity}
              />
            ) : activeTab==="javaDigest" ? (
              <JavaDigest
                theme={techTheme}
              onAction={startJavaDigestAction}
                onRefresherProgressChange={(updater) => setJavaDigestProgress((previous) => updater(previous))}
                profile={candidateProfile || profileDraft}
                progress={javaDigestProgress}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
                onActivity={recordWorkspaceActivity}
              />
            ) : activeTab==="designLab" ? (
              <DesignLab
                theme={techTheme}
                onAction={startDesignLabAction}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
              />
            ) : activeTab==="dsaLab" ? (
              <DsaVisualLab
                theme={techTheme}
                profile={candidateProfile || profileDraft}
                initialLessonId="arrays"
                onPractice={startDsaLabPractice}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
                onActivity={recordWorkspaceActivity}
              />
            ) : activeTab === "canvas" ? (
              <SystemDesignCanvas
                theme={techTheme}
                initialState={systemDesignCanvas}
                onChange={(nextCanvasState) => {
                  setSystemDesignCanvas(nextCanvasState);
                  recordWorkspaceActivity({
                    workspaceId: "canvas",
                    type: "edit",
                    label: "Updated System Design Canvas",
                    detail: "Captured requirements, architecture, scale, or failure notes.",
                    dedupeKey: "canvas:edit",
                    dedupeMs: 30000,
                  });
                }}
                onAction={startCanvasAction}
                onExport={() => {
                  recordWorkspaceActivity({
                    workspaceId: "canvas",
                    type: "export",
                    label: "Exported System Design Canvas",
                    detail: "Copied system design notes as Markdown.",
                  });
                }}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
              />
            ) : activeTab === "company" ? (
              <CompanyPrep
                theme={techTheme}
                weakSpots={weakSpots}
                mockScores={mockScores}
                messages={messages}
                selectedCat={selectedCat}
                selectedSub={selectedSub}
                onMock={startCompanyMock}
                applications={applications}
                onApplicationsChange={setApplications}
                beginnerMode={beginnerMode}
                beginnerStep={prepProgressState.beginnerStep}
                onBeginnerStepChange={setBeginnerStep}
                onActivity={recordWorkspaceActivity}
              />
            ) : messages.length === 0 && !loading
              ? !candidateProfile
                ? <ProfileSetup theme={techTheme} draft={profileDraft} onChange={setProfileDraft} onSubmit={saveProfile} onSignIn={() => openAuthSettings("login")} isSignedIn={Boolean(auth.user)} keyboardOpen={isKeyboardOpen} />
                : <Welcome
                  onChip={(text) => {
                    recordWorkspaceActivity({
                      workspaceId: "chat",
                      type: "prompt",
                      label: "Started guided home prompt",
                      detail: String(text || "").slice(0, 180),
                    });
                    callAPI(text);
                  }}
                  onStart={startSession}
                  onScreen={() => setShowScreen(true)}
                  onVoice={toggleVoice}
                  onRecordReview={() => setShowRecordingReview(true)}
                  selectedCat={selectedCat}
                  selectedSub={selectedSub}
                  mode={mode}
                  difficulty={difficulty}
                  theme={techTheme}
                  profile={candidateProfile}
                  showCodeTools={showCodeTools}
                  topics={visibleTopics}
                  weakSpots={weakSpots}
                  mockScores={mockScores}
                  messages={messages}
                  structuredSessions={[interviewSessionState]}
                  questionMemory={questionMemory}
                  onQuestionMemoryChange={setQuestionMemory}
                  systemDesignCanvas={systemDesignCanvas}
                  onPracticeMock={startPracticeMock}
                  onOpenWorkspace={openWorkspace}
                  beginnerMode={beginnerMode}
                  onBeginnerModeChange={setBeginnerMode}
                  prepProgressState={prepProgressState}
                  focusMode={focusMode}
                  onNotify={showToast}
                  onBeginnerStepChange={setBeginnerStep}
                  onExportPlan={exportPrepPlan}
                  onToolkitStateChange={setToolkitState}
                />
              : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className="msg-anim" role="article" aria-label={msg.role==="user" ? "Your message" : "InterviewIQ response"} style={{ display:"flex", gap: isMobile?8:10, marginBottom: isMobile?14:18, flexDirection: msg.role==="user"?"row-reverse":"row", alignItems:"flex-start" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: msg.role==="user"?techTheme.accentSoft:"rgba(168,85,247,.12)", border: msg.role==="user"?`1px solid ${techTheme.accentBorder}`:"1px solid rgba(168,85,247,.25)", fontSize:13 }}>
                        <i className={`ti ${msg.role==="user"?"ti-user":"ti-robot"}`} style={{ color: msg.role==="user"?techTheme.accentStrong:"#c084fc" }} />
                      </div>
                      <div className={`glass-card ${msg.role==="user" ? "user-message" : "assistant-message"}`} style={{ maxWidth: isMobile?"88%":"82%", border: msg.role==="user"?`1px solid ${techTheme.accentBorder}`:"1px solid rgba(255,255,255,.07)", borderRadius: msg.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px", padding: isMobile?"9px 12px":"10px 14px" }}>
                        {msg.role==="assistant" && idx>0 && <ScoreBadge content={msg.content} />}
                        {msg.role==="user"
                          ? <div style={{ fontSize: isMobile?13:13.5, color:techTheme.accentText, lineHeight:1.65, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{msg.content}</div>
                          : msg.content
                            ? <MessageContent content={msg.content} />
                            : <TypingDots />
                        }
                      </div>
                    </div>
                  ))}
                  <PostAnswerTools
                    profile={candidateProfile}
                    messages={messages}
                    selectedCat={selectedCat}
                    selectedSub={selectedSub}
                    weakSpots={weakSpots}
                    theme={techTheme}
                    loading={loading}
                    onAction={(prompt) => callAPI(prompt, { skipQuestionMemory: true })}
                  />
                </>
              )
            }
            </> : null}
          </div>

          {/* ── Input area ── */}
          {showComposer && <footer className="glass-chrome composer-footer" style={{ padding: isMobile ? (isKeyboardOpen ? "8px 10px" : "8px 10px 10px") : "10px 12px 12px", borderTop:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
            {mockTimerStatus !== "idle" && (
              <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, border: `1px solid ${techTheme.accentBorder}`, borderRadius: 8, padding: "6px 9px", background: techTheme.accentMuted }}>
                <span style={{ color: techTheme.accentText, fontSize: 11.5, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <i className="ti ti-clock" />Mock answer timer
                </span>
                <strong style={{ color: mockTimerStatus === "answering" ? techTheme.accentStrong : "#86efac", fontSize: 12 }}>{mockTimerLabel}</strong>
              </div>
            )}
            {showCodeTools && showCode && (
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11.5, color:"#6b7280", marginBottom:5, display:"flex", alignItems:"center", gap:6 }}>
                  <i className="ti ti-code" style={{ fontSize:13 }} />Code
                </div>
                <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)} rows={4} placeholder="// Paste your Code here…"
                  className="glass-input"
                  style={{ width:"100%", border:`1px solid ${techTheme.accentBorder}`, borderRadius:8, padding:"8px 12px", fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace', fontSize:12, color:"#c8d6e5", outline:"none", lineHeight:1.6 }} />
              </div>
            )}
            <div style={{ display:"flex", gap:7, alignItems:"flex-end" }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();callAPI(input);} }}
                rows={2} disabled={loading}
                aria-label="Message composer"
                placeholder={mode==="interview" ? "Type your answer… or use 📸/🎤" : "Ask anything about frontend, backend, DSA, system design, or databases…"}
                className="glass-input"
                style={{ flex:1, border:"1px solid rgba(255,255,255,.09)", borderRadius:9, padding:"9px 12px", fontSize: isMobile?14:13, color:"#e8e8f0", outline:"none", lineHeight:1.5, maxHeight:120 }} />

              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <button className="icon-btn" onClick={() => setShowScreen(true)} title="Analyze Screen" aria-label="Analyze Screen" style={{ width:30, height:30, fontSize:15 }}><i className="ti ti-screenshot" /></button>
                <button className={`icon-btn ${isListening?"recording":""}`} onClick={toggleVoice} title="Voice" aria-label="Voice" style={{ width:30, height:30, fontSize:15 }}><i className={`ti ${isListening?"ti-microphone-off":"ti-microphone"}`} /></button>
                {showCodeTools && <button className={`icon-btn ${showCode?"active":""}`} onClick={() => setShowCode(p=>!p)} title="Code" aria-label="Code" style={{ width:30, height:30, fontSize:15 }}><i className="ti ti-code" /></button>}
                <button onClick={() => callAPI(input)} disabled={!canSend||loading}
                  className={canSend&&!loading?"glass-button":""}
                  aria-label="Send"
                  style={{ width:30, height:30, borderRadius:7, border:canSend&&!loading?`1px solid ${techTheme.accentBorder}`:"none", background: canSend&&!loading?techTheme.accent:techTheme.accentMuted, color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor: canSend&&!loading?"pointer":"not-allowed" }}>
                  <i className="ti ti-send" />
                </button>
              </div>
            </div>

            {/* Desktop hint / Mobile mode bar */}
            {isMobile && !isKeyboardOpen ? (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
                <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:7, padding:2, border:"1px solid rgba(255,255,255,.07)", flex:"1 1 148px" }}>
                  {["interview","practice"].map(m => (
                    <button key={m} className={mode===m?"glass-button":""} onClick={() => setMode(m)} style={{ flex:1, padding:"5px 6px", fontSize:11, fontWeight:500, borderRadius:5, border:mode===m?`1px solid ${techTheme.accentBorder}`:"none", cursor:"pointer", color: mode===m?techTheme.accentText:"#6b7280", background: mode===m?techTheme.accentSoft:"transparent", textTransform:"capitalize" }}>{m}</button>
                  ))}
                </div>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  aria-label="Difficulty level"
                  className="glass-input"
                  style={{ fontSize:11, padding:"5px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none" }}>
                  {DIFFS.map(d => <option key={d}>{d}</option>)}
                </select>
                <select value={interviewMode} onChange={e => setInterviewMode(e.target.value)}
                  aria-label="Interview calibration mode"
                  className="glass-input"
                  style={{ fontSize:11, padding:"5px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none", minWidth:96 }}>
                  {INTERVIEW_MODES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
                <select value={roundStrategy} onChange={e => setRoundStrategy(e.target.value)}
                  aria-label="Round Strategy Mode"
                  className="glass-input"
                  style={{ fontSize:11, padding:"5px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none", minWidth:86 }}>
                  {ROUND_STRATEGY_MODES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
                <select value={interviewPanel} onChange={e => setInterviewPanel(e.target.value)}
                  aria-label="AI Interview Panel Mode"
                  className="glass-input"
                  style={{ fontSize:11, padding:"5px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", color:"#9ca3af", outline:"none", minWidth:120, flex:"1 1 120px" }}>
                  {INTERVIEW_PANEL_OPTIONS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
                <button className="glass-button" aria-label="Start mock round" onClick={startSession} disabled={!candidateProfile||!selectedCat||loading}
                  style={{ padding:"5px 12px", fontSize:11, fontWeight:600, borderRadius:7, border:`1px solid ${techTheme.accentBorder}`, color:techTheme.accentText, cursor: candidateProfile&&selectedCat&&!loading?"pointer":"not-allowed", opacity: candidateProfile&&selectedCat&&!loading?1:.4, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
                  <i className="ti ti-player-play" style={{ fontSize:10 }} />Start
                </button>
              </div>
            ) : null}
            {isMobile && !isKeyboardOpen && voiceHint ? (
              <div style={{ marginTop:6, fontSize:10.5, color:"#6b7280", lineHeight:1.4 }}>
                {voiceHint}
              </div>
            ) : (
              !isMobile && (
              <div style={{ marginTop:5, display:"flex", justifyContent:"space-between", fontSize:10.5, color:"#cbd5e1" }}>
                <span>{voiceHint || `${footerHint} · Keyboard Power Mode: / focus, ⌘K topics, ⌘↵ mock`}</span>
                <span style={{ color:"#9ca3af" }}>Created with love ❤️ by Sagar Krishna</span>
              </div>
              )
            )}
          </footer>}

          {/* ── Mobile bottom nav ── */}
          {isMobile && !isKeyboardOpen && (
            <div className="phone-bottom-nav">
              <MobileBottomNav
                accent={techTheme.accentStrong}
                items={[
                  { icon:"ti-home",           label:"Home",    action:goHome, active:activeTab==="chat" && messages.length===0 },
                  { icon:"ti-layout-sidebar", label:"Topics",  action:()=>setSidebar(p=>!p), active:sidebarOpen },
                  ...mobileWorkspaces.map((workspace) => ({
                    icon: workspace.icon,
                    label: workspace.shortLabel,
                    action:()=>toggleWorkspace(workspace.id),
                    active:activeTab===workspace.id,
                  })),
                  ...(showInterviewTools ? [
                    { icon:"ti-screenshot",      label:"Screen",  action:()=>setShowScreen(true) },
                    { icon:"ti-microphone",       label:"Voice",   action:toggleVoice, active:isListening, danger:isListening },
                    { icon:"ti-wave-sine",        label:"Review",  action:()=>setShowRecordingReview(true) },
                  ] : []),
                  ...(messages.length > 0 ? [{ icon:"ti-trash", label:"Clear", action:clearChat }] : []),
                  { icon:"ti-info-circle",      label:"Info",    action:()=>setShowSettings(true) },
                ]}
              />
            </div>
          )}

        </main>
      </div>

      {/* Responsive CSS injected via style tag */}
      <style>{`
        .desktop-workspace-nav,
        .tablet-workspace-menu,
        .compact-controls-menu {
          display: none !important;
        }
        @media (max-width: 760px) {
          .desktop-controls,
          .desktop-workspace-nav,
          .tablet-workspace-menu,
          .compact-controls-menu {
            display: none !important;
          }
        }
        @media (min-width: 761px) and (max-width: 1439px) {
          .desktop-controls,
          .desktop-workspace-nav,
          .phone-bottom-nav {
            display: none !important;
          }
          .tablet-workspace-menu,
          .compact-controls-menu {
            display: block !important;
          }
        }
        @media (min-width: 1440px) {
          .desktop-controls { display: flex !important; }
          .desktop-workspace-nav { display: contents !important; }
          .tablet-workspace-menu,
          .compact-controls-menu { display: none !important; }
        }
        @media (min-width: 1440px) and (max-width: 1799px) {
          .desktop-controls,
          .desktop-workspace-nav {
            display: none !important;
          }
          .tablet-workspace-menu,
          .compact-controls-menu {
            display: block !important;
          }
        }
        @media (hover: hover) {
          button:hover { opacity: .9; }
        }
        @media (max-width: 380px) {
          .wl-title { font-size: 16px !important; }
        }
        @media (max-width: 480px) {
          .welcome-screen {
            justify-content: flex-start !important;
            padding: 18px 20px 20px !important;
          }
          .prep-home-screen {
            padding: 12px 6px 18px !important;
          }
        }
        @media (max-height: 760px) {
          .profile-setup-screen {
            justify-content: flex-start !important;
            padding-top: 14px !important;
            padding-bottom: 24px !important;
          }
          .profile-setup-screen.keyboard-active {
            padding-top: 12px !important;
            padding-bottom: 24px !important;
          }
        }
        @media (max-width: 380px), (max-height: 760px) {
          .welcome-screen { padding-top: 12px !important; }
          .welcome-logo {
            width: 48px !important;
            height: 48px !important;
            margin-bottom: 14px !important;
          }
          .welcome-logo i { font-size: 22px !important; }
          .welcome-title { font-size: 18px !important; }
          .welcome-copy { margin-bottom: 18px !important; }
          .welcome-actions { margin-bottom: 18px !important; }
          .welcome-features {
            margin-top: 20px !important;
            gap: 14px !important;
          }
        }
      `}</style>
    </>
  );
}
