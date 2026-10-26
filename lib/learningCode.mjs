// A presentation lexer, not a Java parser. Tokens preserve the source verbatim;
// React renders each token as text, including markup inside strings/comments.
export function tokenizeJava(source = "") {
  const pattern = /("""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|\b(abstract|assert|boolean|break|byte|case|catch|char|class|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|record|return|sealed|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while|true|false|null)\b|\b(\d+(?:\.\d+)?[dDfFlL]?)\b/g;
  const tokens = [];
  let end = 0;
  for (const match of source.matchAll(pattern)) {
    if (match.index > end) tokens.push({ text: source.slice(end, match.index) });
    tokens.push({ text: match[0], kind: match[1] ? "string" : match[2] ? "comment" : match[3] ? "keyword" : "number" });
    end = match.index + match[0].length;
  }
  if (end < source.length) tokens.push({ text: source.slice(end) });
  return tokens;
}
