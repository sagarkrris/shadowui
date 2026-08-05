import { useCallback, useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/auth?action=me").then((response) => response.json()).then((payload) => setUser(payload.user || null)).catch(() => {}).finally(() => setReady(true));
  }, []);
  const submit = useCallback(async (action, credentials) => {
    setError("");
    const response = await fetch(`/api/auth?action=${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Authentication failed."); return false; }
    setUser(payload.user || null);
    return true;
  }, []);
  const logout = useCallback(async () => { await fetch("/api/auth?action=logout", { method: "POST" }); setUser(null); }, []);
  return { user, ready, error, login: (credentials) => submit("login", credentials), register: (credentials) => submit("register", credentials), logout };
}
