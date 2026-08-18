export interface AttendanceRecord {
  id: string; userId: string; userName: string; fichaNumber: string;
  environmentName: string; date: string; entryTime: string; exitTime: string;
  status: 'punctual' | 'late' | 'absent' | 'invalidEnv'; delayMinutes: number;
}
export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', userId: 'l1', userName: 'Juan Pérez', fichaNumber: '3145555', environmentName: 'Salón 101', date: '2026-06-24', entryTime: '06:58', exitTime: '12:05', status: 'punctual', delayMinutes: 0 },
  { id: 'a2', userId: 'l2', userName: 'Ana Martínez', fichaNumber: '3145555', environmentName: 'Salón 101', date: '2026-06-24', entryTime: '07:15', exitTime: '12:00', status: 'late', delayMinutes: 15 },
  { id: 'a3', userId: 'l3', userName: 'Carlos López', fichaNumber: '3145555', environmentName: 'Salón 101', date: '2026-06-24', entryTime: '', exitTime: '', status: 'absent', delayMinutes: 0 },
  { id: 'a4', userId: 'l4', userName: 'María Gómez', fichaNumber: '3145556', environmentName: 'Salón 102', date: '2026-06-24', entryTime: '13:02', exitTime: '17:58', status: 'punctual', delayMinutes: 0 },
];
