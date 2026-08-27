import BrandLogo from "./BrandLogo";

const WATERMARK_TILES = Array.from({ length: 12 }, (_, index) => index);

export default function BrandWatermark() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
        alignItems: "center",
        justifyItems: "center",
        gap: "clamp(40px, 9vw, 140px)",
        padding: "clamp(20px, 6vw, 90px)",
        opacity: 0.085,
        pointerEvents: "none",
        userSelect: "none",
        transform: "rotate(-18deg) scale(1.18)",
        transformOrigin: "center",
      }}
    >
      {WATERMARK_TILES.map((tile) => (
        <span key={tile} style={{ display: "grid", justifyItems: "center", gap: 5 }}>
          <BrandLogo size={150} />
          <span style={{ color: "#8bd3ff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 8, fontWeight: 800, letterSpacing: ".04em", whiteSpace: "nowrap" }}>InterviewIQ</span>
        </span>
      ))}
    </div>
  );
}
