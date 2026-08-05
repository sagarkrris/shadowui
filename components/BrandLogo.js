import {
  BRAND_LOGO_ARIA_LABEL,
  BRAND_LOGO_INITIALS,
} from "../lib/brandLogo.mjs";

export default function BrandLogo({ theme, size = 30, appearance = theme?.appearance || "dark" }) {
  const markSize = Math.max(28, size);
  const isLight = appearance === "light";
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
          fontSize: Math.round(markSize * .39),
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
          right: 5,
          bottom: 5,
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: logoStrong,
          boxShadow: `0 0 10px ${logoStrong}`,
        }}
      />
    </div>
  );
}
