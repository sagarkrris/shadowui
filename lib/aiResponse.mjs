// Hosting proxies can return HTML or plain text on timeout. Never expose that body.
export async function readAiJsonResponse(response) {
  const requestId = response.headers.get('x-request-id');
  let payload;
  try { payload = await response.json(); } catch {
    const reason = response.status === 504 ? 'AI evaluation timed out. Your answer is saved.' : 'AI evaluation returned an unreadable response. Your answer is saved.';
    throw new Error(`${reason}${requestId ? ` (Request ID: ${requestId})` : ''}`);
  }
  if (!response.ok || !payload?.evaluation) {
    const id = requestId || payload?.requestId;
    throw new Error(`${payload?.error || 'Evaluation failed. Your answer is saved.'}${id ? ` (Request ID: ${id})` : ''}`);
  }
  return payload;
}
