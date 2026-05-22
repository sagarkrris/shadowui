const NON_CODE_CATEGORIES = new Set(["Behavioral", "System Design"]);

export function canUsePrepTopics({ candidateProfile }) {
  return Boolean(candidateProfile);
}

export function canUseChatComposer({ activeTab, candidateProfile }) {
  return activeTab === "chat" && canUsePrepTopics({ candidateProfile });
}

export function canUseInterviewTools({ activeTab, candidateProfile }) {
  return canUseChatComposer({ activeTab, candidateProfile });
}

export function shouldShowCodeTools({ activeTab, candidateProfile, selectedCat }) {
  if (!canUseChatComposer({ activeTab, candidateProfile })) return false;
  if (!selectedCat) return false;
  return !NON_CODE_CATEGORIES.has(selectedCat);
}
