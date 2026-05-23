export default function TechBackground({ theme }) {
  const glyphs = theme.background?.glyphs?.length
    ? theme.background.glyphs
    : ["API", "DB", "UI"];

  const glyphStyles = [
    { top: "10%", left: "9%", fontSize: 46, transform: "rotate(-10deg)" },
    { top: "18%", right: "12%", fontSize: 32, transform: "rotate(8deg)" },
    { bottom: "18%", left: "15%", fontSize: 28, transform: "rotate(6deg)" },
    { bottom: "10%", right: "9%", fontSize: 54, transform: "rotate(-7deg)" },
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background: theme.background?.image || theme.surface,
        zIndex: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "42px 42px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,.72), rgba(0,0,0,.16))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, transparent 0, rgba(0,0,0,.42) 68%, rgba(0,0,0,.78) 100%)",
        }}
      />
      {glyphStyles.map((style, index) => (
        <span
          key={`${glyphs[index % glyphs.length]}-${index}`}
          style={{
            position: "absolute",
            ...style,
            color: index % 2 === 0 ? theme.accentStrong : theme.accentText,
            opacity: index % 2 === 0 ? 0.09 : 0.07,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 1,
            whiteSpace: "nowrap",
            textShadow: `0 0 42px ${theme.accentSoft}`,
          }}
        >
          {glyphs[index % glyphs.length]}
        </span>
      ))}
    </div>
  );
}
