import { useCallback, useEffect, useState } from "react";

export function useSessionPersistence({ initialValue, load, save, onError } = {}) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve(load?.()).then((loaded) => { if (active && loaded !== undefined) setValue(loaded); }).catch((error) => onError?.(error)).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [load, onError]);
  const persist = useCallback(async (next) => { setValue(next); try { await save?.(next); } catch (error) { onError?.(error); } }, [onError, save]);
  return { value, setValue: persist, ready };
}
