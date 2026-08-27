import {
  BRAND_LOGO_ARIA_LABEL,
  BRAND_LOGO_INITIALS,
} from "../lib/brandLogo.mjs";

const MIN_LOGO_SIZE = 28;
const INITIALS_SIZE_RATIO = 0.39;
const BADGE_OFFSET = 5;
const BADGE_SIZE = 5;
const FALLBACK_THEME = {
  appearance: "dark",
  accentStrong: "#8bd3ff",
  accentText: "#f8fbff",
  accentSoft: "rgba(139,211,255,.28)",
  accentBorder: "rgba(139,211,255,.26)",
  accentMuted: "rgba(139,211,255,.12)",
};

export default function BrandLogo({ theme: providedTheme, size = 30, appearance } = {}) {
  const theme = { ...FALLBACK_THEME, ...(providedTheme || {}) };
  const numericSize = Number(size);
  const markSize = Math.max(
    MIN_LOGO_SIZE,
    Number.isFinite(numericSize) ? numericSize : MIN_LOGO_SIZE,
  );
  const isLight = (appearance || theme.appearance || "dark") === "light";
  const logoStrong = isLight ? "#b7791f" : theme.accentStrong;
  const logoText = isLight ? "#17324d" : theme.accentText;

  return (
    <div
      aria-label={BRAND_LOGO_ARIA_LABEL}
      role="img"
      style={{
        width: markSize,
        height: markSize,
        borderRadius: 9,
        background: isLight
          ? `linear-gradient(145deg, #ffffff, #edf5fb)`
          : `linear-gradient(135deg, ${theme.accentSoft}, rgba(255,255,255,.045))`,
        border: `1px solid ${isLight ? "rgba(31,111,145,.38)" : theme.accentBorder}`,
        boxShadow: isLight
          ? "0 8px 20px rgba(31,55,82,.16), inset 0 1px 0 rgba(255,255,255,.95)"
          : `0 8px 22px ${theme.accentMuted}, inset 0 1px 0 rgba(255,255,255,.16)`,
        display: "grid",
        placeItems: "center",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: logoText,
          fontSize: Math.round(markSize * INITIALS_SIZE_RATIO),
          fontWeight: 800,
          letterSpacing: 0,
          lineHeight: 1,
          textShadow: isLight ? "none" : `0 0 14px ${theme.accentSoft}`,
        }}
      >
        {BRAND_LOGO_INITIALS}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: BADGE_OFFSET,
          bottom: BADGE_OFFSET,
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: "50%",
          background: logoStrong,
          boxShadow: `0 0 10px ${logoStrong}`,
        }}
      />
    </div>
  );
}
