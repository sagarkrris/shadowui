import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";
import CompanyPrep from "../components/company/CompanyPrep";
import MessageContent from "../components/chat/MessageContent";
import ScoreBadge from "../components/chat/ScoreBadge";
import TechBackground from "../components/TechBackground";
import TypingDots from "../components/chat/TypingDots";
import AgenticUICourse from "../components/course/AgenticUICourse";
import ScreenModal from "../components/modals/ScreenModal";
import SettingsModal from "../components/modals/SettingsModal";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import VoiceBar from "../components/VoiceBar";
import ProfileSetup from "../components/welcome/ProfileSetup";
import Welcome from "../components/welcome/Welcome";
import { deriveWeakSpots } from "../lib/companyPrep.mjs";
import { createHomeNavigationState, createTopicSelectionNavigationState } from "../lib/homeNavigation.mjs";
import { buildUserPrepLabel, getDisplayName, getStackGreeting } from "../lib/personalization.mjs";
import { deriveMockScores } from "../lib/prepCoach.mjs";
import { getPrepLabel, getRecommendedTopics } from "../lib/prepTopics.mjs";
import { DEFAULT_PROFILE, DIFFS } from "../lib/prompts.mjs";
import { createSessionSnapshot, loadSessionSnapshot, saveSessionSnapshot } from "../lib/sessionPersistence.mjs";
import { getTechTheme } from "../lib/techTheme.mjs";
import { canUseChatComposer, canUseInterviewTools, canUsePrepTopics, shouldShowCodeTools } from "../lib/uiVisibility.mjs";
import { getStableViewportHeight, isCompactViewport } from "../lib/viewportMode.mjs";
import { buildSpeechTranscript, getVoiceErrorMessage, getVoiceSupport } from "../lib/voiceSupport.mjs";

const MOCK_ANSWER_SECONDS = 120;
const INTERVIEW_MODES = [
  { key: "strict", label: "Strict Interviewer" },
  { key: "coach", label: "Coach Mode" },
  { key: "barRaiser", label: "Bar Raiser" },
  { key: "behavioralStar", label: "Behavioral STAR" },
];
const ROUND_STRATEGY_MODES = [
  { key: "recruiter", label: "Recruiter" },
  { key: "coding", label: "Coding" },
  { key: "systemDesign", label: "System Design" },
  { key: "manager", label: "Manager" },
  { key: "final", label: "Final" },
];

function normalizeInterviewMode(value) {
  if (INTERVIEW_MODES.some((item) => item.key === value)) return value;
  return "strict";
}

function normalizeRoundStrategy(value) {
  if (ROUND_STRATEGY_MODES.some((item) => item.key === value)) return value;
  return "coding";
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
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab]     = useState("chat");
  const [sessionReady, setSessionReady] = useState(false);
  const [toast, setToast]             = useState(null);
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(DEFAULT_PROFILE);
  const [voiceHint, setVoiceHint]     = useState("");
  const [mockTimerEndsAt, setMockTimerEndsAt] = useState(null);
  const [mockTimerRemaining, setMockTimerRemaining] = useState(MOCK_ANSWER_SECONDS);
  const [mockTimerStatus, setMockTimerStatus] = useState("idle");

  const chatRef    = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);
  const recogRef   = useRef(null);
  const voiceFinal = useRef("");
  const toastTimer = useRef(null);
  const visibleTopics = getRecommendedTopics(candidateProfile);
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

  // ── Local session persistence ────────────────────────────────────────────
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
      setDifficulty(savedSession.difficulty);
      setActiveTab(savedSession.activeTab);
    }
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
        difficulty,
        activeTab,
      }),
    );
  }, [sessionReady, candidateProfile, profileDraft, messages, selectedCat, selectedSub, expandedCat, mode, interviewMode, roundStrategy, difficulty, activeTab]);

  // ── Viewport ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => { const m = isCompactViewport(window.innerWidth); setIsMobile(m); if (!m) setSidebar(true); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const setViewportHeight = () => {
      const height = getStableViewportHeight({
        innerHeight: window.innerHeight,
        visualViewportHeight: window.visualViewport?.height,
      });
      document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
    };
    setViewportHeight();
    window.addEventListener("resize", setViewportHeight);
    window.visualViewport?.addEventListener("resize", setViewportHeight);
    return () => {
      window.removeEventListener("resize", setViewportHeight);
      window.visualViewport?.removeEventListener("resize", setViewportHeight);
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
        body: JSON.stringify({ messages: apiMessages, profile: candidateProfile, interviewMode: interviewMode, roundStrategy }), signal: abortRef.current.signal,
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
    } catch(err) {
      if (err.name !== "AbortError") {
        setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:"⚠️ "+(err.message||"Something went wrong."),streaming:false}; return u; });
        showToast(err.message || "API error", "error");
      }
    } finally {
      setLoading(false);
      if (options.startAnswerTimer) {
        setMockTimerRemaining(MOCK_ANSWER_SECONDS);
        setMockTimerEndsAt(Date.now() + MOCK_ANSWER_SECONDS * 1000);
        setMockTimerStatus("answering");
      }
    }
  }, [messages, codeInput, loading, showToast, candidateProfile, techTheme.key, showCodeTools, mockTimerStatus, interviewMode, roundStrategy]);

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

  const startPracticeMock = ({ prompt, question }) => {
    setActiveTab("chat");
    callAPI(prompt, {
      displayText: `Practice as mock: ${question}`,
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
    const prompt = mode === "interview"
      ? `Start a ${style} mock interview for ${displayName} on "${topic}". Round Strategy Mode: ${round}. Difficulty: ${difficulty}. Ask your first question.`
      : `Give ${displayName} a comprehensive ${difficulty}-level practice session on "${topic}". Include working code when useful.`;
    setMessages([]);
    setActiveTab("chat");
    setMockTimerStatus("idle");
    setMockTimerEndsAt(null);
    setTimeout(() => callAPI(prompt, { startAnswerTimer: mode === "interview" }), 50);
  }, [callAPI, candidateProfile, difficulty, displayName, interviewMode, loading, mode, roundStrategy, selectedCat, selectedSub]);

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

  const currentLabel = selectedSub || selectedCat;
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>InterviewIQ</title>
        <meta name="description" content="AI-powered interview intelligence for modern software engineers" />
        <meta name="theme-color" content={techTheme.surface} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Voice bar */}
      {isListening && <VoiceBar transcript={voiceText} onStop={stopVoice} />}

      {/* Screen modal */}
      {showScreen && <ScreenModal theme={techTheme} onCapture={analyzeScreen} onClose={() => setShowScreen(false)} />}

      {/* Settings modal */}
      {showSettings && <SettingsModal theme={techTheme} onClose={() => setShowSettings(false)} />}

      {/* App shell */}
      <div style={{ ...themeVars, position:"relative", isolation:"isolate", display:"flex", height:"calc(var(--vh, 1vh) * 100)", overflow:"hidden", background:techTheme.surface }}>
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
        <main className="glass-panel" style={{ position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* ── Top bar ── */}
          <header className="glass-chrome" style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderBottom:"1px solid rgba(255,255,255,.08)", flexShrink:0, minHeight:52 }}>
            <button className={`icon-btn ${activeTab==="chat" && messages.length===0 ? "active" : ""}`} onClick={goHome} title="Home" aria-label="Home">
              <i className="ti ti-home" />
            </button>
            <button className="icon-btn" onClick={() => setSidebar(p => !p)} title="Topics" aria-label="Topics">
              <i className="ti ti-menu-2" />
            </button>
            <button className={`icon-btn ${activeTab==="company"?"active":""}`} onClick={() => setActiveTab(activeTab==="company"?"chat":"company")} title="Company Prep" aria-label="Company Prep">
              <i className="ti ti-building" />
            </button>
            <button className={`icon-btn ${activeTab==="course"?"active":""}`} onClick={() => setActiveTab(activeTab==="course"?"chat":"course")} title="Agentic UI Course" aria-label="Agentic UI Course">
              <i className="ti ti-sparkles" />
            </button>

            <span style={{ flex:1, fontSize:13, fontWeight:500, color: currentLabel?"#e8e8f0":"#4b5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {activeTab === "course" ? "Agentic UI Course" : activeTab === "company" ? (candidateProfile ? `Company Prep for ${displayName}` : "Company Prep") : candidateProfile ? `${stackGreeting.salutation}${currentLabel ? ` · ${currentLabel}` : ""}` : "Tell us your target role"}
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

              <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:7, padding:2, border:"1px solid rgba(255,255,255,.07)" }}>
                {["interview","practice"].map(m => (
                <button key={m} className={mode===m?"glass-button":""} onClick={() => setMode(m)} style={{ padding:"3px 10px", fontSize:11, fontWeight:500, borderRadius:5, border:mode===m?`1px solid ${techTheme.accentBorder}`:"none", cursor:"pointer", color: mode===m?techTheme.accentText:"#6b7280", background: mode===m?techTheme.accentSoft:"transparent", textTransform:"capitalize" }}>{m}</button>
                ))}
              </div>

              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
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

              <button className="glass-button" onClick={startSession} disabled={!candidateProfile || !selectedCat || loading}
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

          {/* ── Chat area ── */}
          <div ref={chatRef} className="chat-scroll" role="log" aria-live="polite" aria-relevant="additions text" aria-label="Conversation messages" style={{ flex:1, overflowY:"auto", padding: isMobile?"12px 10px":"20px 16px", display:"flex", flexDirection:"column" }}>
            {activeTab === "course" ? (
              <AgenticUICourse theme={techTheme} variant="full" />
            ) : activeTab === "company" ? (
              <CompanyPrep theme={techTheme} weakSpots={weakSpots} mockScores={mockScores} messages={messages} selectedCat={selectedCat} selectedSub={selectedSub} onMock={startCompanyMock} />
            ) : messages.length === 0 && !loading
              ? !candidateProfile
                ? <ProfileSetup theme={techTheme} draft={profileDraft} onChange={setProfileDraft} onSubmit={saveProfile} />
                : <Welcome
                  onChip={t => callAPI(t)}
                  onScreen={() => setShowScreen(true)}
                  onVoice={toggleVoice}
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
                  onPracticeMock={startPracticeMock}
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
                </>
              )
            }
          </div>

          {/* ── Input area ── */}
          {showComposer && <footer className="glass-chrome" style={{ padding: isMobile?"8px 10px 10px":"10px 12px 12px", borderTop:"1px solid rgba(255,255,255,.08)", flexShrink:0 }}>
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
            {isMobile ? (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:7, padding:2, border:"1px solid rgba(255,255,255,.07)", flex:1 }}>
                  {["interview","practice"].map(m => (
                    <button key={m} className={mode===m?"glass-button":""} onClick={() => setMode(m)} style={{ flex:1, padding:"5px 6px", fontSize:11, fontWeight:500, borderRadius:5, border:mode===m?`1px solid ${techTheme.accentBorder}`:"none", cursor:"pointer", color: mode===m?techTheme.accentText:"#6b7280", background: mode===m?techTheme.accentSoft:"transparent", textTransform:"capitalize" }}>{m}</button>
                  ))}
                </div>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
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
                <button className="glass-button" onClick={startSession} disabled={!candidateProfile||!selectedCat||loading}
                  style={{ padding:"5px 12px", fontSize:11, fontWeight:600, borderRadius:7, border:`1px solid ${techTheme.accentBorder}`, color:techTheme.accentText, cursor: candidateProfile&&selectedCat&&!loading?"pointer":"not-allowed", opacity: candidateProfile&&selectedCat&&!loading?1:.4, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
                  <i className="ti ti-player-play" style={{ fontSize:10 }} />Start
                </button>
              </div>
            ) : null}
            {isMobile && voiceHint ? (
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
          {isMobile && (
            <nav className="glass-chrome" style={{ display:"flex", alignItems:"center", justifyContent:"space-around", padding:"6px 8px", borderTop:"1px solid rgba(255,255,255,.08)", flexShrink:0, paddingBottom:"max(6px, env(safe-area-inset-bottom))" }}>
              {[
                { icon:"ti-home",           label:"Home",    action:goHome, active:activeTab==="chat" && messages.length===0 },
                { icon:"ti-layout-sidebar", label:"Topics",  action:()=>setSidebar(p=>!p), active:sidebarOpen },
                { icon:"ti-building",        label:"Company", action:()=>setActiveTab(activeTab==="company"?"chat":"company"), active:activeTab==="company" },
                { icon:"ti-sparkles",        label:"Course",  action:()=>setActiveTab(activeTab==="course"?"chat":"course"), active:activeTab==="course" },
                ...(showInterviewTools ? [
                  { icon:"ti-screenshot",      label:"Screen",  action:()=>setShowScreen(true) },
                  { icon:"ti-microphone",       label:"Voice",   action:toggleVoice, active:isListening, danger:isListening },
                ] : []),
                ...(messages.length > 0 ? [{ icon:"ti-trash", label:"Clear", action:clearChat }] : []),
                { icon:"ti-info-circle",      label:"Info",    action:()=>setShowSettings(true) },
              ].map(({ icon, label, action, active, danger, disabled }) => (
                <button key={label} onClick={action} disabled={disabled}
                  aria-label={label}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", color: danger?"#f87171":active?techTheme.accentStrong:"#6b7280", fontSize:10, padding:"6px 10px", borderRadius:8, cursor:disabled?"not-allowed":"pointer", opacity:disabled?.35:1, minWidth:48, transition:"all .15s" }}>
                  <i className={`ti ${icon}`} style={{ fontSize:20 }} />
                  {label}
                </button>
              ))}
            </nav>
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
            padding-bottom: 180px !important;
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
