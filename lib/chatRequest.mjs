export function normalizeChatMessages(messages) {
  if (!Array.isArray(messages)) return null;

  const normalized = messages
    .map((message) => ({
      role: message?.role === "assistant" ? "assistant" : "user",
      content: typeof message?.content === "string" ? message.content.trim() : "",
    }))
    .filter((message) => message.content);

  return normalized.length ? normalized : null;
}

const HISTORY_TRUNCATION_NOTICE = "\n\n[Earlier message truncated for context.]";

function truncateForHistory(content, maxChars) {
  if (content.length <= maxChars) return content;
  const visibleChars = Math.max(0, maxChars - HISTORY_TRUNCATION_NOTICE.length);
  return `${content.slice(0, visibleChars)}${HISTORY_TRUNCATION_NOTICE}`;
}

// Keep the most recent turns useful without allowing an unusually long model
// response to make a later request fail server-side validation.
export function compactChatHistory(messages, { maxMessageChars = 11_000, maxTotalChars = 54_000 } = {}) {
  const normalized = normalizeChatMessages(messages) || [];
  const perMessageLimit = Math.max(1, Number(maxMessageChars) || 11_000);
  const totalLimit = Math.max(perMessageLimit, Number(maxTotalChars) || 54_000);
  const recent = [];
  let totalChars = 0;

  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const message = { ...normalized[index], content: truncateForHistory(normalized[index].content, perMessageLimit) };
    if (totalChars + message.content.length > totalLimit) break;
    recent.push(message);
    totalChars += message.content.length;
  }

  return recent.reverse();
}
