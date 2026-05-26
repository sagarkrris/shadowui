export function createHomeNavigationState(state = {}) {
  return {
    ...state,
    activeTab: "chat",
    messages: [],
    loading: false,
  };
}

export function createTopicSelectionNavigationState(state = {}) {
  return {
    ...state,
    activeTab: "chat",
  };
}
