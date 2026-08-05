export const THEME_PREFERENCE_STORAGE_KEY = "interviewiq.themePreference.v1";

export function normalizeThemePreference(value) {
  return ["system", "light", "dark"].includes(value) ? value : "system";
}

export function resolveThemeMode(preference, systemMode = "light") {
  const normalized = normalizeThemePreference(preference);
  if (normalized !== "system") return normalized;
  return systemMode === "dark" ? "dark" : "light";
}
