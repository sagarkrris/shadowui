import { useCallback, useState } from "react";
import { normalizeWorkspaceTab } from "../lib/workspaces.mjs";

export function useWorkspaceNavigation(initialTab = "chat") {
  const [activeTab, setActiveTabState] = useState(() => normalizeWorkspaceTab(initialTab));
  const setActiveTab = useCallback((tab) => setActiveTabState(normalizeWorkspaceTab(tab)), []);
  const toggleWorkspace = useCallback((tab) => setActiveTabState((current) => current === normalizeWorkspaceTab(tab) ? "chat" : normalizeWorkspaceTab(tab)), []);
  return { activeTab, setActiveTab, toggleWorkspace };
}
