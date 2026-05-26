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
