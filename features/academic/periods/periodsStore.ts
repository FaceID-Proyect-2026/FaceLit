// ─────────────────────────────────────────────
//  features/academic/periods/periodsStore.ts
//  Store compartido para Períodos académicos — mismo patrón que el
//  resto de módulos. La disponibilidad de instructores/ambientes
//  (features/schedules/availability.ts) depende de que el período
//  seleccionado exista y esté activo (Prompt maestro, sección 18/19).
// ─────────────────────────────────────────────
import { AcademicPeriod, MOCK_ACADEMIC_PERIODS, PeriodType } from './types';

type Listener = () => void;

let periods: AcademicPeriod[] = MOCK_ACADEMIC_PERIODS;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPeriodsSnapshot() {
  return periods;
}

export function getPeriodById(id: string) {
  return periods.find(p => p.id === id);
}

export interface PeriodInput {
  name: string;
  type: PeriodType;
  number: number;
  year: number;
  startDate: string;
  endDate: string;
}

function validatePeriodInput(input: PeriodInput, excludeId?: string): string | null {
  if (!input.name.trim()) return 'academic.periods.nameRequired';
  if (!input.startDate || !input.endDate) return 'academic.periods.datesRequired';
  if (input.endDate <= input.startDate) return 'academic.periods.invalidDates';
  const duplicate = periods.some(p => p.id !== excludeId && p.type === input.type && p.number === input.number && p.year === input.year);
  if (duplicate) return 'academic.periods.duplicate';
  return null;
}

export function registerPeriod(input: PeriodInput) {
  const error = validatePeriodInput(input);
  if (error) return { success: false as const, error };
  const now = new Date().toISOString();
  const period: AcademicPeriod = {
    id: `period-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    type: input.type,
    number: input.number,
    year: input.year,
    startDate: input.startDate,
    endDate: input.endDate,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  periods = [...periods, period];
  emit();
  return { success: true as const, period };
}

export function updatePeriodStore(id: string, input: PeriodInput) {
  const existing = periods.find(p => p.id === id);
  if (!existing) return { success: false as const, error: 'academic.periods.notFound' };
  const error = validatePeriodInput(input, id);
  if (error) return { success: false as const, error };
  periods = periods.map(p => (p.id === id
    ? { ...p, ...input, name: input.name.trim(), updatedAt: new Date().toISOString() }
    : p));
  emit();
  return { success: true as const };
}

// Activar/desactivar: un período inactivo no debe ofrecerse en Gestión de
// Horarios para crear NUEVOS horarios, pero los horarios ya creados en él
// se conservan (no se tocan sus registros).
export function deactivatePeriodStore(id: string) {
  const existing = periods.find(p => p.id === id);
  if (!existing) return { success: false as const, error: 'academic.periods.notFound' };
  periods = periods.map(p => (p.id === id ? { ...p, status: 'inactive' as const, updatedAt: new Date().toISOString() } : p));
  emit();
  return { success: true as const };
}

export function reactivatePeriodStore(id: string) {
  const existing = periods.find(p => p.id === id);
  if (!existing) return { success: false as const, error: 'academic.periods.notFound' };
  periods = periods.map(p => (p.id === id ? { ...p, status: 'active' as const, updatedAt: new Date().toISOString() } : p));
  emit();
  return { success: true as const };
}
