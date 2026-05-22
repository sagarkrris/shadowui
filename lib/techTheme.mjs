export const DEFAULT_TECH_THEME = {
  key: "default",
  label: "Full Stack",
  icon: "ti-code",
  accent: "#22c55e",
  accentSoft: "rgba(34,197,94,.13)",
  accentMuted: "rgba(34,197,94,.08)",
  accentBorder: "rgba(34,197,94,.32)",
  accentStrong: "#fb7185",
  accentText: "#bbf7d0",
  surface: "#10130f",
};

const TECH_THEMES = [
  {
    key: "java",
    label: "Java",
    icon: "ti-brand-java",
    pattern: /\b(java|spring\s*boot|spring)\b/i,
    accent: "#f89820",
    accentStrong: "#ffb74a",
    accentText: "#ffd7a3",
    surface: "#1b1208",
  },
  {
    key: "python",
    label: "Python",
    icon: "ti-brand-python",
    pattern: /\b(python|django|flask|fastapi)\b/i,
    accent: "#3776ab",
    accentStrong: "#ffd43b",
    accentText: "#bfdbfe",
    surface: "#071521",
  },
  {
    key: "react",
    label: "React",
    icon: "ti-brand-react",
    pattern: /\b(react|next\.?js|next|redux)\b/i,
    accent: "#61dafb",
    accentStrong: "#7dd3fc",
    accentText: "#bae6fd",
    surface: "#06161d",
  },
  {
    key: "node",
    label: "Node.js",
    icon: "ti-brand-nodejs",
    pattern: /\b(node\.?js|node|express|nestjs)\b/i,
    accent: "#68a063",
    accentStrong: "#86efac",
    accentText: "#bbf7d0",
    surface: "#07170d",
  },
  {
    key: "javascript",
    label: "JavaScript",
    icon: "ti-brand-javascript",
    pattern: /\b(javascript|js|typescript|ts)\b/i,
    accent: "#f7df1e",
    accentStrong: "#fde047",
    accentText: "#fef08a",
    surface: "#171500",
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    icon: "ti-database",
    pattern: /\b(postgresql|postgres|sql|mysql|oracle|database)\b/i,
    accent: "#336791",
    accentStrong: "#7dd3fc",
    accentText: "#bae6fd",
    surface: "#071521",
  },
  {
    key: "mongodb",
    label: "MongoDB",
    icon: "ti-leaf",
    pattern: /\b(mongodb|mongo|nosql)\b/i,
    accent: "#47a248",
    accentStrong: "#86efac",
    accentText: "#bbf7d0",
    surface: "#07170d",
  },
  {
    key: "aws",
    label: "AWS",
    icon: "ti-brand-aws",
    pattern: /\b(aws|amazon\s*web\s*services)\b/i,
    accent: "#ff9900",
    accentStrong: "#fbbf24",
    accentText: "#fed7aa",
    surface: "#1a1003",
  },
  {
    key: "azure",
    label: "Azure",
    icon: "ti-brand-azure",
    pattern: /\b(azure)\b/i,
    accent: "#0078d4",
    accentStrong: "#60a5fa",
    accentText: "#bfdbfe",
    surface: "#061321",
  },
  {
    key: "docker",
    label: "Docker",
    icon: "ti-brand-docker",
    pattern: /\b(docker|kubernetes|k8s)\b/i,
    accent: "#2496ed",
    accentStrong: "#60a5fa",
    accentText: "#bfdbfe",
    surface: "#061321",
  },
  {
    key: "go",
    label: "Go",
    icon: "ti-brand-golang",
    pattern: /\b(golang|go)\b/i,
    accent: "#00add8",
    accentStrong: "#67e8f9",
    accentText: "#a5f3fc",
    surface: "#05161a",
  },
];

function withAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red},${green},${blue},${alpha})`;
}

function buildTheme(theme) {
  return {
    ...DEFAULT_TECH_THEME,
    ...theme,
    accentSoft: withAlpha(theme.accent, ".14"),
    accentMuted: withAlpha(theme.accent, ".08"),
    accentBorder: withAlpha(theme.accent, ".34"),
  };
}

export function getTechTheme(stack) {
  const stackText = String(stack || "").trim();
  if (!stackText) return DEFAULT_TECH_THEME;

  const matched = TECH_THEMES
    .map((theme) => {
      const match = stackText.match(theme.pattern);
      return match ? { theme, index: match.index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index)[0]?.theme;

  return matched ? buildTheme(matched) : DEFAULT_TECH_THEME;
}
