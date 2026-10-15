const paths = {
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  search: 'M21 21l-5-5M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15',
  book: 'M12 5v16M12 5C9 3 5 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 1',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  layers: 'm12 3 10 6-10 6L2 9l10-6M2 13l10 6 10-6M2 17l10 6 10-6',
  route: 'M5 3v10a4 4 0 0 0 4 4h6m0 0-3-3m3 3-3 3M5 3h4M19 3v6m-3-3 3 3 3-3',
  pulse: 'M2 12h5l3-8 4 16 3-8h5',
  chat: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4M8 10h8M8 14h5',
  bookmark: 'M6 3h12v18l-6-4-6 4V3',
  lab: 'M9 3h6M10 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M7 15h10',
  calendar: 'M3 5h18v16H3V5M7 3v4m10-4v4M3 10h18m-14 4h3m4 0h3',
  mail: 'M3 5h18v14H3V5m0 0 9 7 9-7',
  check: 'm5 12 4 4 10-10',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  chevron: 'm6 9 6 6 6-6',
};
export default function UiIcon({ name = 'arrow', size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.arrow} /></svg>;
}
