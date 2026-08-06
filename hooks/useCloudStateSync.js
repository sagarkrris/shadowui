import { useEffect, useRef } from "react";

export function useCloudStateSync({ user, ready, snapshot, csrfToken = "", onRemoteState, onError, onStatus } = {}) {
  const hydratedUser = useRef("");
  useEffect(() => {
    if (!user || !ready || hydratedUser.current === user.id) return;
    hydratedUser.current = user.id;
    onStatus?.("hydrating");
    fetch("/api/state").then((response) => response.json()).then((payload) => { if (payload.state) onRemoteState?.(payload.state); onStatus?.("saved"); }).catch((error) => { onStatus?.("error"); onError?.(error); });
  }, [onError, onRemoteState, onStatus, ready, user]);
  useEffect(() => {
    if (!user || !ready || hydratedUser.current !== user.id) return undefined;
    onStatus?.("saving");
    const timer = window.setTimeout(() => fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) }, body: JSON.stringify({ state: snapshot }) }).then((response) => { if (!response.ok) throw new Error("Cloud save failed"); onStatus?.("saved"); }).catch((error) => { onStatus?.("error"); onError?.(error); }), 500);
    return () => window.clearTimeout(timer);
  }, [csrfToken, onError, onStatus, ready, snapshot, user]);
}
