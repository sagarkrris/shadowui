import { BRAND_LOGO_ARIA_LABEL, BRAND_LOGO_INITIALS } from "../lib/brandLogo.mjs";

export default function BrandLogo({ theme, size = 30, appearance } = {}) {
  const light = (appearance || theme?.appearance || 'light') !== 'dark';
  const markSize = Math.max(28, Number(size) || 30);
  return <div role="img" aria-label={BRAND_LOGO_ARIA_LABEL} style={{ width: markSize, height: markSize, borderRadius: 6, background: light ? '#1967d2' : '#a8c7fa', color: light ? '#ffffff' : '#202124', display: 'grid', placeItems: 'center', flexShrink: 0, fontFamily: 'Arial, sans-serif', fontSize: Math.round(markSize * .39), fontWeight: 600, lineHeight: 1 }}>{BRAND_LOGO_INITIALS}</div>;
}
