import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";
import CompanyPrep from "../components/company/CompanyPrep";
import MessageContent from "../components/chat/MessageContent";
import PostAnswerTools from "../components/chat/PostAnswerTools";
import ScoreBadge from "../components/chat/ScoreBadge";
import TechBackground from "../components/TechBackground";
import TypingDots from "../components/chat/TypingDots";
import { DesktopWorkspaceNav, MobileBottomNav } from "../components/app/WorkspaceNav";
import AgenticUICourse from "../components/course/AgenticUICourse";
import DesignLab from "../components/design-lab/DesignLab";
import DsaVisualLab from "../components/dsa/DsaVisualLab";
import ScenarioBank from "../components/scenario-bank/ScenarioBank";
import RecordingReviewModal from "../components/modals/RecordingReviewModal";
import ScreenModal from "../components/modals/ScreenModal";
import SettingsModal from "../components/modals/SettingsModal";
import SystemDesignCanvas from "../components/system-design/SystemDesignCanvas";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import VoiceBar from "../components/VoiceBar";
import ProfileSetup from "../components/welcome/ProfileSetup";
import Welcome from "../components/welcome/Welcome";
import { buildInterviewRecordingReviewPrompt } from "../lib/interviewRecordingReview.mjs";
import { INTERVIEW_PANELISTS, normalizeInterviewPanel } from "../lib/interviewPanel.mjs";
import { deriveWeakSpots } from "../lib/companyPrep.mjs";
import { createHomeNavigationState, createTopicSelectionNavigationState } from "../lib/homeNavigation.mjs";
import { buildUserPrepLabel, getDisplayName, getStackGreeting } from "../lib/personalization.mjs";
import { deriveMockScores } from "../lib/prepCoach.mjs";
import { getPrepLabel, getRecommendedTopics } from "../lib/prepTopics.mjs";
import { loadQuestionMemory, recordQuestionAttempt } from "../lib/questionMemory.mjs";
import { DEFAULT_PROFILE, DIFFS } from "../lib/prompts.mjs";
import { createSessionSnapshot, loadSessionSnapshot, saveSessionSnapshot } from "../lib/sessionPersistence.mjs";
import { createSystemDesignCanvasState } from "../lib/systemDesignCanvas.mjs";
import { getTechTheme } from "../lib/techTheme.mjs";
import { canUseChatComposer, canUseInterviewTools, canUsePrepTopics, shouldShowCodeTools } from "../lib/uiVisibility.mjs";
import { getAppShellHeight, getStableViewportHeight, getVisibleViewportHeight, isCompactViewport, isVirtualKeyboardOpen } from "../lib/viewportMode.mjs";
import { buildSpeechTranscript, getVoiceErrorMessage, getVoiceSupport } from "../lib/voiceSupport.mjs";
import { getWorkspaceTitle, listDesktopWorkspaces, listMobileWorkspaces, normalizeWorkspaceTab } from "../lib/workspaces.mjs";

const MOCK_ANSWER_SECONDS = 120;
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
  const [activeTab, setActiveTab]     = useState("chat");
  const [questionMemory, setQuestionMemory] = useState({ questions: {} });
  const [systemDesignCanvas, setSystemDesignCanvas] = useState(() => createSystemDesignCanvasState());
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [toast, setToast]             = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(DEFAULT_PROFILE);
  const [voiceHint, setVoiceHint]     = useState("");
  const [aiHealth, setAiHealth]       = useState(null);
  const [mockTimerEndsAt, setMockTimerEndsAt] = useState(null);
  const [mockTimerRemaining, setMockTimerRemaining] = useState(MOCK_ANSWER_SECONDS);
  const [mockTimerStatus, setMockTimerStatus] = useState("idle");

  const chatRef    = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);
  const recogRef   = useRef(null);
  const voiceFinal = useRef("");
  const pendingPracticeCard = useRef(null);
  const toastTimer = useRef(null);
  const viewportBaselineHeight = useRef(0);
  const viewportWidthRef = useRef(0);
  const keyboardOpenRef = useRef(false);
  const viewportRestoreTimers = useRef([]);
  const visibleTopics = getRecommendedTopics(candidateProfile || profileDraft);
  const techTheme = getTechTheme(candidateProfile?.stack || profileDraft.stack);
  const prepLabel = getPrepLabel(candidateProfile?.stack || profileDraft.stack);
  const displayName = getDisplayName(candidateProfile);
  const stackGreeting = getStackGreeting(candidateProfile);
  const userPrepLabel = candidateProfile ? buildUserPrepLabel(candidateProfile) : prepLabel;
  const weakSpots = deriveWeakSpots(messages);
  const mockScores = deriveMockScores(messages);
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
  const toggleWorkspace = (workspaceId) => {
    setActiveTab(activeTab === workspaceId ? "chat" : workspaceId);
  };
  const openWorkspace = (workspaceId) => {
    setActiveTab(normalizeWorkspaceTab(workspaceId));
    if (isMobile) setSidebar(false);
  };

  // ── Local session persistence ────────────────────────────────────────────
  // QUESTION_MEMORY_STORAGE_KEY is owned by lib/questionMemory.mjs; this shell loads the durable memory through its helpers.
  useEffect(() => {
    const savedSession = loadSessionSnapshot(window.localStorage);
    if (savedSession) {
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
    }
    setQuestionMemory(loadQuestionMemory(window.localStorage));
    setSessionReady(true);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;

    saveSessionSnapshot(
      window.localStorage,
      createSessionSnapshot({
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
      }),
    );
  }, [sessionReady, candidateProfile, profileDraft, messages, selectedCat, selectedSub, expandedCat, mode, interviewMode, roundStrategy, interviewPanel, difficulty, activeTab]);

  useEffect(() => {
    let active = true;
    fetch("/api/models")
      .then((response) => response.json())
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

  // ── Viewport ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => { const m = isCompactViewport(window.innerWidth); setIsMobile(m); if (!m) setSidebar(true); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
          interviewMode: options.interviewMode || interviewMode,
          roundStrategy: options.roundStrategy || roundStrategy,
          interviewPanel: options.interviewPanel || interviewPanel,
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
  }, [messages, codeInput, loading, showToast, candidateProfile, techTheme.key, showCodeTools, mockTimerStatus, interviewMode, roundStrategy, interviewPanel, selectedCat, selectedSub]);

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

      if (finalSpeech) {
        callAPI(finalSpeech);
      }

      voiceFinal.current = "";
      setVoiceText("");
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
}, [callAPI, showToast]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopVoice();
      return;
    }

    startVoice();
  }, [isListening, startVoice, stopVoice]);

  const startCompanyMock = (prompt) => {
    setActiveTab("chat");
    callAPI(prompt);
  };

  const startCanvasAction = (prompt) => {
    setActiveTab("chat");
    callAPI(prompt, {
      roundStrategy: "systemDesign",
      interviewPanel: "systemDesignArchitect",
      displayText: "System canvas review",
      skipQuestionMemory: true,
    });
  };

  const startDesignLabAction = (prompt) => {
    setActiveTab("chat");
    callAPI(prompt, {
      roundStrategy: "systemDesign",
      interviewPanel: "systemDesignArchitect",
      displayText: "Design Lab practice",
      skipQuestionMemory: true,
    });
  };

  const startScenarioBankAction = (prompt, metadata = {}) => {
    setActiveTab("chat");
    callAPI(prompt, {
      roundStrategy: metadata?.state?.track === "database" ? "systemDesign" : "coding",
      interviewPanel: metadata?.state?.track === "database" ? "systemDesignArchitect" : "seniorEngineer",
      displayText: "Scenario Bank practice",
      skipQuestionMemory: true,
    });
  };

  const startDsaLabPractice = (prompt) => {
    setActiveTab("chat");
    callAPI(prompt, {
      roundStrategy: "coding",
      interviewPanel: "seniorEngineer",
      displayText: "DSA Visual Lab practice",
      skipQuestionMemory: true,
    });
  };

  const goHome = () => {
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
  };

  const openCourse = () => {
    setActiveTab("course");
    if (isMobile) setSidebar(false);
  };

  const startPracticeMock = ({ prompt, question, card, pack }) => {
    if (card) {
      pendingPracticeCard.current = { card, pack };
    }
    setActiveTab("chat");
    callAPI(prompt, {
      displayText: `Practice as mock: ${question}`,
    });
  };

  const submitRecordingReview = ({ review, prompt, transcript }) => {
    setShowRecordingReview(false);
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
    setTimeout(() => callAPI(prompt, { startAnswerTimer: mode === "interview" }), 50);
  }, [callAPI, candidateProfile, difficulty, displayName, interviewMode, interviewPanel, loading, mode, roundStrategy, selectedCat, selectedSub]);

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
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Voice bar */}
      {isListening && <VoiceBar transcript={voiceText} onStop={stopVoice} />}

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
      {showSettings && <SettingsModal theme={techTheme} onClose={() => setShowSettings(false)} />}

      {/* App shell */}
      <div style={{ ...themeVars, position:"fixed", inset:0, isolation:"isolate", display:"flex", height:appShellHeight, overflow:"hidden", background:techTheme.surface }}>
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

          {/* ── Top bar ── */}
          <header className="glass-chrome" style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0, minHeight:52 }}>
            <button className={`icon-btn ${activeTab==="chat" && messages.length===0 ? "active" : ""}`} onClick={goHome} title="Home" aria-label="Home">
              <i className="ti ti-home" />
            </button>
            <button className="icon-btn" onClick={() => setSidebar(p => !p)} title="Topics" aria-label="Topics">
              <i className="ti ti-menu-2" />
            </button>
            {!isMobile && (
              <DesktopWorkspaceNav
                activeTab={activeTab}
                workspaces={desktopWorkspaces}
                onToggleWorkspace={toggleWorkspace}
              />
            )}

            <span style={{ flex:1, fontSize:13, fontWeight:500, color: currentLabel?"#e8e8f0":"#4b5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {headerTitle}
            </span>
            {candidateProfile && (
              <span style={{ display:isMobile?"none":"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:999, border:`1px solid ${techTheme.accentBorder}`, background:techTheme.accentMuted, color:techTheme.accentText, fontSize:10.5, fontWeight:600, whiteSpace:"nowrap" }}>
                <i className={`ti ${techTheme.icon}`} style={{ fontSize:12 }} />{userPrepLabel}
              </span>
            )}

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

            {messages.length > 0 && (
              <button className="icon-btn" onClick={clearChat} title="Clear" aria-label="Clear"><i className="ti ti-trash" /></button>
            )}
            {candidateProfile && (
              <button className="icon-btn" onClick={() => { setProfileDraft(candidateProfile); setCandidateProfile(null); setMessages([]); }} title="Edit Profile" aria-label="Edit Profile"><i className="ti ti-user-cog" /></button>
            )}
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Info" aria-label="Info"><i className="ti ti-info-circle" /></button>
          </header>

          {aiHealth?.configured === false && (
            <div role="status" style={{ alignItems: "center", background: "rgba(250,204,21,.09)", borderBottom: "1px solid rgba(250,204,21,.18)", color: "#fde68a", display: "flex", flexShrink: 0, fontSize: 11.5, gap: 8, lineHeight: 1.4, padding: "7px 12px" }}>
              <i className="ti ti-alert-triangle" style={{ color: "#facc15", flexShrink: 0 }} />
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                AI provider not configured. Local Scenario Bank, DSA, Canvas, and Design Lab still work; set GEMINI_API_KEY to enable chat, screen, and generated drills.
              </span>
            </div>
          )}

          {/* ── Chat area ── */}
          <div ref={chatRef} className="chat-scroll" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation messages" style={{ flex:1, minHeight:0, overflowY:"auto", padding: isMobile?"12px 10px":"20px 16px", display:"flex", flexDirection:"column" }}>
            {activeTab === "course" ? (
              <AgenticUICourse theme={techTheme} variant="full" />
            ) : activeTab==="scenarioBank" ? (
              <ScenarioBank theme={techTheme} onAction={startScenarioBankAction} />
            ) : activeTab==="designLab" ? (
              <DesignLab theme={techTheme} onAction={startDesignLabAction} />
            ) : activeTab==="dsaLab" ? (
              <DsaVisualLab theme={techTheme} profile={candidateProfile || profileDraft} initialLessonId="arrays" onPractice={startDsaLabPractice} />
            ) : activeTab === "canvas" ? (
              <SystemDesignCanvas
                theme={techTheme}
                initialState={systemDesignCanvas}
                onChange={setSystemDesignCanvas}
                onAction={startCanvasAction}
              />
            ) : activeTab === "company" ? (
              <CompanyPrep theme={techTheme} weakSpots={weakSpots} mockScores={mockScores} messages={messages} selectedCat={selectedCat} selectedSub={selectedSub} onMock={startCompanyMock} />
            ) : messages.length === 0 && !loading
              ? !candidateProfile
                ? <ProfileSetup theme={techTheme} draft={profileDraft} onChange={setProfileDraft} onSubmit={saveProfile} keyboardOpen={isKeyboardOpen} />
                : <Welcome
                  onChip={t => callAPI(t)}
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
                  questionMemory={questionMemory}
                  onQuestionMemoryChange={setQuestionMemory}
                  systemDesignCanvas={systemDesignCanvas}
                  onPracticeMock={startPracticeMock}
                  onOpenWorkspace={openWorkspace}
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
          </div>

          {/* ── Input area ── */}
          {showComposer && <footer className="glass-chrome" style={{ padding: isMobile ? (isKeyboardOpen ? "8px 10px" : "8px 10px 10px") : "10px 12px 12px", borderTop:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
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
          )}

        </main>
      </div>

      {/* Responsive CSS injected via style tag */}
      <style>{`
        @media (max-width: 1023px) {
          .desktop-controls { display: none !important; }
        }
        @media (min-width: 1024px) {
          .desktop-controls { display: flex !important; }
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
