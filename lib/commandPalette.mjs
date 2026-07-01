export function buildCommandPaletteActions({
  workspaces = [],
  hasCandidateProfile = false,
  canRetryLastAi = false,
} = {}) {
  const workspaceActions = workspaces.map((workspace) => ({
    id: `workspace:${workspace.id}`,
    label: `Open ${workspace.label}`,
    keywords: [workspace.id, workspace.label, "workspace", "navigation"].join(" ").toLowerCase(),
    type: "workspace",
    workspaceId: workspace.id,
  }));

  return [
    {
      id: "home",
      label: "Go Home",
      keywords: "home chat reset",
      type: "app",
    },
    {
      id: "voice",
      label: "Toggle Voice Live Mode",
      keywords: "voice microphone live mode",
      type: "app",
      disabled: !hasCandidateProfile,
    },
    {
      id: "retry-ai",
      label: "Retry Last AI Request",
      keywords: "retry ai last request again",
      type: "app",
      disabled: !canRetryLastAi,
    },
    {
      id: "export-session",
      label: "Export Session",
      keywords: "export session backup",
      type: "session",
    },
    {
      id: "import-session",
      label: "Import Session",
      keywords: "import session restore",
      type: "session",
    },
    ...workspaceActions,
  ];
}

export function filterCommandPaletteActions(actions = [], query = "") {
  const needle = String(query || "").trim().toLowerCase();
  if (!needle) return actions;

  return actions.filter((action) => `${action.label} ${action.keywords || ""}`.toLowerCase().includes(needle));
}
