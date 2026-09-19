const BASE = 'https://api.liveavatar.com/v1/sessions';
export async function liveAvatarRequest(path, body, headers, fetcher = fetch) {
  const response = await fetcher(`${BASE}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!response.ok) throw new Error('Avatar provider unavailable');
  const payload = await response.json();
  if (payload.code !== 100) throw new Error('Avatar provider rejected request');
  return payload.data;
}
export async function startBuddyAvatar(env = process.env, fetcher = fetch) {
  if (!env.LIVEAVATAR_API_KEY || !env.LIVEAVATAR_AVATAR_ID) return null;
  const token = await liveAvatarRequest('token', { mode: 'LITE', avatar_id: env.LIVEAVATAR_AVATAR_ID, is_sandbox: env.LIVEAVATAR_SANDBOX === '1', video_settings: { quality: 'medium', encoding: 'H264' }, ...(env.LIVEAVATAR_SANDBOX === '1' ? { max_session_duration: 60 } : {}) }, { 'X-API-KEY': env.LIVEAVATAR_API_KEY }, fetcher);
  if (!token?.session_token) throw new Error('Missing avatar session');
  try {
    const session = await liveAvatarRequest('start', null, { Authorization: `Bearer ${token.session_token}` }, fetcher);
    if (!session?.livekit_client_token || !/^wss:\/\//.test(session.livekit_url) || !/^wss:\/\//.test(session.ws_url)) throw new Error('Invalid avatar connection');
    return { sessionToken: token.session_token, roomUrl: session.livekit_url, roomToken: session.livekit_client_token, socketUrl: session.ws_url };
  } catch (error) {
    await stopBuddyAvatar(token.session_token, fetcher).catch(() => {});
    throw error;
  }
}
export function stopBuddyAvatar(token, fetcher = fetch) {
  return liveAvatarRequest('stop', { reason: 'USER_CLOSED' }, { Authorization: `Bearer ${token}` }, fetcher);
}
