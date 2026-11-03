/** Calendar date used by the existing attendance filters, always in Colombia. */
export const todayBogota = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/** Earliest calendar date allowed by the attendance consultation window. */
export const attendanceMinDate = (today = todayBogota()) => {
  const [year, month, day] = today.split("-").map(Number);
  const targetMonth = month - 6;
  const targetYear = year + Math.floor((targetMonth - 1) / 12);
  const normalizedMonth = ((targetMonth - 1) % 12 + 12) % 12 + 1;
  const lastTargetDay = new Date(Date.UTC(targetYear, normalizedMonth, 0)).getUTCDate();
  return `${targetYear}-${String(normalizedMonth).padStart(2, "0")}-${String(Math.min(day, lastTargetDay)).padStart(2, "0")}`;
};

/** True only for complete ranges inside the rolling six-calendar-month window. */
export const isAttendanceDateRangeAllowed = (dateFrom: string, dateTo: string) => {
  const today = todayBogota();
  return Boolean(dateFrom && dateTo)
    && dateFrom >= attendanceMinDate(today)
    && dateFrom <= dateTo
    && dateTo <= today;
};
