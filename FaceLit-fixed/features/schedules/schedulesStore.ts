// ─────────────────────────────────────────────
//  features/schedules/schedulesStore.ts
//  Store compartido (fuera de React) para que todas las
//  pantallas (listado, registro, detalle, excepciones) vean
//  siempre los mismos datos — mismo patrón que
//  environmentsStore.ts y academicStore.ts.
//
//  Antes, cada pantalla importaba MOCK_SCHEDULES /
//  MOCK_EXCEPTIONS directamente desde types.ts: nada de lo
//  que se "registraba", "editaba" o "eliminaba" se guardaba
//  realmente, porque cada pantalla leía la misma constante
//  congelada en el momento de cargar el módulo.
// ─────────────────────────────────────────────
import { MOCK_EXCEPTIONS, MOCK_SCHEDULES, Schedule, ScheduleException, getExceptionStatus } from './types';

type Listener = () => void;

let schedules: Schedule[] = MOCK_SCHEDULES;
let exceptions: ScheduleException[] = MOCK_EXCEPTIONS;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSchedulesSnapshot() {
  return schedules;
}

export function getExceptionsSnapshot() {
  return exceptions;
}

export function getScheduleById(id: string) {
  return schedules.find(s => s.id === id);
}

// Dos rangos horarios se solapan si uno empieza antes de que el otro
// termine y viceversa (comparación de strings "HH:MM" funciona porque
// tienen el mismo formato de ancho fijo).
function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export interface ScheduleConflict {
  envOccupied: boolean;
  instructorBusy: boolean;
}

// Verifica choques de horario: mismo ambiente o mismo instructor con
// franjas que se solapan el mismo día. `excludeId` se usa al editar,
// para no comparar el horario contra sí mismo.
export function checkScheduleConflict(data: {
  day: string; startTime: string; endTime: string; environmentId: string; instructorId: string; excludeId?: string;
}): ScheduleConflict {
  const sameDay = schedules.filter(s => s.day === data.day && s.id !== data.excludeId);
  const envOccupied = sameDay.some(
    s => s.environmentId === data.environmentId && timesOverlap(data.startTime, data.endTime, s.startTime, s.endTime)
  );
  const instructorBusy = sameDay.some(
    s => s.instructorId === data.instructorId && timesOverlap(data.startTime, data.endTime, s.startTime, s.endTime)
  );
  return { envOccupied, instructorBusy };
}

export function registerSchedule(data: Omit<Schedule, 'id'>) {
  const conflict = checkScheduleConflict(data);
  if (conflict.envOccupied) return { success: false, error: 'schedules.conflicts.envOccupied' };
  if (conflict.instructorBusy) return { success: false, error: 'schedules.conflicts.instructorBusy' };
  const schedule: Schedule = { id: Date.now().toString(), ...data };
  schedules = [...schedules, schedule];
  emit();
  return { success: true, schedule };
}

export function updateScheduleStore(id: string, data: Omit<Schedule, 'id'>) {
  const conflict = checkScheduleConflict({ ...data, excludeId: id });
  if (conflict.envOccupied) return { success: false, error: 'schedules.conflicts.envOccupied' };
  if (conflict.instructorBusy) return { success: false, error: 'schedules.conflicts.instructorBusy' };
  schedules = schedules.map(s => (s.id === id ? { id, ...data } : s));
  emit();
  return { success: true };
}

export function deleteScheduleStore(id: string) {
  schedules = schedules.filter(s => s.id !== id);
  // Las excepciones asociadas a un horario eliminado dejan de tener sentido.
  exceptions = exceptions.filter(e => e.scheduleId !== id);
  emit();
  return { success: true };
}

// Verifica disponibilidad del ambiente alterno / instructor de reemplazo
// elegidos para una excepción, contra el resto de horarios regulares que
// ocupan el mismo día y franja horaria que el horario padre de la
// excepción (mismo criterio de choque que checkScheduleConflict).
export interface ExceptionAvailability {
  envBusy: boolean;
  instructorBusy: boolean;
}

export function checkExceptionAvailability(data: {
  scheduleId: string; environmentId?: string; instructorId?: string;
}): ExceptionAvailability {
  const schedule = schedules.find(s => s.id === data.scheduleId);
  if (!schedule) return { envBusy: false, instructorBusy: false };

  const envBusy = !!data.environmentId && schedules.some(
    s => s.id !== schedule.id && s.day === schedule.day && s.environmentId === data.environmentId &&
      timesOverlap(schedule.startTime, schedule.endTime, s.startTime, s.endTime)
  );
  const instructorBusy = !!data.instructorId && schedules.some(
    s => s.id !== schedule.id && s.day === schedule.day && s.instructorId === data.instructorId &&
      timesOverlap(schedule.startTime, schedule.endTime, s.startTime, s.endTime)
  );

  return { envBusy, instructorBusy };
}

export function registerExceptionStore(data: Omit<ScheduleException, 'id'>) {
  const exception: ScheduleException = { id: Date.now().toString(), ...data };
  exceptions = [...exceptions, exception];
  emit();
  return { success: true, exception };
}

export function deleteExceptionStore(id: string) {
  const exception = exceptions.find(e => e.id === id);
  if (!exception) return { success: false, error: 'schedules.notFound' };
  // Solo se puede eliminar definitivamente una excepción una vez que su
  // estado calculado sea Inactivo (el período definido ya transcurrió).
  if (getExceptionStatus(exception.endTimestamp) === 'active') {
    return { success: false, error: 'schedules.exceptionDeleteBlocked' };
  }
  exceptions = exceptions.filter(e => e.id !== id);
  emit();
  return { success: true };
}
