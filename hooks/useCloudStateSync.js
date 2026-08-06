import { useEffect, useRef } from "react";

function snapshotFingerprint(snapshot) {
  try {
    return JSON.stringify(snapshot ?? null);
  } catch {
    return "";
  }
}

export function useCloudStateSync({ user, ready, snapshot, csrfToken = "", onRemoteState, onError, onStatus } = {}) {
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
    const timer = window.setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({ state: snapshot }),
      })
        .then((response) => {
          if (!response.ok) throw new Error("Cloud save failed");
          lastSavedFingerprint.current = fingerprint;
          pendingFingerprint.current = "";
          onStatus?.("saved");
        })
        .catch((error) => {
          pendingFingerprint.current = "";
          onStatus?.("error");
          onError?.(error);
        });
    }, 500);

    return () => {
      window.clearTimeout(timer);
      if (pendingFingerprint.current === fingerprint) pendingFingerprint.current = "";
    };
  }, [csrfToken, fingerprint, onError, onStatus, ready, user]);
}
