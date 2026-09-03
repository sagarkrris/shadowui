import { useCallback, useEffect, useRef, useState } from "react";

function snapshotFingerprint(snapshot) {
  try {
    return JSON.stringify(snapshot ?? null);
  } catch {
    return "";
  }
}

export function useCloudStateSync({ user, ready, snapshot, csrfToken = "", refreshCsrfToken, onRemoteState, onError, onStatus } = {}) {
  const [retryNonce, setRetryNonce] = useState(0);
  const hydratedUser = useRef("");
  const hydrated = useRef(false);
  const lastSavedFingerprint = useRef("");
  const pendingFingerprint = useRef("");
  const fingerprint = snapshotFingerprint(snapshot);

  useEffect(() => {
    if (!user || !ready || hydratedUser.current === user.id) return;

    hydratedUser.current = user.id;
    hydrated.current = false;
    lastSavedFingerprint.current = "";
    pendingFingerprint.current = "";
    onStatus?.("hydrating");

    fetch("/api/state")
      .then((response) => {
        if (!response.ok) throw new Error("Cloud hydration failed");
        return response.json();
      })
      .then((payload) => {
        if (payload.state) onRemoteState?.(payload.state);
        hydrated.current = true;
        onStatus?.("saved");
      })
      .catch((error) => {
        hydrated.current = true;
        onStatus?.("error");
        onError?.(error);
      });
  }, [onError, onRemoteState, onStatus, ready, user]);

  useEffect(() => {
    if (!user || !ready || hydratedUser.current !== user.id || !hydrated.current) return undefined;

    if (!fingerprint || fingerprint === lastSavedFingerprint.current || fingerprint === pendingFingerprint.current) return undefined;

    pendingFingerprint.current = fingerprint;
    onStatus?.("saving");
    let active = true;
    const saveSnapshot = async (requestToken, retriedAfterCsrfRefresh = false) => {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(requestToken ? { "X-CSRF-Token": requestToken } : {}),
        },
        body: JSON.stringify({ state: snapshot }),
      });
      if (response.status === 403 && !retriedAfterCsrfRefresh && refreshCsrfToken) {
        return saveSnapshot(await refreshCsrfToken(), true);
      }
      if (!response.ok) {
        const error = new Error("Cloud save failed");
        error.status = response.status;
        throw error;
      }
    };

    const timer = window.setTimeout(() => {
      saveSnapshot(csrfToken)
        .then(() => {
          if (!active) return;
          lastSavedFingerprint.current = fingerprint;
          pendingFingerprint.current = "";
          onStatus?.("saved");
        })
        .catch((error) => {
          if (!active) return;
          pendingFingerprint.current = "";
          onStatus?.("error");
          onError?.(error);
        });
    }, 500);

    return () => {
      active = false;
      window.clearTimeout(timer);
      if (pendingFingerprint.current === fingerprint) pendingFingerprint.current = "";
    };
  }, [csrfToken, fingerprint, onError, onStatus, ready, refreshCsrfToken, retryNonce, snapshot, user]);

  const retry = useCallback(() => {
    if (!user || !ready) return;
    hydratedUser.current = user.id;
    hydrated.current = true;
    lastSavedFingerprint.current = "";
    pendingFingerprint.current = "";
    setRetryNonce((value) => value + 1);
  }, [ready, user]);

  return { retry };
}
