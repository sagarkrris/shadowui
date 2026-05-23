export function scrollFocusedControlIntoView(element, schedule = globalThis.setTimeout) {
  if (!element || typeof element.scrollIntoView !== "function") return false;

  schedule(() => {
    element.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  }, 80);

  return true;
}
