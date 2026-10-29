export const APP_TIME_ZONE = 'America/Bogota';

/** Calendar date and clock time for the same instant, always in Colombia. */
export function getBogotaDateTimeParts(value: string | Date): { date: string; time: string } | null {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
}

export function isRecent(dateIso: string): boolean {
  const timestamp = new Date(dateIso).getTime();
  return Number.isFinite(timestamp) && Date.now() - timestamp <= 3 * 24 * 60 * 60 * 1000;
}

export function wasEditedRecently(createdAt: string, updatedAt: string): boolean {
  return new Date(updatedAt).getTime() !== new Date(createdAt).getTime() && isRecent(updatedAt);
}

export function formatDateTime(dateIso?: string | null, fallback = 'Sin registro'): string {
  if (!dateIso) return fallback;
  const date = new Date(dateIso);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: APP_TIME_ZONE, dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23',
      }).format(date)
    : fallback;
}
