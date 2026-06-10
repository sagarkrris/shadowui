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
    accent: "#9a6a2f",
    accentStrong: "#c89a5a",
    accentText: "#efdcc2",
    surface: "#1b1814",
    background: {
      glyphs: ["Java", "Spring Boot", "JVM"],
    },
  },
  {
    key: "python",
    label: "Python",
    icon: "ti-brand-python",
    pattern: /\b(python|django|flask|fastapi)\b/i,
    accent: "#315f8d",
    accentStrong: "#82a9cc",
    accentText: "#dbe9f7",
    surface: "#101823",
    background: {
      glyphs: ["Python", "Django", "FastAPI"],
    },
  },
  {
    key: "react",
    label: "React",
    icon: "ti-brand-react",
    pattern: /\b(react|next\.?js|next|redux)\b/i,
    accent: "#25768d",
    accentStrong: "#71b9c8",
    accentText: "#d8f0f4",
    surface: "#0f1a21",
    background: {
      glyphs: ["React", "Next.js", "Redux"],
    },
  },
  {
    key: "node",
    label: "Node.js",
    icon: "ti-brand-nodejs",
    pattern: /\b(node\.?js|node|express|nestjs)\b/i,
    accent: "#4d7752",
    accentStrong: "#91b58f",
    accentText: "#dcebdd",
    surface: "#111a15",
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
    accent: "#9b6544",
    accentStrong: "#c9966f",
    accentText: "#ecd8c9",
    surface: "#1d1612",
    background: {
      glyphs: ["Rust", "Tokio", "Cargo"],
    },
  },
  {
    key: "sap",
    label: "SAP",
    icon: "ti-building",
    pattern: /\b(sap|abap|s\/4hana|s4hana|hana|fiori|odata)\b/i,
    accent: "#426f86",
    accentStrong: "#8fb4c8",
    accentText: "#dbe7ef",
    surface: "#111922",
    background: {
      glyphs: ["SAP", "ABAP", "S/4HANA"],
    },
  },
  {
    key: "sql",
    label: "SQL",
    icon: "ti-database",
    pattern: /\b(sql|mysql|oracle|mariadb|sqlite|database|relational\s*database)\b/i,
    accent: "#94672f",
    accentStrong: "#c59a58",
    accentText: "#ecd9b9",
    surface: "#1b1711",
    background: {
      glyphs: ["SQL", "Joins", "Indexes"],
    },
  },
  {
    key: "postgresql",
    label: "PostgreSQL",
    icon: "ti-database",
    pattern: /\b(postgresql|postgres)\b/i,
    accent: "#466b88",
    accentStrong: "#8baec8",
    accentText: "#dbe7f0",
    surface: "#111923",
    background: {
      glyphs: ["PostgreSQL", "MySQL", "SQL"],
    },
  },
  {
    key: "mongodb",
    label: "MongoDB",
    icon: "ti-leaf",
    pattern: /\b(mongodb|mongo|nosql)\b/i,
    accent: "#4b7654",
    accentStrong: "#90b58f",
    accentText: "#dcebdd",
    surface: "#111a15",
    background: {
      glyphs: ["MongoDB", "NoSQL", "BSON"],
    },
  },
  {
    key: "aws",
    label: "AWS",
    icon: "ti-brand-aws",
    pattern: /\b(aws|amazon\s*web\s*services)\b/i,
    accent: "#9c6b2e",
    accentStrong: "#d0a261",
    accentText: "#ecdabc",
    surface: "#1b1710",
    background: {
      glyphs: ["AWS", "Amazon S3", "AWS Lambda"],
    },
  },
  {
    key: "azure",
    label: "Azure",
    icon: "ti-brand-azure",
    pattern: /\b(azure)\b/i,
    accent: "#2e6694",
    accentStrong: "#83add1",
    accentText: "#dbe9f7",
    surface: "#101823",
    background: {
      glyphs: ["Azure", "Azure AKS", "Azure Functions"],
    },
  },
  {
    key: "docker",
    label: "Docker",
    icon: "ti-brand-docker",
    pattern: /\b(docker|kubernetes|k8s)\b/i,
    accent: "#2f6e9c",
    accentStrong: "#7fb2d6",
    accentText: "#dcebf8",
    surface: "#101824",
    background: {
      glyphs: ["Docker", "Kubernetes", "Containers"],
    },
  },
  {
    key: "go",
    label: "Go",
    icon: "ti-brand-golang",
    pattern: /\b(golang|go)\b/i,
    accent: "#247984",
    accentStrong: "#72bdc7",
    accentText: "#d8f0f2",
    surface: "#0f1a1f",
    background: {
      glyphs: ["Go", "Golang", "Go Modules"],
    },
  },
];

const WORKSPACE_THEME_VARIANTS = {
  chat: {
    accent: "#5b6f8f",
    accentStrong: "#9fb2d1",
    accentText: "#e0e7f2",
    surface: "#121824",
    glyphs: ["Mock Round", "Coach", "Feedback"],
  },
  company: {
    accent: "#7a6836",
    accentStrong: "#d0b76f",
    accentText: "#efe5c8",
    surface: "#191811",
    glyphs: ["Company Prep", "Offer Loop", "Final Round"],
  },
  canvas: {
    accent: "#3f6f86",
    accentStrong: "#8eb8ca",
    accentText: "#dcebf1",
    surface: "#111a22",
    glyphs: ["Architecture", "Scale", "Tradeoffs"],
  },
  designLab: {
    accent: "#6d678f",
    accentStrong: "#aaa4ce",
    accentText: "#e7e4f2",
    surface: "#171722",
    glyphs: ["HLD", "LLD", "Patterns"],
  },
  scenarioBank: {
    accent: "#58744d",
    accentStrong: "#a0ba8c",
    accentText: "#e2ecd9",
    surface: "#131a12",
    glyphs: ["Scenarios", "Debug", "Tradeoffs"],
  },
  javaDigest: {
    accent: "#936734",
    accentStrong: "#c89d61",
    accentText: "#ecddc6",
    surface: "#1a1711",
    glyphs: ["Java Digest", "JVM", "Spring"],
  },
  dsaLab: {
    accent: "#287c7d",
    accentStrong: "#79c2bd",
    accentText: "#d9f0ed",
    surface: "#0f1a1c",
    glyphs: ["DSA Lab", "Watch", "Practice"],
  },
  course: {
    accent: "#7b5d79",
    accentStrong: "#c09bbb",
    accentText: "#eddfeb",
    surface: "#1a151d",
    glyphs: ["Course", "Lessons", "Capstone"],
  },
};

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

export function getWorkspaceTheme(baseTheme = DEFAULT_TECH_THEME, activeTab = "chat") {
  const variant = WORKSPACE_THEME_VARIANTS[activeTab] || WORKSPACE_THEME_VARIANTS.chat;
  const merged = {
    ...baseTheme,
    accent: variant.accent,
    accentStrong: variant.accentStrong,
    accentText: variant.accentText,
    surface: variant.surface,
    workspaceKey: activeTab,
    stackAccent: baseTheme.accent,
    stackAccentStrong: baseTheme.accentStrong,
    background: {
      ...(baseTheme.background || {}),
      glyphs: variant.glyphs,
    },
  };

  return buildTheme(merged);
}
