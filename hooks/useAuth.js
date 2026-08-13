import { useCallback, useEffect, useState } from "react";

function friendlyAuthError(message, status) {
  if (String(message || "").toLowerCase().includes("csrf")) return "Your security session expired. Refresh the page and try again.";
  if (status === 401 && String(message || "").toLowerCase().includes("invalid email or password")) return "Invalid email or password.";
  if (status === 401) return "Your sign-in session expired. Please sign in again.";
  if (status === 429) return "Too many attempts. Please wait a moment and try again.";
  return message || "Account operation failed. Please try again.";
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [deliveryWarning, setDeliveryWarning] = useState("");
  const [deliveryNotice, setDeliveryNotice] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const fetchCsrfToken = useCallback(async ({ force = false } = {}) => {
    const cookieToken = typeof document !== "undefined"
      ? document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("interviewiq_csrf="))?.slice("interviewiq_csrf=".length) || ""
      : "";
    if (cookieToken && !force) { setCsrfToken(cookieToken); return cookieToken; }
    if (force && typeof document !== "undefined") {
      document.cookie = "interviewiq_csrf=; Max-Age=0; Path=/; SameSite=Lax";
    }
    const csrfUrl = `/api/auth?action=csrf${force ? `&refresh=${Date.now()}` : ""}`;
    const response = await fetch(csrfUrl, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (!response.ok) throw new Error("CSRF setup failed");
    const payload = await response.json();
    const token = payload.csrfToken || "";
    if (!token) throw new Error("CSRF token missing");
    setCsrfToken(token);
    return token;
  }, []);
  const postWithCsrf = useCallback(async (action, body = {}) => {
    let requestToken = await fetchCsrfToken().catch(() => csrfToken);
    let response = await fetch(`/api/auth?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", ...(requestToken ? { "X-CSRF-Token": requestToken } : {}) }, body: JSON.stringify(body) });
    if (response.status === 403) {
      try { requestToken = await fetchCsrfToken({ force: true }); } catch { return response; }
      response = await fetch(`/api/auth?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", ...(requestToken ? { "X-CSRF-Token": requestToken } : {}) }, body: JSON.stringify(body) });
    }
    return response;
  }, [csrfToken, fetchCsrfToken]);
  useEffect(() => {
    Promise.all([fetchCsrfToken(), fetch("/api/auth?action=me", { cache: "no-store" }).then((response) => response.json())]).then(([, payload]) => { setUser(payload.user || null); }).catch(() => {}).finally(() => setReady(true));
  }, [fetchCsrfToken]);
  const submit = useCallback(async (action, credentials) => {
    setError("");
    setDeliveryWarning("");
    setDeliveryNotice("");
    const response = await postWithCsrf(action, credentials);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(friendlyAuthError(payload.error, response.status)); return false; }
    if (payload.emailDelivery) {
      if (payload.emailDelivery.delivered) setDeliveryNotice("Verification email sent. Check your inbox and spam folder.");
      else setDeliveryWarning("Your account was created, but we could not send the verification email. Check email configuration, then use Resend verification email.");
    }
    setUser(payload.user || null);
    return true;
  }, [postWithCsrf]);
  const logout = useCallback(async () => { await fetch("/api/auth?action=logout", { method: "POST", headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }); setUser(null); }, [csrfToken]);
  const postAuthAction = useCallback(async (action, body = {}) => {
    setError("");
    setDeliveryWarning("");
    setDeliveryNotice("");
    const response = await postWithCsrf(action, body);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(friendlyAuthError(payload.error, response.status)); return payload; }
    if (payload.emailDelivery) {
      if (payload.emailDelivery.delivered) setDeliveryNotice("Verification email sent. Check your inbox and spam folder.");
      else setDeliveryWarning(payload.emailDelivery.configured === false
        ? "Email delivery is not configured on this deployment, so no verification email was sent."
        : "We could not send the verification email. Check email configuration and try again later.");
    }
    return payload;
  }, [postWithCsrf]);
  const exportAccount = useCallback(async () => { const response = await fetch("/api/account?action=export", { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }); return response.json(); }, [csrfToken]);
  const deleteAccount = useCallback(async () => {
    setError("");
    const response = await fetch("/api/account", { method: "DELETE", headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(friendlyAuthError(payload.error, response.status)); return payload; }
    setUser(null);
    setCsrfToken("");
    if (payload.emailDelivery?.delivered) setDeliveryNotice("Account deleted. A confirmation email was sent.");
    else setDeliveryWarning("Account deleted, but the confirmation email could not be sent.");
    return payload;
  }, [csrfToken]);
  return { user, ready, error, deliveryWarning, deliveryNotice, csrfToken, login: (credentials) => submit("login", credentials), register: (credentials) => submit("register", credentials), logout, forgotPassword: (email) => postAuthAction("forgot", { email }), resetPassword: (token, password) => postAuthAction("reset", { token, password }), verifyEmail: (token) => postAuthAction("verify", { token }), resendVerification: () => postAuthAction("resend-verification"), revokeSessions: () => postAuthAction("revoke"), exportAccount, deleteAccount };
}
