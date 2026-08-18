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
  const newEnv: Environment = {
    id: Date.now().toString(),
    code: form.code.trim(),
    status: form.status ?? 'active',
    assignedFichas: [],
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
  } : e);
  emit();
}

// Desactiva el ambiente (soft delete). No elimina físicamente el registro
// para conservar la integridad de los datos relacionados (fichas asignadas).
export function deactivateEnvironment(id: string) {
  const env = environments.find(e => e.id === id);
  if (!env) return { success: false, error: 'Ambiente no encontrado' };
  environments = environments.map(e => e.id === id ? { ...e, status: 'inactive' as const } : e);
  emit();
  return { success: true };
}

export function assignFichaToEnvironment(envId: string, fichaId: string) {
  environments = environments.map(e =>
    e.id === envId && !e.assignedFichas.includes(fichaId)
      ? { ...e, assignedFichas: [...e.assignedFichas, fichaId] }
      : e
  );
  emit();
  return { success: true };
}

// Desasigna una ficha del ambiente. La ficha NO se elimina del sistema,
// únicamente se quita la relación con este ambiente.
export function unassignFichaFromEnvironment(envId: string, fichaId: string) {
  environments = environments.map(e =>
    e.id === envId
      ? { ...e, assignedFichas: e.assignedFichas.filter(f => f !== fichaId) }
      : e
  );
  emit();
  return { success: true };
}
