export const DEFAULT_TECH_THEME = {
  key: "default",
  label: "Full Stack",
  icon: "ti-code",
  accent: "#2f6f73",
  accentSoft: "rgba(47,111,115,.13)",
  accentMuted: "rgba(47,111,115,.08)",
  accentBorder: "rgba(47,111,115,.32)",
  accentStrong: "#b78b4b",
  accentText: "#d9e6e3",
  surface: "#151b24",
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
    accent: "#b56b2c",
    accentStrong: "#e0a15c",
    accentText: "#f4d7ba",
    surface: "#1d1a17",
    background: {
      glyphs: ["Java", "Spring Boot", "JVM"],
    },
  },
  {
    key: "python",
    label: "Python",
    icon: "ti-brand-python",
    pattern: /\b(python|django|flask|fastapi)\b/i,
    accent: "#2f6f9f",
    accentStrong: "#d4a017",
    accentText: "#d7e8ff",
    surface: "#101827",
    background: {
      glyphs: ["Python", "Django", "FastAPI"],
    },
  },
  {
    key: "react",
    label: "React",
    icon: "ti-brand-react",
    pattern: /\b(react|next\.?js|next|redux)\b/i,
    accent: "#287aa9",
    accentStrong: "#5fb3d9",
    accentText: "#d8f1ff",
    surface: "#0f1b24",
    background: {
      glyphs: ["React", "Next.js", "Redux"],
    },
  },
  {
    key: "node",
    label: "Node.js",
    icon: "ti-brand-nodejs",
    pattern: /\b(node\.?js|node|express|nestjs)\b/i,
    accent: "#3f7d58",
    accentStrong: "#7cb991",
    accentText: "#dcf4e5",
    surface: "#101c17",
    background: {
      glyphs: ["Node.js", "Express", "NestJS"],
    },
  },
  {
    key: "javascript",
    label: "JavaScript",
    icon: "ti-brand-javascript",
    pattern: /\b(javascript|js|typescript|ts)\b/i,
    accent: "#9b7a12",
    accentStrong: "#d2aa2b",
    accentText: "#f3e7b8",
    surface: "#1b1a12",
    background: {
      glyphs: ["JavaScript", "TypeScript", "ECMAScript"],
    },
  },
  {
    key: "ruby",
    label: "Ruby",
    icon: "ti-diamond",
    pattern: /\b(ruby|rails|ruby\s*on\s*rails|ror)\b/i,
    accent: "#9f3f45",
    accentStrong: "#d77b86",
    accentText: "#f4d3d7",
    surface: "#211416",
    background: {
      glyphs: ["Ruby", "Rails", "RSpec"],
    },
  },
  {
    key: "rust",
    label: "Rust",
    icon: "ti-brand-rust",
    pattern: /\b(rust|tokio|actix|axum|cargo)\b/i,
    accent: "#a65f38",
    accentStrong: "#d69463",
    accentText: "#f0d6c3",
    surface: "#201712",
    background: {
      glyphs: ["Rust", "Tokio", "Cargo"],
    },
  },
  {
    key: "sap",
    label: "SAP",
    icon: "ti-building",
    pattern: /\b(sap|abap|s\/4hana|s4hana|hana|fiori|odata)\b/i,
    accent: "#256f93",
    accentStrong: "#6caed0",
    accentText: "#d6ecf7",
    surface: "#101b23",
    background: {
      glyphs: ["SAP", "ABAP", "S/4HANA"],
    },
  },
  {
    key: "sql",
    label: "SQL",
    icon: "ti-database",
    pattern: /\b(sql|mysql|oracle|mariadb|sqlite|database|relational\s*database)\b/i,
    accent: "#a97123",
    accentStrong: "#d8a64c",
    accentText: "#f2deb8",
    surface: "#1d1811",
    background: {
      glyphs: ["SQL", "Joins", "Indexes"],
    },
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    icon: "ti-database",
    pattern: /\b(postgresql|postgres)\b/i,
    accent: "#3f6f91",
    accentStrong: "#7faed0",
    accentText: "#d7e8f4",
    surface: "#111a24",
    background: {
      glyphs: ["PostgreSQL", "MySQL", "SQL"],
    },
  },
  {
    key: "mongodb",
    label: "MongoDB",
    icon: "ti-leaf",
    pattern: /\b(mongodb|mongo|nosql)\b/i,
    accent: "#3e7c54",
    accentStrong: "#7dbb90",
    accentText: "#dcf3e4",
    surface: "#101c16",
    background: {
      glyphs: ["MongoDB", "NoSQL", "BSON"],
    },
  },
  {
    key: "aws",
    label: "AWS",
    icon: "ti-brand-aws",
    pattern: /\b(aws|amazon\s*web\s*services)\b/i,
    accent: "#b97822",
    accentStrong: "#dda64c",
    accentText: "#f2ddbb",
    surface: "#1e1810",
    background: {
      glyphs: ["AWS", "Amazon S3", "AWS Lambda"],
    },
  },
  {
    key: "azure",
    label: "Azure",
    icon: "ti-brand-azure",
    pattern: /\b(azure)\b/i,
    accent: "#2d6f9f",
    accentStrong: "#76a9d6",
    accentText: "#d9e9f8",
    surface: "#101927",
    background: {
      glyphs: ["Azure", "Azure AKS", "Azure Functions"],
    },
  },
  {
    key: "docker",
    label: "Docker",
    icon: "ti-brand-docker",
    pattern: /\b(docker|kubernetes|k8s)\b/i,
    accent: "#2f75a8",
    accentStrong: "#72acd8",
    accentText: "#d9ebf8",
    surface: "#101927",
    background: {
      glyphs: ["Docker", "Kubernetes", "Containers"],
    },
  },
  {
    key: "go",
    label: "Go",
    icon: "ti-brand-golang",
    pattern: /\b(golang|go)\b/i,
    accent: "#237b8d",
    accentStrong: "#67b6c6",
    accentText: "#d4f0f5",
    surface: "#0f1b20",
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
      `linear-gradient(135deg, ${surface} 0%, ${withAlpha(accent, ".22")} 42%, ${withAlpha(strong, ".12")} 72%, ${surface} 100%)`,
      `linear-gradient(90deg, rgba(255,255,255,.045), transparent 34%, rgba(255,255,255,.025) 68%, transparent)`,
      `linear-gradient(180deg, rgba(255,255,255,.035), rgba(0,0,0,.08))`,
    ].join(", "),
  };
}

function buildGlass(theme) {
  return {
    panel: withAlpha(theme.surface, ".74"),
    panelStrong: withAlpha(theme.surface, ".90"),
    panelChrome: withAlpha(theme.surface, ".84"),
    tint: withAlpha(theme.accent, ".12"),
    tintStrong: withAlpha(theme.accent, ".20"),
    shine: withAlpha(theme.accentStrong, ".16"),
    edge: "rgba(226,232,240,.14)",
    edgeSoft: "rgba(226,232,240,.08)",
    shadow: `0 18px 42px rgba(2,6,23,.34), inset 0 1px 0 rgba(255,255,255,.10), inset 0 -1px 0 ${withAlpha(theme.accent, ".08")}`,
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
