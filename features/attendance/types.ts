export type AttendanceStatus = 'punctual' | 'late' | 'absent' | 'invalidEnv';

/**
 * Raw attendance events. Relationship fields deliberately use IDs; labels are
 * resolved from the Academic, Schedule and Environment modules at render time.
 */
export interface AttendanceEvent {
  id: string;
  userId: string;
  scheduleId: string;
  date: string;
  entryTime: string;
  exitTime: string;
  status: AttendanceStatus;
  delayMinutes: number;
}

// Temporary local source until the attendance API is connected. These events
// only identify the learner and the scheduled session; no duplicated learner,
// ficha, program or environment labels are stored here.
//
// Schedules used (from MOCK_SCHEDULES in schedulesStore):
//   s1 → fichaId '1' (3145555), day 'monday',    env 'e1', instructor 'María González', 07:00-12:00
//   s3 → fichaId '2' (3145556), day 'monday',    env 'e3', instructor 'María González', 13:00-18:00
//   s5 → fichaId '1' (3145555), day 'wednesday', env 'e1', instructor 'María González', 07:00-12:00
//
// Learners in ficha '1' (3145555): l1=u-appr-1 (Juan Pérez), l2=Ana Martínez, l3=Carlos López
// Learners in ficha '2' (3145556): l4=María Gómez
export const ATTENDANCE_EVENTS: AttendanceEvent[] = [
  // ── Semana del 22-jun-2026 (lunes) ──────────────────────────────────────────
  { id: 'a1',  userId: 'u-appr-1', scheduleId: 's1', date: '2026-06-22', entryTime: '06:58', exitTime: '12:05', status: 'punctual', delayMinutes: 0 },
  { id: 'a2',  userId: 'l2',       scheduleId: 's1', date: '2026-06-22', entryTime: '07:15', exitTime: '12:00', status: 'late',     delayMinutes: 15 },
  { id: 'a3',  userId: 'l3',       scheduleId: 's1', date: '2026-06-22', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0 },
  { id: 'a4',  userId: 'l4',       scheduleId: 's3', date: '2026-06-22', entryTime: '13:02', exitTime: '17:58', status: 'punctual', delayMinutes: 0 },

  // ── Semana del 22-jun-2026 (miércoles) ──────────────────────────────────────
  { id: 'a5',  userId: 'u-appr-1', scheduleId: 's5', date: '2026-06-24', entryTime: '07:00', exitTime: '12:00', status: 'punctual', delayMinutes: 0 },
  { id: 'a6',  userId: 'l2',       scheduleId: 's5', date: '2026-06-24', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0 },
  { id: 'a7',  userId: 'l3',       scheduleId: 's5', date: '2026-06-24', entryTime: '07:22', exitTime: '12:00', status: 'late',     delayMinutes: 22 },

  // ── Semana del 29-jun-2026 (lunes) ──────────────────────────────────────────
  { id: 'a8',  userId: 'u-appr-1', scheduleId: 's1', date: '2026-06-29', entryTime: '07:05', exitTime: '12:00', status: 'late',     delayMinutes: 5 },
  { id: 'a9',  userId: 'l2',       scheduleId: 's1', date: '2026-06-29', entryTime: '06:55', exitTime: '12:03', status: 'punctual', delayMinutes: 0 },
  { id: 'a10', userId: 'l3',       scheduleId: 's1', date: '2026-06-29', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0 },
  { id: 'a11', userId: 'l4',       scheduleId: 's3', date: '2026-06-29', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0 },

  // ── Semana del 29-jun-2026 (miércoles) ──────────────────────────────────────
  { id: 'a12', userId: 'u-appr-1', scheduleId: 's5', date: '2026-07-01', entryTime: '07:00', exitTime: '12:00', status: 'punctual', delayMinutes: 0 },
  { id: 'a13', userId: 'l2',       scheduleId: 's5', date: '2026-07-01', entryTime: '07:18', exitTime: '12:00', status: 'late',     delayMinutes: 18 },
  { id: 'a14', userId: 'l3',       scheduleId: 's5', date: '2026-07-01', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0 },

  // ── Semana del 06-jul-2026 (lunes) ──────────────────────────────────────────
  { id: 'a15', userId: 'u-appr-1', scheduleId: 's1', date: '2026-07-06', entryTime: '07:00', exitTime: '12:01', status: 'punctual', delayMinutes: 0 },
  { id: 'a16', userId: 'l2',       scheduleId: 's1', date: '2026-07-06', entryTime: '07:31', exitTime: '12:00', status: 'late',     delayMinutes: 31 },
  { id: 'a17', userId: 'l3',       scheduleId: 's1', date: '2026-07-06', entryTime: '07:00', exitTime: '12:00', status: 'punctual', delayMinutes: 0 },
  { id: 'a18', userId: 'l4',       scheduleId: 's3', date: '2026-07-06', entryTime: '13:00', exitTime: '18:00', status: 'punctual', delayMinutes: 0 },

  // ── Semana del 06-jul-2026 (miércoles) ──────────────────────────────────────
  { id: 'a19', userId: 'u-appr-1', scheduleId: 's5', date: '2026-07-08', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0 },
  { id: 'a20', userId: 'l2',       scheduleId: 's5', date: '2026-07-08', entryTime: '07:00', exitTime: '12:00', status: 'punctual', delayMinutes: 0 },
  { id: 'a21', userId: 'l3',       scheduleId: 's5', date: '2026-07-08', entryTime: '07:12', exitTime: '12:00', status: 'late',     delayMinutes: 12 },
];
