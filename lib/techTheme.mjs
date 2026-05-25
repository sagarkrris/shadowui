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
  background: {
    glyphs: ["Full Stack", "Frontend", "Backend"],
  },
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
    background: {
      glyphs: ["Java", "Spring Boot", "JVM"],
    },
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
    background: {
      glyphs: ["Python", "Django", "FastAPI"],
    },
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
    background: {
      glyphs: ["React", "Next.js", "Redux"],
    },
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
    background: {
      glyphs: ["Node.js", "Express", "NestJS"],
    },
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
    background: {
      glyphs: ["JavaScript", "TypeScript", "ECMAScript"],
    },
  },
  {
    key: "ruby",
    label: "Ruby",
    icon: "ti-diamond",
    pattern: /\b(ruby|rails|ruby\s*on\s*rails|ror)\b/i,
    accent: "#cc342d",
    accentStrong: "#fb7185",
    accentText: "#fecaca",
    surface: "#1a0808",
    background: {
      glyphs: ["Ruby", "Rails", "RSpec"],
    },
  },
  {
    key: "rust",
    label: "Rust",
    icon: "ti-brand-rust",
    pattern: /\b(rust|tokio|actix|axum|cargo)\b/i,
    accent: "#ce422b",
    accentStrong: "#fbbf24",
    accentText: "#fed7aa",
    surface: "#1a0c05",
    background: {
      glyphs: ["Rust", "Tokio", "Cargo"],
    },
  },
  {
    key: "sap",
    label: "SAP",
    icon: "ti-building",
    pattern: /\b(sap|abap|s\/4hana|s4hana|hana|fiori|odata)\b/i,
    accent: "#0f9ed5",
    accentStrong: "#7dd3fc",
    accentText: "#bae6fd",
    surface: "#06131b",
    background: {
      glyphs: ["SAP", "ABAP", "S/4HANA"],
    },
  },
  {
    key: "sql",
    label: "SQL",
    icon: "ti-database",
    pattern: /\b(sql|mysql|oracle|mariadb|sqlite|database|relational\s*database)\b/i,
    accent: "#f59e0b",
    accentStrong: "#facc15",
    accentText: "#fde68a",
    surface: "#171006",
    background: {
      glyphs: ["SQL", "Joins", "Indexes"],
    },
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    icon: "ti-database",
    pattern: /\b(postgresql|postgres)\b/i,
    accent: "#336791",
    accentStrong: "#7dd3fc",
    accentText: "#bae6fd",
    surface: "#071521",
    background: {
      glyphs: ["PostgreSQL", "MySQL", "SQL"],
    },
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
    background: {
      glyphs: ["MongoDB", "NoSQL", "BSON"],
    },
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
    background: {
      glyphs: ["AWS", "Amazon S3", "AWS Lambda"],
    },
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
    background: {
      glyphs: ["Azure", "Azure AKS", "Azure Functions"],
    },
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
    background: {
      glyphs: ["Docker", "Kubernetes", "Containers"],
    },
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
    background: {
      glyphs: ["Go", "Golang", "Go Modules"],
    },
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

function buildBackground(theme) {
  const accent = theme.accent || DEFAULT_TECH_THEME.accent;
  const strong = theme.accentStrong || DEFAULT_TECH_THEME.accentStrong;
  const surface = theme.surface || DEFAULT_TECH_THEME.surface;
  const glyphs = theme.background?.glyphs || DEFAULT_TECH_THEME.background.glyphs;

  return {
    glyphs,
    image: [
      `radial-gradient(circle at 18% 12%, ${withAlpha(accent, ".24")} 0, transparent 28%)`,
      `radial-gradient(circle at 84% 20%, ${withAlpha(strong, ".18")} 0, transparent 24%)`,
      `radial-gradient(circle at 58% 86%, ${withAlpha(accent, ".16")} 0, transparent 30%)`,
      `linear-gradient(135deg, ${surface} 0%, ${withAlpha(accent, ".18")} 46%, ${surface} 100%)`,
    ].join(", "),
  };
}

function buildGlass(theme) {
  return {
    panel: withAlpha(theme.surface, ".68"),
    panelStrong: withAlpha(theme.surface, ".86"),
    panelChrome: withAlpha(theme.surface, ".78"),
    tint: withAlpha(theme.accent, ".18"),
    tintStrong: withAlpha(theme.accent, ".26"),
    shine: withAlpha(theme.accentStrong, ".26"),
    edge: "rgba(255,255,255,.16)",
    edgeSoft: "rgba(255,255,255,.08)",
    shadow: `0 18px 50px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 ${withAlpha(theme.accent, ".10")}`,
  };
}

DEFAULT_TECH_THEME.background = buildBackground(DEFAULT_TECH_THEME);
DEFAULT_TECH_THEME.panel = withAlpha(DEFAULT_TECH_THEME.surface, ".82");
DEFAULT_TECH_THEME.panelStrong = withAlpha(DEFAULT_TECH_THEME.surface, ".94");
DEFAULT_TECH_THEME.glass = buildGlass(DEFAULT_TECH_THEME);

function buildTheme(theme) {
  const merged = {
    ...DEFAULT_TECH_THEME,
    ...theme,
    accentSoft: withAlpha(theme.accent, ".14"),
    accentMuted: withAlpha(theme.accent, ".08"),
    accentBorder: withAlpha(theme.accent, ".34"),
    panel: withAlpha(theme.surface, ".82"),
    panelStrong: withAlpha(theme.surface, ".94"),
  };

  return {
    ...merged,
    background: buildBackground(merged),
    glass: buildGlass(merged),
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
