export default function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "8px 2px" }}>
      {[0, 1, 2].map((i) => <div key={i} className="dot" style={{ animationDelay: `${i * .2}s` }} />)}
    </div>
  );
}
