// ─────────────────────────────────────────────
//  features/academic/areas/areasStore.ts
//  Store compartido (fuera de React) para Áreas de formación —
//  mismo patrón que environmentsStore.ts / academicStore.ts.
// ─────────────────────────────────────────────
import { Area, MOCK_AREAS } from './types';

type Listener = () => void;

let areas: Area[] = MOCK_AREAS;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAreasSnapshot() {
  return areas;
}

export function getAreaById(id: string) {
  return areas.find(a => a.id === id);
}

export function registerArea(name: string) {
  const normalized = name.trim();
  if (!normalized || areas.some(a => a.name.toLowerCase() === normalized.toLowerCase())) {
    return { success: false as const, error: 'academic.areas.duplicate' };
  }
  const now = new Date().toISOString();
  const area: Area = { id: `area-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: normalized, status: 'active', createdAt: now, updatedAt: now };
  areas = [...areas, area];
  emit();
  return { success: true as const, area };
}

export function updateAreaStore(id: string, name: string, status: 'active' | 'inactive') {
  const existing = areas.find(a => a.id === id);
  if (!existing) return { success: false as const, error: 'academic.areas.notFound' };
  areas = areas.map(a => (a.id === id ? { ...a, name: name.trim(), status, updatedAt: new Date().toISOString() } : a));
  emit();
  return { success: true as const };
}

// Desactivación lógica: no se elimina para no romper la trazabilidad de
// Programas e Instructores que ya la referencian.
export function deactivateAreaStore(id: string) {
  const existing = areas.find(a => a.id === id);
  if (!existing) return { success: false as const, error: 'academic.areas.notFound' };
  areas = areas.map(a => (a.id === id ? { ...a, status: 'inactive' as const, updatedAt: new Date().toISOString() } : a));
  emit();
  return { success: true as const };
}

export function reactivateAreaStore(id: string) {
  const existing = areas.find(a => a.id === id);
  if (!existing) return { success: false as const, error: 'academic.areas.notFound' };
  areas = areas.map(a => (a.id === id ? { ...a, status: 'active' as const, updatedAt: new Date().toISOString() } : a));
  emit();
  return { success: true as const };
}
