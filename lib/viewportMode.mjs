export const COMPACT_VIEWPORT_MAX_WIDTH = 1023;

export function isCompactViewport(width) {
  return Number(width) <= COMPACT_VIEWPORT_MAX_WIDTH;
}

export function getStableViewportHeight({ innerHeight, visualViewportHeight } = {}) {
  const layoutHeight = Number(innerHeight) || 0;
  const visualHeight = Number(visualViewportHeight) || 0;

  if (!layoutHeight) return visualHeight;
  if (!visualHeight) return layoutHeight;

  return Math.max(layoutHeight, visualHeight);
}

export function getVisibleViewportHeight({ innerHeight, visualViewportHeight } = {}) {
  return Number(visualViewportHeight) || Number(innerHeight) || 0;
}

export function getAppShellHeight({ isCompact, hasVisualViewport } = {}) {
  if (isCompact && hasVisualViewport) {
    return "calc(var(--vvh, var(--vh, 1vh)) * 100)";
  }

  return "calc(var(--vh, 1vh) * 100)";
}

export function isTextEntryControl({ tagName, isContentEditable } = {}) {
  if (isContentEditable) return true;

  const normalizedTag = String(tagName || "").toUpperCase();
  return normalizedTag === "INPUT" || normalizedTag === "TEXTAREA" || normalizedTag === "SELECT";
}

export function isVirtualKeyboardOpen({
  innerHeight,
  visualViewportHeight,
  viewportWidth,
  activeElementTagName,
  activeElementIsContentEditable,
} = {}) {
  if (!isCompactViewport(viewportWidth)) return false;
  if (!isTextEntryControl({ tagName: activeElementTagName, isContentEditable: activeElementIsContentEditable })) return false;

  const layoutHeight = Number(innerHeight) || 0;
  const visualHeight = Number(visualViewportHeight) || 0;

  if (!layoutHeight || !visualHeight) return false;

  const heightDelta = layoutHeight - visualHeight;
  const keyboardThreshold = Math.max(120, layoutHeight * 0.18);

  return heightDelta >= keyboardThreshold;
}
