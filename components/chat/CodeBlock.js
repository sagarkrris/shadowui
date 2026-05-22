import { useState } from "react";

export default function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang"><i className="ti ti-code" />{lang}</span>
        <button className="code-copy" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} />{copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="code-body"><code>{code}</code></pre>
    </div>
  );
}
