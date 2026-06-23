export const WORKSPACE_TABS = [
  {
    id: "offerWarRoom",
    label: "Offer War Room",
    shortLabel: "War Room",
    icon: "ti-target-arrow",
    mobile: true,
  },
  {
    id: "interviewReady",
    label: "Interview Ready Q&A",
    shortLabel: "Q&A",
    icon: "ti-message-question",
    mobile: true,
  },
  {
    id: "company",
    label: "Company Prep",
    shortLabel: "Company",
    icon: "ti-building",
    mobile: true,
  },
  {
    id: "canvas",
    label: "System Canvas",
    shortLabel: "Canvas",
    icon: "ti-schema",
    mobile: true,
  },
  {
    id: "designLab",
    label: "Design Lab",
    shortLabel: "Design Lab",
    icon: "ti-puzzle",
    mobile: true,
  },
  {
    id: "scenarioBank",
    label: "Scenario Bank",
    shortLabel: "Scenario Bank",
    icon: "ti-database-search",
    mobile: true,
  },
  {
    id: "javaDigest",
    label: "Java Digest",
    shortLabel: "Java",
    icon: "ti-news",
    mobile: true,
  },
  {
    id: "dsaLab",
    label: "DSA Lab",
    shortLabel: "DSA Lab",
    icon: "ti-binary-tree",
    mobile: true,
  },
  {
    id: "course",
    label: "Agentic UI Course",
    shortLabel: "Course",
    icon: "ti-sparkles",
    mobile: true,
  },
];

const TAB_IDS = new Set(["chat", ...WORKSPACE_TABS.map((workspace) => workspace.id)]);

export function normalizeWorkspaceTab(activeTab) {
  return TAB_IDS.has(activeTab) ? activeTab : "chat";
}

export function getWorkspaceById(id) {
  return WORKSPACE_TABS.find((workspace) => workspace.id === id) || null;
}

export function listDesktopWorkspaces() {
  return WORKSPACE_TABS;
}

export function listMobileWorkspaces() {
  return WORKSPACE_TABS.filter((workspace) => workspace.mobile);
}

export function getWorkspaceTitle({
  activeTab = "chat",
  candidateProfile = null,
  currentLabel = "",
  displayName = "",
  stackGreeting = {},
} = {}) {
  const normalizedTab = normalizeWorkspaceTab(activeTab);
  if (normalizedTab === "offerWarRoom") {
    return candidateProfile ? `Offer War Room for ${displayName || candidateProfile.name || "you"}` : "Offer War Room";
  }
  if (normalizedTab === "company") {
    return candidateProfile ? `Company Prep for ${displayName || candidateProfile.name || "you"}` : "Company Prep";
  }

  const workspace = getWorkspaceById(normalizedTab);
  if (workspace) return workspace.label;

  if (candidateProfile) {
    const salutation = stackGreeting?.salutation || "Interview prep";
    return `${salutation}${currentLabel ? ` · ${currentLabel}` : ""}`;
  }

  return "Tell us your target role";
}
