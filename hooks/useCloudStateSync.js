import { useCallback, useEffect, useRef, useState } from "react";

export function useCloudStateSync({ user, ready, snapshot, csrfToken = "", refreshCsrfToken, onRemoteState, onError, onStatus } = {}) {
  const [retryNonce, setRetryNonce] = useState(0);
  const [hydratedFor, setHydratedFor] = useState("");
  const hydratedUser = useRef("");
  const lastSaved = useRef("");
  const queue = useRef(Promise.resolve());
  const latest = useRef(snapshot);
  const callbacks = useRef({ onRemoteState, onError, onStatus, refreshCsrfToken });
  useEffect(() => { latest.current = snapshot; callbacks.current = { onRemoteState, onError, onStatus, refreshCsrfToken }; });
  const fingerprint = JSON.stringify(snapshot ?? null);
  useEffect(() => {
    if (user) return;
    hydratedUser.current = "";
    setHydratedFor("");
    lastSaved.current = "";
  }, [user]);

  useEffect(() => {
    if (!user || !ready || hydratedFor === user.id) return undefined;
    const controller = new AbortController();
    let active = true;
    const initial = JSON.stringify(latest.current);
    callbacks.current.onStatus?.("hydrating");
    fetch("/api/state", { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Cloud hydration failed. Local work is preserved."); return response.json(); })
      .then(payload => {
        if (!active) return;
        // Editing during hydration always wins over a late remote response.
        const restoredLocally = sessionStorage.getItem("interviewiq.restoreLocal") === "1";
        if (restoredLocally) sessionStorage.removeItem("interviewiq.restoreLocal");
        if (!restoredLocally && payload.state && JSON.stringify(latest.current) === initial) callbacks.current.onRemoteState?.(payload.state);
        hydratedUser.current = user.id;
        setHydratedFor(user.id);
      })
      .catch(error => { if (!active) return; callbacks.current.onStatus?.("error"); callbacks.current.onError?.(error); });
    return () => { active = false; controller.abort(); };
  }, [user, ready, retryNonce, hydratedFor]);

  useEffect(() => {
    if (!user || !ready || hydratedFor !== user.id || fingerprint === lastSaved.current) return undefined;
    let active = true;
    callbacks.current.onStatus?.("saving");
    const timer = setTimeout(() => {
      // Serialize PUTs: an older slow save must never overwrite a newer snapshot.
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (!active) return;
        const save = async (token, retried = false) => {
          const response = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { "X-CSRF-Token": token } : {}) }, body: JSON.stringify({ state: snapshot }) });
          if (response.status === 403 && !retried && callbacks.current.refreshCsrfToken) return save(await callbacks.current.refreshCsrfToken(), true);
          if (!response.ok) throw new Error("Cloud save failed. Local work is preserved.");
        };
        try {
          await save(csrfToken);
          if (active) { lastSaved.current = fingerprint; callbacks.current.onStatus?.("saved"); }
        } catch (error) { if (active) { callbacks.current.onStatus?.("error"); callbacks.current.onError?.(error); } }
      });
    }, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [user, ready, hydratedFor, fingerprint, csrfToken, retryNonce, snapshot]);
  const retry = useCallback(() => { lastSaved.current = ""; setRetryNonce((value) => value + 1); }, []);
  return { retry };
}
