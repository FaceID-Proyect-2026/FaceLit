// ─────────────────────────────────────────────
//  features/schedules/schedulesStore.ts
//  Store compartido (fuera de React) para Horarios y Excepciones —
//  mismo patrón que environmentsStore.ts y academicStore.ts.
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
// para no comparar el horario contra sí mismo. Un horario INACTIVO no
// ocupa el ambiente/instructor (no genera choque), y un campo vacío
// ("sin asignar", RF-4.5/4.6) tampoco compite por nada.
export function checkScheduleConflict(data: {
  day: string; startTime: string; endTime: string; environmentId: string; instructorId: string; excludeId?: string;
}): ScheduleConflict {
  const sameDay = schedules.filter(s => s.day === data.day && s.id !== data.excludeId && s.status === 'active');
  const envOccupied = !!data.environmentId && sameDay.some(
    s => !!s.environmentId && s.environmentId === data.environmentId && timesOverlap(data.startTime, data.endTime, s.startTime, s.endTime)
  );
  const instructorBusy = !!data.instructorId && sameDay.some(
    s => !!s.instructorId && s.instructorId === data.instructorId && timesOverlap(data.startTime, data.endTime, s.startTime, s.endTime)
  );
  return { envOccupied, instructorBusy };
}

export function registerSchedule(data: Omit<Schedule, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
  const conflict = checkScheduleConflict(data);
  if (conflict.envOccupied) return { success: false, error: 'schedules.conflicts.envOccupied' };
  if (conflict.instructorBusy) return { success: false, error: 'schedules.conflicts.instructorBusy' };
  const now = new Date().toISOString();
  const schedule: Schedule = { id: Date.now().toString(), ...data, status: 'active', createdAt: now, updatedAt: now };
  schedules = [...schedules, schedule];
  emit();
  return { success: true, schedule };
}

export function updateScheduleStore(id: string, data: Omit<Schedule, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
  const existing = schedules.find(s => s.id === id);
  if (!existing) return { success: false, error: 'schedules.notFound' };
  const conflict = checkScheduleConflict({ ...data, excludeId: id });
  if (conflict.envOccupied) return { success: false, error: 'schedules.conflicts.envOccupied' };
  if (conflict.instructorBusy) return { success: false, error: 'schedules.conflicts.instructorBusy' };
  schedules = schedules.map(s => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
  emit();
  return { success: true };
}

// ── Ciclo de vida (activo → inactivo → eliminación definitiva) ──
// Mismo patrón que Programas/Fichas/Ambientes: primero se desactiva
// (soft-delete), y solo después, sin relaciones pendientes, se permite
// la eliminación definitiva.
export function deactivateScheduleStore(id: string) {
  const existing = schedules.find(s => s.id === id);
  if (!existing) return { success: false, error: 'schedules.notFound' };
  schedules = schedules.map(s => (s.id === id ? { ...s, status: 'inactive', updatedAt: new Date().toISOString() } : s));
  emit();
  return { success: true };
}

export function reactivateScheduleStore(id: string) {
  const existing = schedules.find(s => s.id === id);
  if (!existing) return { success: false, error: 'schedules.notFound' };
  // Antes de reactivar, se revalida que no haya surgido un choque mientras
  // estaba inactivo (pudo haberse creado otro horario en su lugar).
  const conflict = checkScheduleConflict({ ...existing, excludeId: id });
  if (conflict.envOccupied) return { success: false, error: 'schedules.conflicts.envOccupied' };
  if (conflict.instructorBusy) return { success: false, error: 'schedules.conflicts.instructorBusy' };
  schedules = schedules.map(s => (s.id === id ? { ...s, status: 'active', updatedAt: new Date().toISOString() } : s));
  emit();
  return { success: true };
}

// Eliminación DEFINITIVA: solo si está inactivo, sin instructor ni
// ambiente asignados (hay que desvincularlos primero, RF-4.5/4.6), y sin
// ninguna excepción registrada (ni siquiera inactivas — se conserva el
// historial mientras el horario exista).
export function deleteSchedulePermanentlyStore(id: string) {
  const existing = schedules.find(s => s.id === id);
  if (!existing) return { success: false, error: 'schedules.notFound' };
  if (existing.status !== 'inactive') return { success: false, error: 'schedules.noDeleteActive' };
  if (existing.instructorId || existing.environmentId) return { success: false, error: 'schedules.noDeleteHasAssignments' };
  if (exceptions.some(e => e.scheduleId === id)) return { success: false, error: 'schedules.noDeleteHasExceptions' };
  schedules = schedules.filter(s => s.id !== id);
  emit();
  return { success: true };
}

// ── RF-4.5 — Desvincular instructor de un horario ──
// No elimina al instructor del sistema, solo limpia la relación con
// ESTE horario específico, que queda con instructor "Sin asignar".
export function unassignInstructorStore(scheduleId: string) {
  const existing = schedules.find(s => s.id === scheduleId);
  if (!existing) return { success: false, error: 'schedules.notFound' };
  if (!existing.instructorId) return { success: false, error: 'schedules.noInstructorAssigned' };
  schedules = schedules.map(s => (s.id === scheduleId ? { ...s, instructorId: '', instructorName: '', updatedAt: new Date().toISOString() } : s));
  emit();
  return { success: true };
}

// ── RF-4.6 — Desvincular ambiente de un horario ──
export function unassignEnvironmentStore(scheduleId: string) {
  const existing = schedules.find(s => s.id === scheduleId);
  if (!existing) return { success: false, error: 'schedules.notFound' };
  if (!existing.environmentId) return { success: false, error: 'schedules.noEnvironmentAssigned' };
  schedules = schedules.map(s => (s.id === scheduleId ? { ...s, environmentId: '', environmentName: '', updatedAt: new Date().toISOString() } : s));
  emit();
  return { success: true };
}

// Verifica disponibilidad del ambiente alterno / instructor de reemplazo
// elegidos para una excepción, contra el resto de horarios regulares
// ACTIVOS que ocupan el mismo día y franja horaria que el horario padre
// de la excepción (mismo criterio de choque que checkScheduleConflict).
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
    s => s.id !== schedule.id && s.status === 'active' && s.day === schedule.day && s.environmentId === data.environmentId &&
      timesOverlap(schedule.startTime, schedule.endTime, s.startTime, s.endTime)
  );
  const instructorBusy = !!data.instructorId && schedules.some(
    s => s.id !== schedule.id && s.status === 'active' && s.day === schedule.day && s.instructorId === data.instructorId &&
      timesOverlap(schedule.startTime, schedule.endTime, s.startTime, s.endTime)
  );

  return { envBusy, instructorBusy };
}

export function registerExceptionStore(data: Omit<ScheduleException, 'id'>) {
  const schedule = schedules.find(s => s.id === data.scheduleId);
  if (!schedule) return { success: false, error: 'schedules.notFound' };

  // "Ya existe excepción para ese horario y fecha" (RF-4.4, escenario alterno).
  const duplicate = exceptions.some(e => e.scheduleId === data.scheduleId && e.startDate === data.startDate);
  if (duplicate) return { success: false, error: 'schedules.exceptionDuplicateDate' };

  // "El ambiente alterno debe ser diferente al ambiente original del horario."
  if (data.type === 'envChange' && data.alternateEnvironmentId && data.alternateEnvironmentId === schedule.environmentId) {
    return { success: false, error: 'schedules.exceptionSameEnvironment' };
  }

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
