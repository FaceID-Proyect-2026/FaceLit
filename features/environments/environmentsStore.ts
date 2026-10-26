import { searchSessionEnvironments, getOrCreateSessionEnvironment } from './environmentSessionApi';
import type { Environment, EnvironmentForm } from './types';

type Listener = () => void;
let environments: Environment[] = [];
let meta = { owner: '', loading: false, error: false };
let generation = 0;
let pending: Promise<void> | null = null;
let lastLoaded = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(listener => listener());
export function subscribe(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export const getSnapshot = () => environments;
export const getMetaSnapshot = () => meta;
export const getById = (id: string) => environments.find(environment => environment.id === id);

export async function loadEnvironments(owner: string, force = false): Promise<void> {
  if (meta.owner === owner && pending) return pending;
  if (!force && meta.owner === owner && !meta.error && Date.now() - lastLoaded < 15000) return;
  const request = ++generation;
  environments = [];
  meta = { owner, loading: !!owner, error: false };
  emit();
  if (!owner) { lastLoaded = 0; pending = null; return; }
  pending = searchSessionEnvironments('').then(rows => {
    if (request !== generation) return;
    environments = rows.map(row => ({
      id: row.idEnvironment, code: row.environmentName,
      status: row.state === 'INACTIVE' ? 'inactive' : 'active',
      quantity: row.capacity ?? null,
      createdAt: row.createdAt ?? '', updatedAt: row.updatedAt ?? '',
      assignedFichas: [], assignmentsAvailable: false,
    }));
    meta = { owner, loading: false, error: false };
    lastLoaded = Date.now();
  }).catch(() => {
    if (request === generation) { environments = []; meta = { owner, loading: false, error: true }; }
  }).finally(() => { if (request === generation) { pending = null; emit(); } });
  return pending;
}

export async function registerEnvironment(form: EnvironmentForm) {
  const owner = meta.owner;
  if (!owner) return { success: false, error: 'dataState.error' };
  try {
    await getOrCreateSessionEnvironment(form.code.trim(), form.quantity);
    if (meta.owner !== owner) return { success: false, error: 'dataState.error' };
    await loadEnvironments(owner, true);
    return meta.error || meta.owner !== owner ? { success: false, error: 'dataState.error' } : { success: true };
  } catch { return { success: false, error: 'dataState.error' }; }
}

// These operations have no authorized server counterpart in the current scope.
// Never report a successful local-only mutation as a saved business record.
const unavailable = () => ({ success: false, error: 'dataState.pending' });
export const updateEnvironment = (_id: string, _form: EnvironmentForm) => unavailable();
export const deactivateEnvironment = (_id: string) => unavailable();
export const reactivateEnvironment = (_id: string) => unavailable();
export const deleteEnvironmentPermanently = (_id: string) => unavailable();
export const assignFichaToEnvironment = (_id: string, _code: string) => unavailable();
export const unassignFichaFromEnvironment = (_id: string, _code: string) => unavailable();
