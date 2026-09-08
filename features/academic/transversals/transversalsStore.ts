// ─────────────────────────────────────────────
//  features/academic/transversals/transversalsStore.ts
//  Store compartido para Transversales — mismo patrón que el resto
//  de módulos (academicStore, environmentsStore, areasStore).
// ─────────────────────────────────────────────
import { MOCK_TRANSVERSALS, Transversal } from './types';

type Listener = () => void;

let transversals: Transversal[] = MOCK_TRANSVERSALS;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTransversalsSnapshot() {
  return transversals;
}

export function getTransversalById(id: string) {
  return transversals.find(t => t.id === id);
}

// Transversales activas asociadas a un programa dado (RF sección 4/6:
// la lista de transversales de un programa es dinámica, no una copia
// fija creada al registrar el programa).
export function getTransversalsByProgram(programId: string) {
  return transversals.filter(t => t.status === 'active' && t.programIds.includes(programId));
}

export function registerTransversal(name: string, programIds: string[]) {
  const normalized = name.trim();
  if (!normalized || transversals.some(t => t.name.toLowerCase() === normalized.toLowerCase())) {
    return { success: false as const, error: 'academic.transversals.duplicate' };
  }
  const now = new Date().toISOString();
  const transversal: Transversal = {
    id: `trv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: normalized,
    status: 'active',
    programIds: [...new Set(programIds)],
    createdAt: now,
    updatedAt: now,
  };
  transversals = [...transversals, transversal];
  emit();
  return { success: true as const, transversal };
}

export function updateTransversalStore(id: string, name: string, status: 'active' | 'inactive', programIds: string[]) {
  const existing = transversals.find(t => t.id === id);
  if (!existing) return { success: false as const, error: 'academic.transversals.notFound' };
  transversals = transversals.map(t => (t.id === id
    ? { ...t, name: name.trim(), status, programIds: [...new Set(programIds)], updatedAt: new Date().toISOString() }
    : t));
  emit();
  return { success: true as const };
}

export function deactivateTransversalStore(id: string) {
  const existing = transversals.find(t => t.id === id);
  if (!existing) return { success: false as const, error: 'academic.transversals.notFound' };
  transversals = transversals.map(t => (t.id === id ? { ...t, status: 'inactive' as const, updatedAt: new Date().toISOString() } : t));
  emit();
  return { success: true as const };
}

export function reactivateTransversalStore(id: string) {
  const existing = transversals.find(t => t.id === id);
  if (!existing) return { success: false as const, error: 'academic.transversals.notFound' };
  transversals = transversals.map(t => (t.id === id ? { ...t, status: 'active' as const, updatedAt: new Date().toISOString() } : t));
  emit();
  return { success: true as const };
}
