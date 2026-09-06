export interface Schedule {
  id: string; fichaId: string; fichaNumber: string; programName: string;
  day: string; startTime: string; endTime: string;
  environmentId: string;   // '' = sin ambiente asignado (RF-4.6)
  environmentName: string;
  instructorId: string;    // '' = sin instructor asignado (RF-4.5)
  instructorName: string;
  status: 'active' | 'inactive';
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

// Tipos de excepción admitidos (HU-06). "other" se removió: el formulario
// solo contempla estas cuatro opciones según los requisitos del módulo.
export const EXCEPTION_TYPES = ['instructorChange', 'envChange', 'cancel', 'reschedule'] as const;
export type ExceptionType = typeof EXCEPTION_TYPES[number];

// Unidades disponibles para definir cuánto tiempo permanece Activa una
// excepción antes de pasar automáticamente a Inactiva.
export const EXCEPTION_DURATION_UNITS = ['hours', 'days', 'weeks', 'months'] as const;
export type ExceptionDurationUnit = typeof EXCEPTION_DURATION_UNITS[number];

export type ExceptionStatus = 'active' | 'inactive';

export interface ScheduleException {
  id: string;
  scheduleId: string;
  type: ExceptionType;
  startDate: string; // "AAAA-MM-DD"
  durationAmount: number;
  durationUnit: ExceptionDurationUnit;
  // Momento exacto (epoch ms) en el que la excepción pasa a Inactivo.
  // Se calcula una sola vez al registrar/editar — el estado en sí NUNCA
  // se guarda como campo fijo, sino que se deriva comparando este valor
  // contra Date.now() en cada lectura (ver getExceptionStatus más abajo).
  endTimestamp: number;
  reason: string;
  replacementInstructorId?: string;
  replacementInstructorName?: string;
  alternateEnvironmentId?: string;
  alternateEnvironmentCode?: string;
}

// Calcula el instante exacto en el que finaliza una excepción, a partir de
// la fecha de inicio y la duración elegida (horas/días/semanas/meses).
// Usa los setters de Date (en vez de sumar milisegundos fijos para meses)
// para respetar meses de distinta longitud y evitar errores de cálculo.
export function computeExceptionEndTimestamp(
  startDate: string, amount: number, unit: ExceptionDurationUnit
): number {
  const end = new Date(startDate + 'T00:00:00');
  switch (unit) {
    case 'hours':  end.setHours(end.getHours() + amount); break;
    case 'days':   end.setDate(end.getDate() + amount); break;
    case 'weeks':  end.setDate(end.getDate() + amount * 7); break;
    case 'months': end.setMonth(end.getMonth() + amount); break;
  }
  return end.getTime();
}

// Estado derivado en tiempo de lectura: Activo mientras no haya
// transcurrido el período definido; Inactivo una vez finalizado.
export function getExceptionStatus(endTimestamp: number): ExceptionStatus {
  return Date.now() < endTimestamp ? 'active' : 'inactive';
}

export const MOCK_INSTRUCTORS = [
  { id: 'i1', name: 'María González' }, { id: 'i2', name: 'Pedro Ramírez' },
  { id: 'i3', name: 'Laura Torres' }, { id: 'i4', name: 'Diego Herrera' },
];
export const MOCK_SCHEDULES: Schedule[] = [
  { id: 's1', fichaId: '1', fichaNumber: '3145555', programName: 'ADSO', day: 'monday', startTime: '07:00', endTime: '12:00', environmentId: '1', environmentName: 'Salón 101', instructorId: 'i1', instructorName: 'María González', status: 'active', createdAt: '2026-01-08T05:00:00.000Z', updatedAt: '2026-01-08T05:00:00.000Z' },
  { id: 's2', fichaId: '1', fichaNumber: '3145555', programName: 'ADSO', day: 'tuesday', startTime: '07:00', endTime: '12:00', environmentId: '3', environmentName: 'Lab. Sistemas', instructorId: 'i1', instructorName: 'María González', status: 'active', createdAt: '2026-01-08T05:00:00.000Z', updatedAt: '2026-01-08T05:00:00.000Z' },
  { id: 's3', fichaId: '2', fichaNumber: '3145556', programName: 'ADSO', day: 'monday', startTime: '13:00', endTime: '18:00', environmentId: '2', environmentName: 'Salón 102', instructorId: 'i2', instructorName: 'Pedro Ramírez', status: 'active', createdAt: '2026-01-08T05:00:00.000Z', updatedAt: '2026-01-08T05:00:00.000Z' },
];
export const MOCK_EXCEPTIONS: ScheduleException[] = [
  {
    id: 'e1', scheduleId: 's1', type: 'instructorChange', startDate: '2026-06-15',
    durationAmount: 3, durationUnit: 'days',
    endTimestamp: computeExceptionEndTimestamp('2026-06-15', 3, 'days'),
    reason: 'Instructor incapacitado', replacementInstructorId: 'i3', replacementInstructorName: 'Laura Torres',
  },
];

// Días disponibles para horarios (usados por index/register/[id] — antes cada
// pantalla tenía su propio diccionario hardcodeado en español, ignorando el
// idioma activo; ahora se combina con `t('schedules.days.<día>')`).
export const SCHEDULE_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Franjas horarias seleccionables (cada 30 min, de 06:00 a 21:00), para que
// el formulario de registro tenga un selector real en vez de un texto fijo.
export const TIME_SLOTS: string[] = Array.from({ length: 31 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});
