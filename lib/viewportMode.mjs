export const COMPACT_VIEWPORT_MAX_WIDTH = 1023;

export function isCompactViewport(width) {
  return Number(width) <= COMPACT_VIEWPORT_MAX_WIDTH;
}

