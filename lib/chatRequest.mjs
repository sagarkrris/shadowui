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
