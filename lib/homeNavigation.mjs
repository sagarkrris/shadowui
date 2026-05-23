export function createHomeNavigationState(state = {}) {
  return {
    ...state,
    activeTab: "chat",
    messages: [],
    loading: false,
  };
}
