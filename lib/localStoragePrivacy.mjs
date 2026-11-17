const PRIVATE_KEY_PREFIXES = ["interviewiq", "interviewprep.session"];

export function clearPrivateLocalData(storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage) return;
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && PRIVATE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}

// A revoked session must not leave mounted private workspaces alive merely
// because the browser refuses access to one of its storage areas.
export function clearPrivateBrowserData(browser) {
  const result = {};
  for (const name of ['localStorage','sessionStorage']) {
    try { clearPrivateLocalData(browser[name]); result[name] = true; }
    catch { result[name] = false; }
  }
  return result;
}
