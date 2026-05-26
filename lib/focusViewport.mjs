export function scrollFocusedControlIntoView(element, schedule = globalThis.setTimeout, options = {}) {
  if (!element || typeof element.scrollIntoView !== "function") return false;

  const delay = Number.isFinite(options.delay) ? options.delay : 140;

  schedule(() => {
    element.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });
  }, delay);

  return true;
}
