export type AttendanceStatus = 'punctual' | 'late' | 'absent' | 'invalidEnv';

/**
 * Attendance values returned by persisted environment sessions.
 */
export interface AttendanceEvent {
  id: string;
  userId: string;
  idRecordEnvironment: string;
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
  exitRegistered?: boolean;
  excuse?: boolean | null;
}
