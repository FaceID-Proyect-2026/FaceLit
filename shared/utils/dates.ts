export function isRecent(dateIso: string): boolean {
  const timestamp = new Date(dateIso).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp <= 3 * 24 * 60 * 60 * 1000;
}

export function wasEditedRecently(createdAt: string, updatedAt: string): boolean {
  return updatedAt !== createdAt && isRecent(updatedAt);
}

export function formatDateTime(dateIso?: string | null, fallback = 'Sin registro', locale?: string): string {
  if (!dateIso) return fallback;
  const date = new Date(dateIso);
  return Number.isFinite(date.getTime()) ? date.toLocaleString(locale) : fallback;
}
