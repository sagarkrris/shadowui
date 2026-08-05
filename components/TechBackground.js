export default function TechBackground({ theme }) {
  const isLight = theme.appearance === "light";
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
            `linear-gradient(${isLight ? "rgba(15,47,79,.045)" : "rgba(255,255,255,.026)"} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${isLight ? "rgba(15,47,79,.032)" : "rgba(255,255,255,.018)"} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: "48px 48px",
          maskImage: `linear-gradient(to bottom, rgba(0,0,0,${isLight ? ".28" : ".58"}), rgba(0,0,0,${isLight ? ".08" : ".12"}))`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            isLight
              ? "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.16))"
              : "linear-gradient(180deg, rgba(2,6,23,.08), rgba(2,6,23,.52))",
        }}
      />
      {glyphStyles.map((style, index) => (
        <span
          key={`${glyphs[index % glyphs.length]}-${index}`}
          style={{
            position: "absolute",
            ...style,
            color: index % 2 === 0 ? theme.accentStrong : theme.accentText,
            opacity: isLight ? (index % 2 === 0 ? 0.07 : 0.055) : (index % 2 === 0 ? 0.055 : 0.045),
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontWeight: 800,
            letterSpacing: 0,
            lineHeight: 1,
            whiteSpace: "nowrap",
            textShadow: isLight ? "none" : `0 0 28px ${theme.accentSoft}`,
          }}
        >
          {glyphs[index % glyphs.length]}
        </span>
      ))}
    </div>
  );
}
