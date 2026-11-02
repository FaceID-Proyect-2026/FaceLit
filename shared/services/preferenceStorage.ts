// Preferences are optional: a blocked browser store must not break rendering.
function reportPreferenceFailure(operation: string) {
  console.warn(`[preferences] Browser storage unavailable during ${operation}.`);
}

export function readPreference(key: string): string | null {
  try { return globalThis.localStorage?.getItem(key) ?? null; }
  catch { reportPreferenceFailure('read'); return null; }
}

export function writePreference(key: string, value: string): void {
  try { globalThis.localStorage?.setItem(key, value); }
  catch { reportPreferenceFailure('write'); }
}
