import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Topic data ───────────────────────────────────────────────────────────────
const TOPICS = [
  {
    cat: "Core Java",
    icon: "ti-coffee",
    color: "#f59e0b",
    topics: [
      "JVM & Memory Model",
      "Concurrency & Threads",
      "Collections Framework",
      "Streams & Lambdas",
      "Design Patterns",
      "Generics & Reflection",
      "Garbage Collection",
      "Java 17–21 Features",
    ],
  },
  {
    cat: "Spring Boot",
    icon: "ti-leaf",
    color: "#22c55e",
    topics: [
      "DI & IoC Container",
      "REST API Design",
      "Spring Security",
      "Spring Data / JPA",
      "AOP & Proxies",
      "Testing Strategies",
      "Actuator & Observability",
      "Microservice Patterns",
    ],
  },
  {
    cat: "Micronaut / OCI",
    icon: "ti-cloud",
    color: "#38bdf8",
    topics: [
      "Micronaut Core",
      "GraalVM Native Image",
      "OCI Architecture",
      "GCP Integration",
      "Service Mesh / Istio",
      "API Gateway",
      "Kafka & Event Streaming",
    ],
  },
  {
    cat: "DSA",
    icon: "ti-binary-tree",
    color: "#a78bfa",
    topics: [
      "Arrays & Strings",
      "Linked Lists",
      "Trees & Graphs",
      "Dynamic Programming",
      "Sorting & Searching",
      "Stacks & Queues",
      "Heaps & Priority Queues",
      "Tries & Segment Trees",
    ],
  },
  {
    cat: "System Design",
    icon: "ti-topology-star",
    color: "#f472b6",
    topics: [
      "HLD Patterns",
      "Database Design",
      "Caching Strategies",
      "Message Queues",
      "Scalability & Load",
      "API Design",
      "Real-world Systems",
    ],
  },
  {
    cat: "Behavioral",
    icon: "ti-users",
    color: "#34d399",
    topics: [
      "Leadership & Ownership",
      "Technical Decision Making",
      "Conflict Resolution",
      "Mentoring Junior Devs",
      "Delivery Under Pressure",
      "STAR Method Practice",
    ],
  },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Tech Lead"];

const QUICK_CHIPS = [
  "Java Concurrency",
  "LRU Cache in Java",
  "System Design: URL shortener",
  "Spring Security JWT",
  "Dijkstra's Algorithm",
  "JVM GC tuning",
  "Kafka vs RabbitMQ",
  "DP: Coin change",
];

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderInline(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code style="background:rgba(99,102,241,0.12);padding:1px 6px;border-radius:4px;font-family:\'JetBrains Mono\',monospace;font-size:12.5px;color:#a5b4fc">$1</code>'
    );
}

function MessageContent({ content }) {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const langMatch = part.match(/```(\w*)\n?/);
          const lang = langMatch?.[1] || "java";
          const code = part
            .replace(/```\w*\n?/, "")
            .replace(/```$/, "")
            .trim();
          return (
            <CodeBlock key={i} lang={lang} code={code} />
          );
        }
        const lines = part.split("\n").filter((l) => l !== "");
        return (
          <div key={i} style={{ fontSize: 14, lineHeight: 1.75 }}>
            {lines.map((line, j) => (
              <p
                key={j}
                style={{ marginBottom: j < lines.length - 1 ? 6 : 0 }}
                dangerouslySetInnerHTML={{ __html: renderInline(line) }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">
          <i className="ti ti-code" style={{ marginRight: 5, fontSize: 13 }} />
          {lang}
        </span>
        <button className="code-copy" onClick={copy}>
          <i
            className={`ti ${copied ? "ti-check" : "ti-copy"}`}
            style={{ marginRight: 4 }}
          />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="code-body">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        gap: 5,
        alignItems: "center",
        padding: "10px 0",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

// ─── Welcome screen ───────────────────────────────────────────────────────────
function WelcomeScreen({ onChip }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(99,102,241,0.12)",
          border: "1px solid rgba(99,102,241,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <i className="ti ti-code" style={{ fontSize: 28, color: "#818cf8" }} />
      </div>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#e8e8f0",
          marginBottom: 8,
        }}
      >
        Java Tech Lead Interview Assistant
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#6b7280",
          marginBottom: 28,
          maxWidth: 380,
          lineHeight: 1.6,
        }}
      >
        Select a topic from the sidebar, choose interview or practice mode, then
        hit Start. Or jump straight in with a quick topic below.
      </p>
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: 520,
        }}
      >
        {QUICK_CHIPS.map((c) => (
          <button key={c} className="chip" onClick={() => onChip(c)}>
            {c}
          </button>
        ))}
      </div>
      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 24,
          fontSize: 12,
          color: "#374151",
        }}
      >
        {[
          { icon: "ti-award", label: "Tech Lead level" },
          { icon: "ti-bolt", label: "Streaming responses" },
          { icon: "ti-code", label: "Code evaluation" },
        ].map(({ icon, label }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ content }) {
  const match = content.match(/Score:\s*(\d+)\/10/i);
  if (!match) return null;
  const score = parseInt(match[1]);
  const color =
    score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 20,
        background: `${color}20`,
        border: `1px solid ${color}40`,
        color,
        fontSize: 12,
        fontWeight: 600,
        marginBottom: 8,
      }}
    >
      <i className="ti ti-star-filled" style={{ fontSize: 11 }} />
      {score}/10
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages] = useState([]);
  const [expandedCat, setExpandedCat] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [mode, setMode] = useState("interview");
  const [difficulty, setDifficulty] = useState("Medium");
  const [input, setInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (userText) => {
      if (!userText.trim() || loading) return;

      const finalText = codeInput.trim()
        ? `${userText.trim()}\n\n\`\`\`java\n${codeInput.trim()}\n\`\`\``
        : userText.trim();

      setInput("");
      setCodeInput("");
      setShowCode(false);

      const newMessages = [
        ...messages,
        { role: "user", content: finalText },
      ];
      setMessages(newMessages);
      setLoading(true);

      // Placeholder for streaming assistant message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", streaming: true },
      ]);

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                assistantText += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantText,
                    streaming: true,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantText,
            streaming: false,
          };
          return updated;
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content:
                "⚠️ " +
                (err.message || "Something went wrong. Please try again."),
              streaming: false,
            };
            return updated;
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [messages, codeInput, loading]
  );

  const startSession = () => {
    if (!selectedTopic) return;
    const topic = selectedSub || selectedTopic;
    const prompt =
      mode === "interview"
        ? `Start a mock Tech Lead interview on "${topic}". Difficulty: ${difficulty}. Ask your first question.`
        : `Give me a comprehensive ${difficulty}-level practice session on "${topic}". Cover key concepts with examples and code.`;
    setMessages([]);
    setTimeout(() => sendMessage(prompt), 50);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setLoading(false);
  };

  const currentLabel = selectedSub || selectedTopic;

  return (
    <>
      <Head>
        <title>Java Interview Assistant</title>
      </Head>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: sidebarOpen ? 220 : 0,
            minWidth: sidebarOpen ? 220 : 0,
            overflow: "hidden",
            background: "#0f0f1a",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            transition: "width 0.2s ease, min-width 0.2s ease",
            flexShrink: 0,
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className="ti ti-code"
                style={{ fontSize: 15, color: "#818cf8" }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c7d2fe",
                whiteSpace: "nowrap",
              }}
            >
              Java Interview AI
            </span>
          </div>

          {/* Topic list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
            {TOPICS.map((t) => {
              const isExp = expandedCat === t.cat;
              const isActive = selectedTopic === t.cat;
              return (
                <div key={t.cat}>
                  <button
                    className={`topic-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setExpandedCat(isExp ? null : t.cat);
                      setSelectedTopic(t.cat);
                      setSelectedSub(null);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "8px 16px",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      color: isActive ? "#c7d2fe" : "#9ca3af",
                      cursor: "pointer",
                      borderLeft: `2px solid ${isActive ? "#6366f1" : "transparent"}`,
                    }}
                  >
                    <i
                      className={`ti ${t.icon}`}
                      style={{ fontSize: 16, color: isActive ? t.color : "#4b5563", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.cat}
                    </span>
                    <i
                      className={`ti ti-chevron-${isExp ? "up" : "down"}`}
                      style={{ fontSize: 11, color: "#374151", flexShrink: 0 }}
                    />
                  </button>

                  {isExp && (
                    <div>
                      {t.topics.map((sub) => {
                        const isSub = selectedSub === sub;
                        return (
                          <button
                            key={sub}
                            className={`subtopic-item ${isSub ? "active" : ""}`}
                            onClick={() => {
                              setSelectedTopic(t.cat);
                              setSelectedSub(sub);
                            }}
                            style={{
                              width: "100%",
                              display: "block",
                              padding: "5px 16px 5px 40px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: 12.5,
                              color: isSub ? "#818cf8" : "#6b7280",
                              fontWeight: isSub ? 500 : 400,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              fontSize: 11,
              color: "#374151",
            }}
          >
            Built for Java Tech Lead prep
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          {/* Top bar */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "#0a0a0f",
              flexShrink: 0,
            }}
          >
            <button
              className="icon-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              title="Toggle sidebar"
            >
              <i className="ti ti-menu-2" style={{ fontSize: 17 }} />
            </button>

            <span
              style={{
                flex: 1,
                fontSize: 13.5,
                fontWeight: 500,
                color: currentLabel ? "#e8e8f0" : "#4b5563",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentLabel || "Select a topic to begin"}
            </span>

            {/* Mode toggle */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 8,
                padding: 3,
                gap: 2,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {["interview", "practice"].map((m) => (
                <button
                  key={m}
                  className={`mode-btn ${mode === m ? "active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Difficulty */}
            <select
              className="diff-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            {/* Start */}
            <button
              className="start-btn"
              disabled={!selectedTopic || loading}
              onClick={startSession}
            >
              <i className="ti ti-player-play" style={{ fontSize: 12 }} />
              Start
            </button>

            {/* Clear */}
            {messages.length > 0 && (
              <button
                className="icon-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                <i className="ti ti-trash" style={{ fontSize: 16 }} />
              </button>
            )}
          </header>

          {/* Chat area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {messages.length === 0 && !loading ? (
              <WelcomeScreen onChip={(c) => sendMessage(c)} />
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="msg-animate"
                    style={{
                      display: "flex",
                      gap: 10,
                      marginBottom: 18,
                      flexDirection:
                        msg.role === "user" ? "row-reverse" : "row",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          msg.role === "user"
                            ? "rgba(99,102,241,0.15)"
                            : "rgba(168,85,247,0.12)",
                        border:
                          msg.role === "user"
                            ? "1px solid rgba(99,102,241,0.3)"
                            : "1px solid rgba(168,85,247,0.25)",
                      }}
                    >
                      <i
                        className={`ti ${msg.role === "user" ? "ti-user" : "ti-robot"}`}
                        style={{
                          fontSize: 14,
                          color:
                            msg.role === "user" ? "#818cf8" : "#c084fc",
                        }}
                      />
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        maxWidth: "80%",
                        background:
                          msg.role === "user"
                            ? "rgba(99,102,241,0.1)"
                            : "rgba(255,255,255,0.03)",
                        border:
                          msg.role === "user"
                            ? "1px solid rgba(99,102,241,0.2)"
                            : "1px solid rgba(255,255,255,0.07)",
                        borderRadius:
                          msg.role === "user"
                            ? "12px 12px 4px 12px"
                            : "12px 12px 12px 4px",
                        padding: "10px 14px",
                      }}
                    >
                      {msg.role === "assistant" && idx > 0 && (
                        <ScoreBadge content={msg.content} />
                      )}
                      {msg.role === "user" ? (
                        <div
                          style={{
                            fontSize: 14,
                            color: "#c7d2fe",
                            lineHeight: 1.65,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {msg.content}
                        </div>
                      ) : (
                        <MessageContent content={msg.content} />
                      )}
                      {msg.streaming && msg.content === "" && <TypingDots />}
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "rgba(168,85,247,0.12)",
                        border: "1px solid rgba(168,85,247,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className="ti ti-robot"
                        style={{ fontSize: 14, color: "#c084fc" }}
                      />
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "12px 12px 12px 4px",
                        padding: "12px 16px",
                      }}
                    >
                      <TypingDots />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <footer
            style={{
              padding: "12px 16px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "#0a0a0f",
              flexShrink: 0,
            }}
          >
            {/* Code editor (toggle) */}
            {showCode && (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <i
                    className="ti ti-code"
                    style={{ fontSize: 13, color: "#6b7280" }}
                  />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    Java code (optional)
                  </span>
                </div>
                <textarea
                  className="code-input"
                  rows={5}
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="// Paste your Java solution here..."
                />
              </div>
            )}

            {/* Message row */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                ref={inputRef}
                className="msg-input"
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  mode === "interview"
                    ? "Type your answer… (Enter to send, Shift+Enter for new line)"
                    : "Ask anything about Java or DSA…"
                }
                disabled={loading}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <button
                  className={`icon-btn ${showCode ? "active" : ""}`}
                  onClick={() => setShowCode((v) => !v)}
                  title={showCode ? "Hide code editor" : "Attach Java code"}
                >
                  <i className="ti ti-code" style={{ fontSize: 16 }} />
                </button>
                <button
                  className="send-btn"
                  disabled={(!input.trim() && !codeInput.trim()) || loading}
                  onClick={() => sendMessage(input)}
                  title="Send (Enter)"
                >
                  <i className="ti ti-send" style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                color: "#374151",
              }}
            >
              <span>Enter to send · Shift+Enter for new line</span>
              <span style={{ color: "#1f2937" }}>
                Powered by Gemini 2.0 Flash · Free tier
              </span>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}
