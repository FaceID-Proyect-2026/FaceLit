export type AttendanceStatus = 'punctual' | 'late' | 'absent' | 'invalidEnv';

/**
 * Raw attendance events. Relationship fields deliberately use IDs; labels are
 * resolved from the Academic, Schedule and Environment modules at render time.
 */
export interface AttendanceEvent {
  id: string;
  userId: string;
  scheduleId: string;
  date: string;       // "YYYY-MM-DD"
  entryTime: string;  // "HH:MM" — vacío si absent
  exitTime: string;   // "HH:MM" — vacío si absent
  status: AttendanceStatus;
  delayMinutes: number;
}

// ── Mock data ─────────────────────────────────
// userId 'demo-apprentice' coincide con el token demo del AuthContext.
export const ATTENDANCE_EVENTS: AttendanceEvent[] = [
  // ── Demo apprentice — datos de prueba ────────
  { id: 'a10', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-09-08', entryTime: '06:55', exitTime: '12:02', status: 'punctual', delayMinutes: 0  },
  { id: 'a11', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-09-07', entryTime: '07:12', exitTime: '12:00', status: 'late',     delayMinutes: 12 },
  { id: 'a12', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-09-01', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0  },
  { id: 'a13', userId: 'demo-apprentice', scheduleId: 's2', date: '2026-08-26', entryTime: '07:02', exitTime: '12:01', status: 'punctual', delayMinutes: 0  },
  { id: 'a14', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-08-25', entryTime: '07:20', exitTime: '11:55', status: 'late',     delayMinutes: 20 },
  { id: 'a15', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-08-18', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0  },
  { id: 'a16', userId: 'demo-apprentice', scheduleId: 's2', date: '2026-08-12', entryTime: '06:58', exitTime: '12:00', status: 'punctual', delayMinutes: 0  },
  { id: 'a17', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-07-28', entryTime: '07:05', exitTime: '12:03', status: 'punctual', delayMinutes: 0  },
  { id: 'a18', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-07-21', entryTime: '07:35', exitTime: '12:00', status: 'late',     delayMinutes: 35 },
  { id: 'a19', userId: 'demo-apprentice', scheduleId: 's2', date: '2026-07-15', entryTime: '07:00', exitTime: '12:00', status: 'punctual', delayMinutes: 0  },
  { id: 'a20', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-07-07', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0  },
  { id: 'a21', userId: 'demo-apprentice', scheduleId: 's1', date: '2026-06-30', entryTime: '06:59', exitTime: '12:01', status: 'punctual', delayMinutes: 0  },
  // ── Otros usuarios (admin / instructor views) ─
  { id: 'a1',  userId: 'l1', scheduleId: 's1', date: '2026-06-22', entryTime: '06:58', exitTime: '12:05', status: 'punctual', delayMinutes: 0  },
  { id: 'a2',  userId: 'l2', scheduleId: 's1', date: '2026-06-22', entryTime: '07:15', exitTime: '12:00', status: 'late',     delayMinutes: 15 },
  { id: 'a3',  userId: 'l3', scheduleId: 's1', date: '2026-06-22', entryTime: '',      exitTime: '',      status: 'absent',   delayMinutes: 0  },
  { id: 'a4',  userId: 'l4', scheduleId: 's3', date: '2026-06-22', entryTime: '13:02', exitTime: '17:58', status: 'punctual', delayMinutes: 0  },
];
