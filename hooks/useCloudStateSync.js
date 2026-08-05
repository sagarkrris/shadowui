import { useEffect, useRef } from "react";

export function useCloudStateSync({ user, ready, snapshot, csrfToken = "", onRemoteState, onError } = {}) {
  const hydratedUser = useRef("");
  useEffect(() => {
    if (!user || !ready || hydratedUser.current === user.id) return;
    hydratedUser.current = user.id;
    fetch("/api/state").then((response) => response.json()).then((payload) => { if (payload.state) onRemoteState?.(payload.state); }).catch(onError);
  }, [onError, onRemoteState, ready, user]);
  useEffect(() => {
    if (!user || !ready || hydratedUser.current !== user.id) return undefined;
    const timer = window.setTimeout(() => fetch("/api/state", { method: "PUT", headers: { "Content-Type": "application/json", ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}) }, body: JSON.stringify({ state: snapshot }) }).catch(onError), 500);
    return () => window.clearTimeout(timer);
  }, [csrfToken, onError, ready, snapshot, user]);
}
