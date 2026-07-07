export interface Schedule {
  id: string; fichaId: string; fichaNumber: string; programName: string;
  day: string; startTime: string; endTime: string; environmentId: string;
  environmentName: string; instructorId: string; instructorName: string;
}
export interface ScheduleException {
  id: string; scheduleId: string; type: string; date: string; reason: string;
  replacementInstructor?: string; newEnvironment?: string;
}
export const MOCK_INSTRUCTORS = [
  { id: 'i1', name: 'María González' }, { id: 'i2', name: 'Pedro Ramírez' },
  { id: 'i3', name: 'Laura Torres' }, { id: 'i4', name: 'Diego Herrera' },
];
export const MOCK_SCHEDULES: Schedule[] = [
  { id: 's1', fichaId: '1', fichaNumber: '3145555', programName: 'ADSO', day: 'monday', startTime: '07:00', endTime: '12:00', environmentId: '1', environmentName: 'Salón 101', instructorId: 'i1', instructorName: 'María González' },
  { id: 's2', fichaId: '1', fichaNumber: '3145555', programName: 'ADSO', day: 'tuesday', startTime: '07:00', endTime: '12:00', environmentId: '3', environmentName: 'Lab. Sistemas', instructorId: 'i1', instructorName: 'María González' },
  { id: 's3', fichaId: '2', fichaNumber: '3145556', programName: 'ADSO', day: 'monday', startTime: '13:00', endTime: '18:00', environmentId: '2', environmentName: 'Salón 102', instructorId: 'i2', instructorName: 'Pedro Ramírez' },
];
export const MOCK_EXCEPTIONS: ScheduleException[] = [
  { id: 'e1', scheduleId: 's1', type: 'instructorChange', date: '2026-06-15', reason: 'Instructor incapacitado', replacementInstructor: 'Laura Torres' },
];
