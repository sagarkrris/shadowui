import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [deliveryWarning, setDeliveryWarning] = useState("");
  const [deliveryNotice, setDeliveryNotice] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const fetchCsrfToken = useCallback(async () => {
    const cookieToken = typeof document !== "undefined"
      ? document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith("interviewiq_csrf="))?.slice("interviewiq_csrf=".length) || ""
      : "";
    if (cookieToken) { setCsrfToken(cookieToken); return cookieToken; }
    const response = await fetch("/api/auth?action=csrf", { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
    if (!response.ok) throw new Error("CSRF setup failed");
    const payload = await response.json();
    const token = payload.csrfToken || "";
    if (!token) throw new Error("CSRF token missing");
    setCsrfToken(token);
    return token;
  }, []);
  useEffect(() => {
    Promise.all([fetchCsrfToken(), fetch("/api/auth?action=me", { cache: "no-store" }).then((response) => response.json())]).then(([, payload]) => { setUser(payload.user || null); }).catch(() => {}).finally(() => setReady(true));
  }, [fetchCsrfToken]);
  const submit = useCallback(async (action, credentials) => {
    setError("");
    setDeliveryWarning("");
    setDeliveryNotice("");
    const requestToken = await fetchCsrfToken().catch(() => csrfToken);
    const response = await fetch(`/api/auth?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", ...(requestToken ? { "X-CSRF-Token": requestToken } : {}) }, body: JSON.stringify(credentials) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Authentication failed."); return false; }
    if (payload.emailDelivery) {
      if (payload.emailDelivery.delivered) setDeliveryNotice("Verification email sent. Check your inbox and spam folder.");
      else setDeliveryWarning("Your account was created, but we could not send the verification email. Check email configuration, then use Resend verification email.");
    }
    setUser(payload.user || null);
    return true;
  }, [csrfToken, fetchCsrfToken]);
  const logout = useCallback(async () => { await fetch("/api/auth?action=logout", { method: "POST", headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }); setUser(null); }, [csrfToken]);
  const postAuthAction = useCallback(async (action, body = {}) => {
    setError("");
    setDeliveryWarning("");
    setDeliveryNotice("");
    const requestToken = action === "forgot" || action === "reset" ? await fetchCsrfToken().catch(() => csrfToken) : csrfToken;
    const response = await fetch(`/api/auth?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json", ...(requestToken ? { "X-CSRF-Token": requestToken } : {}) }, body: JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Account operation failed."); return payload; }
    if (payload.emailDelivery) {
      if (payload.emailDelivery.delivered) setDeliveryNotice("Verification email sent. Check your inbox and spam folder.");
      else setDeliveryWarning("We could not send the verification email. Check email configuration and try again later.");
    }
    return payload;
  }, [csrfToken, fetchCsrfToken]);
  const exportAccount = useCallback(async () => { const response = await fetch("/api/account?action=export", { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }); return response.json(); }, [csrfToken]);
  const deleteAccount = useCallback(async () => { const payload = await fetch("/api/account", { method: "DELETE", headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }).then((response) => response.json()); setUser(null); return payload; }, [csrfToken]);
  return { user, ready, error, deliveryWarning, deliveryNotice, csrfToken, login: (credentials) => submit("login", credentials), register: (credentials) => submit("register", credentials), logout, forgotPassword: (email) => postAuthAction("forgot", { email }), resetPassword: (token, password) => postAuthAction("reset", { token, password }), verifyEmail: (token) => postAuthAction("verify", { token }), resendVerification: () => postAuthAction("resend-verification"), revokeSessions: () => postAuthAction("revoke"), exportAccount, deleteAccount };
}
