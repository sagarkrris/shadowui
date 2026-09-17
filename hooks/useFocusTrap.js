import { useEffect } from "react";

const SELECTOR = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

export function useFocusTrap(ref, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    const root = ref.current;
    const previousFocus = document.activeElement;
    const focusables = () => Array.from(root.querySelectorAll(SELECTOR)).filter(element => element.getClientRects().length > 0);
    focusables()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key !== "Tab") return;
      const items = focusables(); if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    root.addEventListener("keydown", onKeyDown);
    return () => { root.removeEventListener("keydown", onKeyDown); if (previousFocus?.isConnected) previousFocus.focus?.(); };
  }, [enabled, ref]);
}
