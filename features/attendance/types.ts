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
export const ATTENDANCE_EVENTS: AttendanceEvent[] = [
  { id: 'a1', userId: 'l1', scheduleId: 's1', date: '2026-06-22', entryTime: '06:58', exitTime: '12:05', status: 'punctual', delayMinutes: 0 },
  { id: 'a2', userId: 'l2', scheduleId: 's1', date: '2026-06-22', entryTime: '07:15', exitTime: '12:00', status: 'late', delayMinutes: 15 },
  { id: 'a3', userId: 'l3', scheduleId: 's1', date: '2026-06-22', entryTime: '', exitTime: '', status: 'absent', delayMinutes: 0 },
  { id: 'a4', userId: 'l4', scheduleId: 's3', date: '2026-06-22', entryTime: '13:02', exitTime: '17:58', status: 'punctual', delayMinutes: 0 },
];
