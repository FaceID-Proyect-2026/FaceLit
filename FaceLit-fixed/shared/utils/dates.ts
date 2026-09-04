export function isRecent(dateIso: string): boolean {
  const timestamp = new Date(dateIso).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp <= 3 * 24 * 60 * 60 * 1000;
}

export function wasEditedRecently(createdAt: string, updatedAt: string): boolean {
  return updatedAt !== createdAt && isRecent(updatedAt);
}