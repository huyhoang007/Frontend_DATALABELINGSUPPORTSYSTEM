const DEFAULT_FLAGS = {
  perf_project_list_summary: true,
  perf_hotspot_cache: true,
  perf_project_tab_persistence: true,
  perf_image_preview_fields: true,
  perf_image_lazyload: true,
  perf_workspace_safe_cache: true,
};

const normalizeFlagValue = (value) => {
  if (value == null) return null;
  return !["0", "false", "off", "no"].includes(String(value).trim().toLowerCase());
};

const toEnvKey = (flagName) => `VITE_${flagName.toUpperCase()}`;

export function isFeatureEnabled(flagName) {
  if (!(flagName in DEFAULT_FLAGS)) return false;

  if (typeof window !== "undefined") {
    const storedValue =
      window.localStorage.getItem(`feature:${flagName}`) ??
      window.localStorage.getItem(flagName);
    const normalizedStoredValue = normalizeFlagValue(storedValue);
    if (normalizedStoredValue != null) {
      return normalizedStoredValue;
    }
  }

  const envValue = import.meta.env?.[toEnvKey(flagName)];
  const normalizedEnvValue = normalizeFlagValue(envValue);
  if (normalizedEnvValue != null) {
    return normalizedEnvValue;
  }

  return DEFAULT_FLAGS[flagName];
}

export const featureFlags = DEFAULT_FLAGS;
