export default function TechBackground({ theme }) {
  return <div aria-hidden="true" className="workspace-background" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: theme.surface, zIndex: 0 }} />;
}
