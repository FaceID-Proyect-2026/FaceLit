// ─────────────────────────────────────────────
//  features/environments/environmentsStore.ts
//  Store compartido (fuera de React) para que
//  todas las pantallas vean los mismos datos.
// ─────────────────────────────────────────────
import { Environment, EnvironmentForm, MOCK_ENVIRONMENTS } from './types';

type Listener = () => void;

let environments: Environment[] = MOCK_ENVIRONMENTS;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return environments;
}

export function getById(id: string) {
  return environments.find(e => e.id === id);
}

export function registerEnvironment(form: EnvironmentForm) {
  const now = new Date().toISOString();
  const newEnv: Environment = {
    id: Date.now().toString(),
    code: form.code.trim(),
    status: form.status ?? 'active',
    quantity: form.quantity ?? 0,
    assignedFichas: [],
    createdAt: now,
    updatedAt: now,
  };
  environments = [...environments, newEnv];
  emit();
  return newEnv;
}

export function updateEnvironment(id: string, form: EnvironmentForm) {
  environments = environments.map(e => e.id === id ? {
    ...e,
    code: form.code.trim(),
    status: form.status ?? e.status,
    quantity: form.quantity ?? e.quantity,
    updatedAt: new Date().toISOString(),
  } : e);
  emit();
}

// Desactiva el ambiente (soft delete). No elimina físicamente el registro
// para conservar la integridad de los datos relacionados (fichas asignadas).
export function deactivateEnvironment(id: string) {
  const env = environments.find(e => e.id === id);
  if (!env) return { success: false, error: 'environments.errors.notFound' };
  environments = environments.map(e => e.id === id ? { ...e, status: 'inactive' as const, updatedAt: new Date().toISOString() } : e);
  emit();
  return { success: true };
}

export function reactivateEnvironment(id: string) {
  const env = environments.find(e => e.id === id);
  if (!env) return { success: false, error: 'environments.errors.notFound' };
  if (env.status !== 'inactive') return { success: false, error: 'environments.alreadyActive' };
  environments = environments.map(e => e.id === id ? { ...e, status: 'active' as const, updatedAt: new Date().toISOString() } : e);
  emit();
  return { success: true };
}

// Elimina físicamente el ambiente. Solo debe invocarse sobre ambientes
// Inactivos (la UI restringe la acción a esa pestaña) — se conserva una
// validación defensiva por si se llega a invocar en otro estado.
export function deleteEnvironmentPermanently(id: string) {
  const env = environments.find(e => e.id === id);
  if (!env) return { success: false, error: 'environments.errors.notFound' };
  if (env.status !== 'inactive') return { success: false, error: 'environments.noDeleteActive' };
  if (env.assignedFichas.some(assignment => !assignment.unassignedAt)) return { success: false, error: 'environments.noDeleteHasRelations' };
  environments = environments.filter(e => e.id !== id);
  emit();
  return { success: true };
}

export function assignFichaToEnvironment(envId: string, fichaCode: string) {
  const now = new Date().toISOString();
  environments = environments.map(e =>
    e.id === envId
      ? {
          ...e,
          assignedFichas: e.assignedFichas.some(item => item.fichaCode === fichaCode)
            ? e.assignedFichas.map(item => item.fichaCode === fichaCode ? { ...item, assignedAt: now, unassignedAt: undefined } : item)
            : [...e.assignedFichas, { fichaCode, assignedAt: now }],
          updatedAt: now,
        }
      : e
  );
  emit();
  return { success: true };
}

// Desasigna una ficha del ambiente. La ficha NO se elimina del sistema,
// únicamente se quita la relación con este ambiente.
export function unassignFichaFromEnvironment(envId: string, fichaCode: string) {
  environments = environments.map(e =>
    e.id === envId
      ? { ...e, assignedFichas: e.assignedFichas.map(f => f.fichaCode === fichaCode && !f.unassignedAt ? { ...f, unassignedAt: new Date().toISOString() } : f), updatedAt: new Date().toISOString() }
      : e
  );
  emit();
  return { success: true };
}
