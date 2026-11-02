import { useCallback, useEffect, useRef, useState } from "react";

export function useCloudStateSync({ user, ready, snapshot, csrfToken = "", refreshCsrfToken, onRemoteState, onError, onStatus } = {}) {
  const [conflict, setConflict] = useState(null);
  const revision = useRef(0);
  const currentUser = useRef(user?.id);
  useEffect(() => { currentUser.current = user?.id; }, [user?.id]);
  const blocked = useRef(false);
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
    hydratedUser.current = "";
    setHydratedFor("");
    lastSaved.current = ""; revision.current = 0; blocked.current = false; setConflict(null);
  }, [user?.id]);

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
        const local = latest.current;
        const session = local?.session || {};
        const hasLocalWork = Boolean(session.input || session.codeInput || session.messages?.length || session.practice?.attempts?.length || local?.applications?.length || Object.keys(local?.learningState || {}).length);
        if (!restoredLocally && payload.state && hasLocalWork && JSON.stringify(payload.state) !== JSON.stringify(local)) {
          blocked.current = true; setConflict(payload); callbacks.current.onStatus?.('conflict');
        } else if (!restoredLocally && payload.state && JSON.stringify(local) === initial) callbacks.current.onRemoteState?.(payload.state);
        revision.current = Number.isSafeInteger(payload.revision) ? payload.revision : 0;
        hydratedUser.current = user.id;
        setHydratedFor(user.id);
      })
      .catch(error => { if (!active) return; callbacks.current.onStatus?.("error"); callbacks.current.onError?.(error); });
    return () => { active = false; controller.abort(); };
  }, [user, ready, retryNonce, hydratedFor]);

  useEffect(() => {
    if (!user || !ready || blocked.current || hydratedFor !== user.id || fingerprint === lastSaved.current) return undefined;
    let active = true;
    callbacks.current.onStatus?.("saving");
    const timer = setTimeout(() => {
      // Serialize PUTs: an older slow save must never overwrite a newer snapshot.
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (!active || blocked.current) return;
        const save = async (token, retried = false) => {
          const response = await fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { "X-CSRF-Token": token } : {}) }, body: JSON.stringify({ state: snapshot, revision: revision.current }) });
          if (currentUser.current !== user.id) return false;
          if (response.status === 403 && !retried && callbacks.current.refreshCsrfToken) return save(await callbacks.current.refreshCsrfToken(), true);
          if (response.status === 409) {
            blocked.current = true;
            const remoteResponse = await fetch('/api/state');
            if (!remoteResponse.ok) throw new Error('Could not load the newer cloud copy. Retry sync to compare copies.');
            const remote = await remoteResponse.json();
            if (currentUser.current !== user.id) return false;
            setConflict(remote); callbacks.current.onStatus?.('conflict');
            return false;
          }
          if (!response.ok) throw new Error("Cloud save failed. Local work is preserved.");
          const payload = await response.json();
          revision.current = Number.isSafeInteger(payload.revision) ? payload.revision : revision.current + 1;
          return true;
        };
        try {
          const saved = await save(csrfToken);
          if (saved && active) { lastSaved.current = fingerprint; callbacks.current.onStatus?.("saved"); }
        } catch (error) { if (active) { callbacks.current.onStatus?.("error"); callbacks.current.onError?.(error); } }
      });
    }, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [user, ready, hydratedFor, fingerprint, csrfToken, retryNonce, snapshot]);
  const retry = useCallback(async () => {
    if (blocked.current && !conflict) {
      try { const response = await fetch('/api/state'); if (!response.ok) throw new Error('Could not compare cloud copies.'); const remote = await response.json(); if (currentUser.current !== user?.id) return; setConflict(remote); callbacks.current.onStatus?.('conflict'); }
      catch (error) { callbacks.current.onStatus?.('error'); callbacks.current.onError?.(error); }
      return;
    }
    lastSaved.current = ''; setRetryNonce((value) => value + 1);
  }, [conflict, user?.id]);
  const resolveConflict = useCallback((choice) => {
    if (!conflict) return;
    revision.current = Number.isSafeInteger(conflict.revision) ? conflict.revision : 0;
    if (choice === 'cloud') { try { callbacks.current.onRemoteState?.(conflict.state || { session: {} }); } catch (error) { callbacks.current.onError?.(error); return; } }
    blocked.current = false; setConflict(null); lastSaved.current = ''; setRetryNonce((value) => value + 1);
  }, [conflict]);
  return { retry, conflict, resolveConflict };
}
