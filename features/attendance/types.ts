export type AttendanceStatus = 'punctual' | 'late' | 'absent' | 'invalidEnv';

/**
 * Existing local attendance samples, independent of any planning module.
 * Academic and environment labels are still resolved from their own stores.
 */
export interface AttendanceEvent {
  id: string;
  userId: string;
  fichaId: string;
  environmentId: string;
  sessionStartTime: string;
  sessionEndTime: string;
  instructorName: string;
  date: string;       // "YYYY-MM-DD"
  entryTime: string;  // "HH:MM" — vacío si absent
  exitTime: string;   // "HH:MM" — vacío si absent
  status: AttendanceStatus;
  delayMinutes: number;
}

// Preserve the existing local samples and their original context. This source
// is not used by the API-backed facial capture or attendance matrix screens.
export const ATTENDANCE_EVENTS: AttendanceEvent[] = [
  { id: 'a1', userId: 'l1', fichaId: '1', environmentId: '1', sessionStartTime: '07:00', sessionEndTime: '12:00', instructorName: 'María González', date: '2026-06-22', entryTime: '06:58', exitTime: '12:05', status: 'punctual', delayMinutes: 0 },
  { id: 'a2', userId: 'l2', fichaId: '1', environmentId: '1', sessionStartTime: '07:00', sessionEndTime: '12:00', instructorName: 'María González', date: '2026-06-22', entryTime: '07:15', exitTime: '12:00', status: 'late', delayMinutes: 15 },
  { id: 'a3', userId: 'l3', fichaId: '1', environmentId: '1', sessionStartTime: '07:00', sessionEndTime: '12:00', instructorName: 'María González', date: '2026-06-22', entryTime: '', exitTime: '', status: 'absent', delayMinutes: 0 },
  { id: 'a4', userId: 'l4', fichaId: '2', environmentId: '2', sessionStartTime: '13:00', sessionEndTime: '18:00', instructorName: 'Pedro Ramírez', date: '2026-06-22', entryTime: '13:02', exitTime: '17:58', status: 'punctual', delayMinutes: 0 },
];
