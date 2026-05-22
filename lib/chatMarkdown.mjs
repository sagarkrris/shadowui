export function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderInline(t) {
  return escHtml(t)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
}

export function parseMarkdown(raw) {
  return raw.split(/(```[\s\S]*?```)/g).map((p) => {
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
    return p.split("\n").filter((line) => line.trim()).map((line) => `<p style="margin-bottom:5px">${renderInline(line)}</p>`).join("");
  }).join("");
}
