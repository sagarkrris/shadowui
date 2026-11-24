import { useEffect, useRef } from "react";

/** Dismiss a non-modal popover without blocking the outside interaction. */
export default function useDismissableLayer(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = event => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const escape = event => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      onClose();
      ref.current?.querySelector("button[aria-expanded], summary")?.focus();
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, onClose]);
  return ref;
}
