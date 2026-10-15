// Stack identity stays in labels while every room shares the product palette.
export function corporateTheme(appearance = 'light') {
  const light = appearance !== 'dark';
  const surface = light ? '#f8f9fa' : '#202124';
  const panel = light ? '#ffffff' : '#292a2d';
  const accent = light ? '#1967d2' : '#a8c7fa';
  const text = light ? '#202124' : '#e8eaed';
  const border = light ? '#dadce0' : '#5f6368';
  return {
    appearance: light ? 'light' : 'dark', surface, panel, panelStrong: panel,
    accent, accentStrong: accent, accentText: text,
    accentSoft: light ? '#e8f0fe' : '#303f59',
    accentMuted: light ? '#f1f5fd' : '#253349', accentBorder: border,
    background: { image: surface, glyphs: [] },
    glass: { panel, panelStrong: panel, panelChrome: panel, tint: 'transparent', tintStrong: 'transparent', shine: 'transparent', edge: border, edgeSoft: border, shadow: 'none' },
  };
}
