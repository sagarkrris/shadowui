import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";

// ─── Data ──────────────────────────────────────────────────────────────────────
const TOPICS = [
  { cat: "Core Java",       icon: "ti-coffee",        color: "#f59e0b", subs: ["JVM & Memory Model","Concurrency & Threads","Collections Framework","Streams & Lambdas","Design Patterns","Generics & Reflection","Garbage Collection","Java 17–21 Features"] },
  { cat: "Spring Boot",     icon: "ti-leaf",           color: "#22c55e", subs: ["DI & IoC Container","REST API Design","Spring Security","Spring Data / JPA","AOP & Proxies","Testing Strategies","Actuator & Observability","Microservice Patterns"] },
  { cat: "Micronaut / OCI", icon: "ti-cloud",          color: "#38bdf8", subs: ["Micronaut Core","GraalVM Native Image","OCI Architecture","GCP Integration","Service Mesh / Istio","API Gateway","Kafka & Event Streaming"] },
  { cat: "DSA",             icon: "ti-binary-tree",    color: "#a78bfa", subs: ["Arrays & Strings","Linked Lists","Trees & Graphs","Dynamic Programming","Sorting & Searching","Stacks & Queues","Heaps & Priority Queues","Tries & Segment Trees"] },
  { cat: "System Design",   icon: "ti-topology-star",  color: "#f472b6", subs: ["HLD Patterns","Database Design","Caching Strategies","Message Queues","Scalability & Load","API Design","Real-world Systems"] },
  { cat: "Behavioral",      icon: "ti-users",          color: "#34d399", subs: ["Leadership & Ownership","Technical Decision Making","Conflict Resolution","Mentoring Junior Devs","Delivery Under Pressure","STAR Method Practice"] },
];
const CHIPS = ["Java Concurrency","LRU Cache in Java","URL Shortener Design","Spring Security JWT","Dijkstra's Algorithm","JVM GC Tuning","Kafka vs RabbitMQ","DP: Coin Change"];
const TOPIC_CHIPS = {
  "Core Java": ["JVM memory model questions","Java concurrency scenarios","Collections trade-offs","Streams and lambdas quiz","GC tuning interview"],
  "Spring Boot": ["Spring Security JWT questions","REST API design review","JPA pitfalls interview","AOP proxy deep dive","Spring Boot testing plan"],
  "Micronaut / OCI": ["Micronaut DI questions","GraalVM native image trade-offs","OCI architecture interview","Kafka event streaming design","API gateway scenarios"],
  DSA: ["Array and string drills","Tree and graph questions","Dynamic programming practice","Heap interview problems","Explain Dijkstra's algorithm"],
  "System Design": ["URL shortener design","Caching strategy interview","Message queue trade-offs","Database schema design","Scalability deep dive"],
  Behavioral: ["Leadership STAR questions","Conflict resolution practice","Mentoring story review","Delivery pressure scenario","Technical decision examples"],
};
const DIFFS = ["Easy","Medium","Hard","Tech Lead"];

function getQuickPrompts(selectedCat, selectedSub) {
  if (!selectedCat) return CHIPS;
  if (selectedSub) {
    if (selectedCat === "Behavioral") {
      return [
        `Ask STAR questions about ${selectedSub}`,
        `Give a strong ${selectedSub} answer`,
        `Evaluate my ${selectedSub} story`,
        `Follow-up questions for ${selectedSub}`,
      ];
    }
    if (selectedCat === "System Design") {
      return [
        `Ask HLD questions on ${selectedSub}`,
        `Design a system using ${selectedSub}`,
        `Trade-offs in ${selectedSub}`,
        `Common mistakes in ${selectedSub}`,
      ];
    }
    return [
      `Ask interview questions on ${selectedSub}`,
      `Explain ${selectedSub} deeply`,
      `Give Java examples for ${selectedSub}`,
      `Common mistakes in ${selectedSub}`,
    ];
  }
  return TOPIC_CHIPS[selectedCat] || CHIPS;
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function renderInline(t) {
  return escHtml(t)
    .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,"<em>$1</em>")
    .replace(/`([^`]+)`/g,'<span class="inline-code">$1</span>');
}
function parseMarkdown(raw) {
  return raw.split(/(```[\s\S]*?```)/g).map((p, i) => {
    if (p.startsWith("```")) {
      const lang = (p.match(/```(\w*)\n?/) || [])[1] || "java";
      const code = p.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
      const id = "cb" + Math.random().toString(36).slice(2);
      return (
        `<div class="code-block">` +
        `<div class="code-header"><span class="code-lang"><i class="ti ti-code"></i>${escHtml(lang)}</span>` +
        `<button class="code-copy" onclick="(function(){navigator.clipboard.writeText(document.getElementById('${id}').textContent)})()">` +
        `<i class="ti ti-copy"></i>Copy</button></div>` +
        `<pre class="code-body"><code id="${id}">${escHtml(code)}</code></pre></div>`
      );
    }
    return p.split("\n").filter(l => l.trim()).map(l => `<p style="margin-bottom:5px">${renderInline(l)}</p>`).join("");
  }).join("");
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang"><i className={`ti ti-code`} />{lang}</span>
        <button className="code-copy" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="code-body"><code>{code}</code></pre>
    </div>
  );
}

function MessageContent({ content }) {
  return (
    <div>
      {content.split(/(```[\s\S]*?```)/g).map((part, i) => {
        if (part.startsWith("```")) {
          const lang = (part.match(/```(\w*)\n?/) || [])[1] || "java";
          const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
          return <CodeBlock key={i} lang={lang} code={code} />;
        }
        return (
          <div key={i}>
            {part.split("\n").filter(l => l.trim()).map((line, j) => (
              <p key={j} style={{ marginBottom: 5, lineHeight: 1.72 }} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center", padding:"8px 2px" }}>
      {[0,1,2].map(i => <div key={i} className="dot" style={{ animationDelay:`${i*.2}s` }} />)}
    </div>
  );
}

function ScoreBadge({ content }) {
  const m = content.match(/Score:\s*(\d+)\/10/i);
  if (!m) return null;
  const s = parseInt(m[1]);
  const c = s >= 8 ? "#22c55e" : s >= 6 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 10px", borderRadius:20, background:`${c}20`, border:`1px solid ${c}40`, color:c, fontSize:11, fontWeight:600, marginBottom:8 }}>
      <i className="ti ti-star-filled" style={{ fontSize:10 }} />{s}/10
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`} style={{ position:"fixed", top:14, right:14, zIndex:9999 }}>
      <i className={`ti ${type==="success"?"ti-check":type==="error"?"ti-x":"ti-info-circle"}`} />{msg}
    </div>
  );
}

// ─── Sidebar drawer ────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, expandedCat, selectedCat, selectedSub, onToggleCat, onSelectSub, isMobile }) {
  return (
    <>
      {/* Backdrop (mobile only) */}
      {isMobile && open && (
        <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:40, backdropFilter:"blur(2px)" }} />
      )}
      <aside style={{
        width: isMobile ? 260 : (open ? 220 : 0),
        minWidth: isMobile ? undefined : (open ? 220 : 0),
        position: isMobile ? "fixed" : "relative",
        top: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        height: isMobile ? "100%" : undefined,
        zIndex: isMobile ? 50 : undefined,
        transform: isMobile ? (open ? "translateX(0)" : "translateX(-100%)") : undefined,
        background:"#0d0d1a",
        borderRight:"1px solid rgba(255,255,255,.06)",
        display:"flex", flexDirection:"column",
        transition:"all .25s cubic-bezier(.4,0,.2,1)",
        overflow:"hidden", flexShrink:0,
      }}>
        {/* Header */}
        <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"rgba(99,102,241,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <i className="ti ti-code" style={{ fontSize:14, color:"#818cf8" }} />
            </div>
            <span style={{ fontSize:13, fontWeight:600, color:"#c7d2fe", whiteSpace:"nowrap" }}>Java Interview AI</span>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background:"none", border:"none", color:"#6b7280", fontSize:22, lineHeight:1, cursor:"pointer", padding:"2px 4px" }}>×</button>
          )}
        </div>

        {/* Topics */}
        <div style={{ flex:1, overflowY:"auto", padding:"5px 0" }}>
          {TOPICS.map(t => {
            const isActive = selectedCat === t.cat;
            const isExp = expandedCat === t.cat;
            return (
              <div key={t.cat}>
                <button onClick={() => onToggleCat(t.cat)} style={{
                  width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 16px",
                  background:"none", border:"none", borderLeft:`2px solid ${isActive?"#6366f1":"transparent"}`,
                  background: isActive ? "rgba(99,102,241,.08)" : "transparent",
                  textAlign:"left", color: isActive?"#c7d2fe":"#9ca3af", cursor:"pointer", transition:"all .12s",
                  minHeight:42,
                }}>
                  <i className={`ti ${t.icon}`} style={{ fontSize:16, color: isActive?t.color:"#4b5563", flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:13, fontWeight: isActive?500:400, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.cat}</span>
                  <i className={`ti ti-chevron-${isExp?"up":"down"}`} style={{ fontSize:11, color:"#374151", flexShrink:0 }} />
                </button>
                {isExp && t.subs.map(sub => (
                  <button key={sub} onClick={() => onSelectSub(t.cat, sub)} style={{
                    width:"100%", display:"block", padding:"7px 16px 7px 38px", background:"none",
                    background: selectedSub===sub ? "rgba(99,102,241,.07)" : "transparent",
                    border:"none", textAlign:"left", fontSize:12.5,
                    color: selectedSub===sub ? "#818cf8" : "#6b7280",
                    fontWeight: selectedSub===sub ? 500 : 400, cursor:"pointer",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", minHeight:36,
                  }}>{sub}</button>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ padding:"11px 16px", borderTop:"1px solid rgba(255,255,255,.06)", fontSize:11, color:"#1f2937", flexShrink:0 }}>
          Java Tech Lead Prep · Free
        </div>
      </aside>
    </>
  );
}

// ─── Screen Capture Modal ──────────────────────────────────────────────────────
function ScreenModal({ onCapture, onClose }) {
  const [preview, setPreview] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [context, setContext] = useState("");
  const [capturing, setCapturing] = useState(false);
  const fileRef = useRef();

  const capture = async () => {
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video");
      video.srcObject = stream;
      await new Promise(r => { video.onloadedmetadata = r; });
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      stream.getTracks().forEach(t => t.stop());
      const url = canvas.toDataURL("image/png");
      setPreview(url); setImgData(url.split(",")[1]);
    } catch(e) { if (e.name !== "NotAllowedError") alert("Capture failed: " + e.message); }
    setCapturing(false);
  };

  const onFile = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setPreview(ev.target.result); setImgData(ev.target.result.split(",")[1]); };
    r.readAsDataURL(f);
  };

  const onDrop = e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0]; if (!f || !f.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = ev => { setPreview(ev.target.result); setImgData(ev.target.result.split(",")[1]); };
    r.readAsDataURL(f);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"0 0 0", backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#0f0f1a", border:"1px solid rgba(99,102,241,.25)", borderRadius:"16px 16px 0 0",
        padding:20, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto",
      }}>
        {/* Handle bar */}
        <div style={{ width:36, height:4, background:"rgba(255,255,255,.1)", borderRadius:2, margin:"0 auto 16px" }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <span style={{ fontSize:15, fontWeight:600, color:"#e8e8f0", display:"flex", alignItems:"center", gap:8 }}>
            <i className="ti ti-screenshot" style={{ color:"#818cf8" }} />Analyze Screen
          </span>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#6b7280", fontSize:22, cursor:"pointer" }}>×</button>
        </div>

        {!preview ? (
          <div onDragOver={e => e.preventDefault()} onDrop={onDrop}
            style={{ border:"2px dashed rgba(99,102,241,.25)", borderRadius:12, padding:"32px 20px", textAlign:"center", marginBottom:14, cursor:"pointer" }}
            onClick={() => fileRef.current?.click()}>
            <i className="ti ti-photo-scan" style={{ fontSize:36, color:"#4b5563", display:"block", marginBottom:12 }} />
            <p style={{ fontSize:13, color:"#6b7280", marginBottom:16, lineHeight:1.6 }}>Drag & drop a screenshot or tap to upload</p>
            <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={e => { e.stopPropagation(); capture(); }} disabled={capturing}
                style={{ padding:"9px 16px", background:"rgba(99,102,241,.12)", border:"1px solid rgba(99,102,241,.3)", borderRadius:9, color:"#a5b4fc", fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
                <i className="ti ti-screenshot" />{capturing ? "Capturing…" : "Share Screen"}
              </button>
              <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                style={{ padding:"9px 16px", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:9, color:"#9ca3af", fontSize:13, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", gap:7 }}>
                <i className="ti ti-upload" />Upload Image
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom:14 }}>
            <img src={preview} alt="Preview" style={{ width:"100%", borderRadius:8, border:"1px solid rgba(255,255,255,.08)", marginBottom:8 }} />
            <button onClick={() => { setPreview(null); setImgData(null); }}
              style={{ fontSize:12, color:"#6b7280", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>↺ Change image</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={onFile} />

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, color:"#9ca3af", display:"block", marginBottom:5 }}>Context <span style={{ color:"#4b5563" }}>(optional)</span></label>
          <input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Focus on optimal DP approach…"
            style={{ width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#e8e8f0", outline:"none" }} />
        </div>

        <button onClick={() => imgData && onCapture(imgData, context)} disabled={!imgData} style={{
          width:"100%", padding:11, background: imgData?"rgba(99,102,241,.15)":"rgba(99,102,241,.05)",
          border:`1px solid ${imgData?"rgba(99,102,241,.4)":"rgba(99,102,241,.1)"}`,
          borderRadius:10, color: imgData?"#a5b4fc":"#4b5563", fontSize:13, fontWeight:600,
          cursor: imgData?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
          <i className="ti ti-robot" />Analyze with AI
        </button>
      </div>
    </div>
  );
}

// ─── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0f0f1a",
          border: "1px solid rgba(99,102,241,.25)",
          borderRadius: "16px 16px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 480
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: "rgba(255,255,255,.1)",
            borderRadius: 2,
            margin: "0 auto 16px"
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#e8e8f0"
            }}
          >
            ℹ️ About
          </span>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              fontSize: 22,
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#9ca3af",
            lineHeight: 1.8
          }}
        >
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: "#a5b4fc" }}>
              Java Interview Assistant
            </strong>
          </p>

          <p style={{ marginBottom: 12 }}>
            Designed & Developed by
            <strong style={{ color: "#ffffff" }}>
              {" "}Sagar Krishna
            </strong>
          </p>

          <p style={{ marginBottom: 12 }}>
            AI-powered Java Tech Lead interview preparation platform with:
          </p>

          <ul style={{ paddingLeft: 18 }}>
            <li>Mock Interviews</li>
            <li>DSA Practice</li>
            <li>Voice Input</li>
            <li>Screen Analysis</li>
            <li>Code Review</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Voice bar ─────────────────────────────────────────────────────────────────
function VoiceBar({ transcript, onStop }) {
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:100, background:"rgba(10,10,15,.96)", border:"1px solid rgba(239,68,68,.35)", borderRadius:12, padding:"11px 16px", display:"flex", alignItems:"center", gap:10, minWidth:260, maxWidth:"90vw", boxShadow:"0 8px 28px rgba(0,0,0,.5)" }}>
      <div style={{ width:9, height:9, borderRadius:"50%", background:"#ef4444", flexShrink:0, animation:"pulse 1.3s infinite" }} />
      <span style={{ flex:1, fontSize:13, color: transcript?"#e8e8f0":"#6b7280", lineHeight:1.4 }}>{transcript || "Listening… speak now"}</span>
      <button onClick={onStop} style={{ background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.3)", borderRadius:7, padding:"5px 11px", color:"#f87171", fontSize:12, cursor:"pointer" }}>Stop</button>
    </div>
  );
}

// ─── Welcome screen ────────────────────────────────────────────────────────────
function Welcome({ onChip, onScreen, onVoice, selectedCat, selectedSub }) {
  const topic = selectedSub || selectedCat;
  const quickPrompts = getQuickPrompts(selectedCat, selectedSub);

  return (
    <div className="welcome-screen" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 20px", textAlign:"center", overflowY:"auto" }}>
      <div className="welcome-logo" style={{ width:60, height:60, borderRadius:"50%", background:"rgba(99,102,241,.1)", border:"1px solid rgba(99,102,241,.25)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
        <i className="ti ti-code" style={{ fontSize:26, color:"#818cf8" }} />
      </div>
      <h1 className="welcome-title" style={{ fontSize:20, fontWeight:600, color:"#e8e8f0", marginBottom:8 }}>Java Tech Lead Interview AI</h1>
      {topic ? (
        <p className="welcome-copy" style={{ fontSize:13.5, color:"#6b7280", marginBottom:24, maxWidth:340, lineHeight:1.65 }}>
          {`Ready for ${topic}. Hit Start or pick a focused prompt below.`}
        </p>
      ) : (
      <p className="welcome-copy" style={{ fontSize:13.5, color:"#6b7280", marginBottom:24, maxWidth:340, lineHeight:1.65 }}>
        Select a topic from the sidebar, choose mode &amp; difficulty, then hit Start — or jump in below.
      </p>

      )}

      {/* Power tools */}
      <div className="welcome-actions" style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap", justifyContent:"center" }}>
        <button onClick={onScreen} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", background:"rgba(99,102,241,.08)", border:"1px solid rgba(99,102,241,.22)", borderRadius:10, color:"#a5b4fc", fontSize:13, fontWeight:500, cursor:"pointer" }}>
          <i className="ti ti-screenshot" />Analyze Screen
        </button>
        <button onClick={onVoice} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", background:"rgba(34,197,94,.07)", border:"1px solid rgba(34,197,94,.22)", borderRadius:10, color:"#86efac", fontSize:13, fontWeight:500, cursor:"pointer" }}>
          <i className="ti ti-microphone" />Voice Input
        </button>
      </div>

      {/* Quick chips */}
      <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", maxWidth:500 }}>
        {quickPrompts.map(c => (
          <button key={c} onClick={() => onChip(c)} style={{ padding:"6px 13px", fontSize:12, fontWeight:500, borderRadius:20, border:"1px solid rgba(99,102,241,.25)", background:"rgba(99,102,241,.06)", color:"#a5b4fc", cursor:"pointer" }}>
            {c}
          </button>
        ))}
      </div>

      <div className="welcome-features" style={{ marginTop:28, display:"flex", gap:20, fontSize:11, color:"#374151", flexWrap:"wrap", justifyContent:"center" }}>
        {[["ti-screenshot","Screen AI"],["ti-microphone","Voice"],["ti-code","Code Review"],["ti-bolt","Streaming"]].map(([ic, label]) => (
          <span key={label} style={{ display:"flex", alignItems:"center", gap:5 }}><i className={`ti ${ic}`} />{label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [messages, setMessages]       = useState([]);
  const [expandedCat, setExpanded]    = useState(null);
  const [selectedCat, setSelCat]      = useState(null);
  const [selectedSub, setSelSub]      = useState(null);
  const [mode, setMode]               = useState("interview");
  const [difficulty, setDifficulty]   = useState("Medium");
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
  const [toast, setToast]             = useState(null);

  const chatRef    = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);
  const recogRef   = useRef(null);
  const voiceFinal = useRef("");
  const toastTimer = useRef(null);

  // ── Viewport ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => { const m = window.innerWidth < 768; setIsMobile(m); if (!m) setSidebar(true); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const setViewportHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
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

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "info") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  // ── API call ──────────────────────────────────────────────────────────────
  const callAPI = useCallback(async (userText) => {
    if (loading || !userText.trim()) return;
    setLoading(true);

    const finalText = codeInput.trim()
      ? `${userText.trim()}\n\n\`\`\`java\n${codeInput.trim()}\n\`\`\``
      : userText.trim();
    setInput(""); setCodeInput(""); setShowCode(false);

    const newMsgs = [...messages, { role:"user", content:finalText }];
    setMessages([...newMsgs, { role:"assistant", content:"", streaming:true }]);

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: newMsgs }), signal: abortRef.current.signal,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Request failed"); }

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
          try { const p = JSON.parse(data); if (p.text) { aiText += p.text; setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:true}; return u; }); } } catch {}
        }
      }
      setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:false}; return u; });
    } catch(err) {
      if (err.name !== "AbortError") {
        setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:"⚠️ "+(err.message||"Something went wrong."),streaming:false}; return u; });
        showToast(err.message || "API error", "error");
      }
    } finally { setLoading(false); }
  }, [messages, codeInput, loading, showToast]);

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
        body: JSON.stringify({ imageBase64:b64, mimeType:"image/png", context:ctx }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error||"Screen analysis failed"); }

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
          try { const p = JSON.parse(data); if (p.text) { aiText += p.text; setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:true}; return u; }); } } catch {}
        }
      }
      setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:aiText,streaming:false}; return u; });
    } catch(err) {
      if (err.name !== "AbortError") {
        setMessages(prev => { const u=[...prev]; u[u.length-1]={role:"assistant",content:"⚠️ "+(err.message||"Screen analysis error"),streaming:false}; return u; });
        showToast("Screen analysis failed", "error");
      }
    } finally { setLoading(false); }
  }, [messages, loading, showToast]);

  // ── Voice ─────────────────────────────────────────────────────────────────
  const stopVoice = useCallback(() => {
  if (recogRef.current) {
    recogRef.current.stop();
  }

  setListening(false);
}, []);

  const startVoice = useCallback(() => {
  const SR =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SR) {
    showToast("Voice requires Chrome or Edge", "error");
    return;
  }

  try {
    const recognition = new SR();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    voiceFinal.current = "";

    recognition.onstart = () => {
      setListening(true);
      setVoiceText("");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = voiceFinal.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      voiceFinal.current = finalText;

      setVoiceText(
        (finalText + interim).trim()
      );
    };

    recognition.onerror = (event) => {
      console.error(event);

      setListening(false);

      showToast(
        "Voice recognition error",
        "error"
      );
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
    console.error(err);

    showToast(
      "Could not start voice input",
      "error"
    );
  }
}, [callAPI, showToast]);

  const toggleVoice = () => isListening ? stopVoice() : startVoice();

  // ── Session start ─────────────────────────────────────────────────────────
  const startSession = () => {
    if (!selectedCat || loading) return;
    const topic = selectedSub || selectedCat;
    const prompt = mode === "interview"
      ? `Start a mock Tech Lead interview on "${topic}". Difficulty: ${difficulty}. Ask your first question.`
      : `Give me a comprehensive ${difficulty}-level practice session on "${topic}". Include working Java code.`;
    setMessages([]);
    setActiveTab("chat");
    setTimeout(() => callAPI(prompt), 50);
  };

  const clearChat = () => {
    abortRef.current?.abort(); setMessages([]); setLoading(false);
  };

  // ── Sidebar handlers ──────────────────────────────────────────────────────
  const handleToggleCat = (cat) => {
    setExpanded(p => p === cat ? null : cat);
    setSelCat(cat); setSelSub(null);
  };
  const handleSelectSub = (cat, sub) => {
    setSelCat(cat); setSelSub(sub);
    if (isMobile) setSidebar(false);
  };

  const currentLabel = selectedSub || selectedCat;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Java Interview Assistant</title>
        <meta name="description" content="Java Tech Lead AI Interview Assistant" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Voice bar */}
      {isListening && <VoiceBar transcript={voiceText} onStop={stopVoice} />}

      {/* Screen modal */}
      {showScreen && <ScreenModal onCapture={analyzeScreen} onClose={() => setShowScreen(false)} />}

      {/* Settings modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* App shell */}
      <div style={{ display:"flex", height:"calc(var(--vh, 1vh) * 100)", overflow:"hidden" }}>

        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen} onClose={() => setSidebar(false)}
          expandedCat={expandedCat} selectedCat={selectedCat} selectedSub={selectedSub}
          onToggleCat={handleToggleCat} onSelectSub={handleSelectSub}
          isMobile={isMobile}
        />

        {/* Main */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>

          {/* ── Top bar ── */}
          <header style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 12px", borderBottom:"1px solid rgba(255,255,255,.06)", background:"#0a0a0f", flexShrink:0, minHeight:52 }}>
            <button className="icon-btn" onClick={() => setSidebar(p => !p)} title="Topics">
              <i className="ti ti-menu-2" />
            </button>

            <span style={{ flex:1, fontSize:13, fontWeight:500, color: currentLabel?"#e8e8f0":"#4b5563", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {currentLabel || "Select a topic"}
            </span>

            {/* Desktop-only controls */}
            <div style={{ display:"flex", alignItems:"center", gap:6 }} className="desktop-controls">
              <button className="icon-btn" onClick={() => setShowScreen(true)} title="Analyze Screen"><i className="ti ti-screenshot" /></button>
              <button className={`icon-btn ${isListening?"recording":""}`} onClick={toggleVoice} title="Voice"><i className={`ti ${isListening?"ti-microphone-off":"ti-microphone"}`} /></button>

              <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:7, padding:2, border:"1px solid rgba(255,255,255,.07)" }}>
                {["interview","practice"].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ padding:"3px 10px", fontSize:11, fontWeight:500, borderRadius:5, border:"none", cursor:"pointer", color: mode===m?"#a5b4fc":"#6b7280", background: mode===m?"rgba(99,102,241,.18)":"transparent", textTransform:"capitalize" }}>{m}</button>
                ))}
              </div>

              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                style={{ fontSize:11, padding:"3px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", background:"rgba(255,255,255,.04)", color:"#9ca3af", outline:"none" }}>
                {DIFFS.map(d => <option key={d}>{d}</option>)}
              </select>

              <button onClick={startSession} disabled={!selectedCat || loading}
                style={{ padding:"4px 12px", fontSize:12, fontWeight:600, borderRadius:7, border:"1px solid rgba(99,102,241,.4)", background:"rgba(99,102,241,.1)", color:"#a5b4fc", cursor: selectedCat&&!loading?"pointer":"not-allowed", opacity: selectedCat&&!loading?1:.4, display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-player-play" style={{ fontSize:11 }} />Start
              </button>
            </div>

            {messages.length > 0 && (
              <button className="icon-btn" onClick={clearChat} title="Clear"><i className="ti ti-trash" /></button>
            )}
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Info"><i className="ti ti-info-circle" /></button>
          </header>

          {/* ── Chat area ── */}
          <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding: isMobile?"12px 10px":"20px 16px", display:"flex", flexDirection:"column" }}>
            {messages.length === 0 && !loading
              ? <Welcome
                  onChip={t => callAPI(t)}
                  onScreen={() => setShowScreen(true)}
                  onVoice={toggleVoice}
                  selectedCat={selectedCat}
                  selectedSub={selectedSub}
                />
              : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx} className="msg-anim" style={{ display:"flex", gap: isMobile?8:10, marginBottom: isMobile?14:18, flexDirection: msg.role==="user"?"row-reverse":"row", alignItems:"flex-start" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background: msg.role==="user"?"rgba(99,102,241,.15)":"rgba(168,85,247,.12)", border: msg.role==="user"?"1px solid rgba(99,102,241,.3)":"1px solid rgba(168,85,247,.25)", fontSize:13 }}>
                        <i className={`ti ${msg.role==="user"?"ti-user":"ti-robot"}`} style={{ color: msg.role==="user"?"#818cf8":"#c084fc" }} />
                      </div>
                      <div style={{ maxWidth: isMobile?"88%":"82%", background: msg.role==="user"?"rgba(99,102,241,.1)":"rgba(255,255,255,.03)", border: msg.role==="user"?"1px solid rgba(99,102,241,.2)":"1px solid rgba(255,255,255,.07)", borderRadius: msg.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px", padding: isMobile?"9px 12px":"10px 14px" }}>
                        {msg.role==="assistant" && idx>0 && <ScoreBadge content={msg.content} />}
                        {msg.role==="user"
                          ? <div style={{ fontSize: isMobile?13:13.5, color:"#c7d2fe", lineHeight:1.65, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{msg.content}</div>
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
          <footer style={{ padding: isMobile?"8px 10px 10px":"10px 12px 12px", borderTop:"1px solid rgba(255,255,255,.06)", background:"#0a0a0f", flexShrink:0 }}>
            {showCode && (
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11.5, color:"#6b7280", marginBottom:5, display:"flex", alignItems:"center", gap:6 }}>
                  <i className="ti ti-code" style={{ fontSize:13 }} />Java code
                </div>
                <textarea value={codeInput} onChange={e => setCodeInput(e.target.value)} rows={4} placeholder="// Paste your Java code here…"
                  style={{ width:"100%", background:"#0d0d1a", border:"1px solid rgba(99,102,241,.2)", borderRadius:8, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:"#c8d6e5", outline:"none", lineHeight:1.6 }} />
              </div>
            )}
            <div style={{ display:"flex", gap:7, alignItems:"flex-end" }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();callAPI(input);} }}
                rows={2} disabled={loading}
                placeholder={mode==="interview" ? "Type your answer… or use 📸/🎤" : "Ask anything about Java or DSA…"}
                style={{ flex:1, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:9, padding:"9px 12px", fontSize: isMobile?14:13, color:"#e8e8f0", outline:"none", lineHeight:1.5, maxHeight:120 }} />

              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <button className="icon-btn" onClick={() => setShowScreen(true)} title="Analyze Screen" style={{ width:30, height:30, fontSize:15 }}><i className="ti ti-screenshot" /></button>
                <button className={`icon-btn ${isListening?"recording":""}`} onClick={toggleVoice} title="Voice" style={{ width:30, height:30, fontSize:15 }}><i className={`ti ${isListening?"ti-microphone-off":"ti-microphone"}`} /></button>
                <button className={`icon-btn ${showCode?"active":""}`} onClick={() => setShowCode(p=>!p)} title="Code" style={{ width:30, height:30, fontSize:15 }}><i className="ti ti-code" /></button>
                <button onClick={() => callAPI(input)} disabled={(!input.trim()&&!codeInput.trim())||loading}
                  style={{ width:30, height:30, borderRadius:7, border:"none", background: (input.trim()||codeInput.trim())&&!loading?"#6366f1":"rgba(99,102,241,.3)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor: (input.trim()||codeInput.trim())&&!loading?"pointer":"not-allowed" }}>
                  <i className="ti ti-send" />
                </button>
              </div>
            </div>

            {/* Desktop hint / Mobile mode bar */}
            {isMobile ? (
              <div style={{ marginTop:8, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                <div style={{ display:"flex", background:"rgba(255,255,255,.04)", borderRadius:7, padding:2, border:"1px solid rgba(255,255,255,.07)", flex:1 }}>
                  {["interview","practice"].map(m => (
                    <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"5px 6px", fontSize:11, fontWeight:500, borderRadius:5, border:"none", cursor:"pointer", color: mode===m?"#a5b4fc":"#6b7280", background: mode===m?"rgba(99,102,241,.18)":"transparent", textTransform:"capitalize" }}>{m}</button>
                  ))}
                </div>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  style={{ fontSize:11, padding:"5px 6px", borderRadius:6, border:"1px solid rgba(255,255,255,.09)", background:"rgba(255,255,255,.04)", color:"#9ca3af", outline:"none" }}>
                  {DIFFS.map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={startSession} disabled={!selectedCat||loading}
                  style={{ padding:"5px 12px", fontSize:11, fontWeight:600, borderRadius:7, border:"1px solid rgba(99,102,241,.4)", background:"rgba(99,102,241,.1)", color:"#a5b4fc", cursor: selectedCat&&!loading?"pointer":"not-allowed", opacity: selectedCat&&!loading?1:.4, display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
                  <i className="ti ti-player-play" style={{ fontSize:10 }} />Start
                </button>
              </div>
            ) : (
              <div style={{ marginTop:5, display:"flex", justifyContent:"space-between", fontSize:10.5, color:"#1f2937" }}>
                <span>📸 screen · 🎤 voice · 💻 code · Enter to send</span>
                <span>Powered by Gemini · Free</span>
              </div>
            )}
          </footer>

          {/* ── Mobile bottom nav ── */}
          {isMobile && (
            <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-around", padding:"6px 8px", borderTop:"1px solid rgba(255,255,255,.06)", background:"#0d0d1a", flexShrink:0, paddingBottom:"max(6px, env(safe-area-inset-bottom))" }}>
              {[
                { icon:"ti-layout-sidebar", label:"Topics",  action:()=>setSidebar(p=>!p), active:sidebarOpen },
                { icon:"ti-screenshot",      label:"Screen",  action:()=>setShowScreen(true) },
                { icon:"ti-microphone",       label:"Voice",   action:toggleVoice, active:isListening, danger:isListening },
                { icon:"ti-trash",            label:"Clear",   action:clearChat, disabled:messages.length===0 },
                { icon:"ti-info-circle",      label:"Info",    action:()=>setShowSettings(true) },
              ].map(({ icon, label, action, active, danger, disabled }) => (
                <button key={label} onClick={action} disabled={disabled}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", color: danger?"#f87171":active?"#818cf8":"#6b7280", fontSize:10, padding:"6px 10px", borderRadius:8, cursor:disabled?"not-allowed":"pointer", opacity:disabled?.35:1, minWidth:48, transition:"all .15s" }}>
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
        @media (max-width: 767px) {
          .desktop-controls { display: none !important; }
        }
        @media (min-width: 768px) {
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
