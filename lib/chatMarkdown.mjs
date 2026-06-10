export function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function normalizeInlineMath(t) {
  return String(t)
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\mathcal\{O\}/g, "O")
    .replace(/\\gcd/g, "gcd")
    .replace(/\\pmod/g, "mod")
    .replace(/\\cdot/g, "*")
    .replace(/\\min/g, "min")
    .replace(/\\to/g, "->")
    .replace(/\\log/g, "log")
    .replace(/\\_/g, "_")
    .replace(/\^\{([^}]+)\}/g, "^$1")
    .replace(/\{([^{}]+)\}/g, "$1");
}

export function renderInline(t) {
  return escHtml(normalizeInlineMath(t))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
}
