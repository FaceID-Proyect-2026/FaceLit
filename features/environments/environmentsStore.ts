import { searchSessionEnvironments, getOrCreateSessionEnvironment, updateEnvironment as updateEnvironmentApi, deactivateEnvironment as deactivateEnvironmentApi, assignFichaToEnvironment as assignFichaApi, unassignFichaFromEnvironment as unassignFichaApi, listEnvironmentAssignments } from './environmentSessionApi';
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
  pending = searchSessionEnvironments('', true).then(async rows => {
    if (request !== generation) return;
    const assignments = await Promise.all(rows.map(async row => [row.idEnvironment, await listEnvironmentAssignments(row.idEnvironment)] as const));
    const assignmentsByEnvironment = new Map(assignments);
    environments = rows.map(row => ({
      id: row.idEnvironment, code: row.environmentName,
      status: row.state === 'INACTIVE' ? 'inactive' : 'active',
      quantity: row.capacity ?? null,
      createdAt: row.createdAt ?? '', updatedAt: row.updatedAt ?? '',
      assignedFichas: (assignmentsByEnvironment.get(row.idEnvironment) ?? []).map(item => ({ fichaCode: item.fichaCode, assignedAt: item.assignedAt ?? '' })),
      assignmentsAvailable: true,
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

export async function updateEnvironment(id: string, form: EnvironmentForm) {
  const owner = meta.owner;
  try {
    await updateEnvironmentApi(id, { environmentName: form.code.trim(), capacity: form.quantity, state: form.status === 'inactive' ? 'INACTIVE' : 'ACTIVE' });
    await loadEnvironments(owner, true);
    return { success: true };
  } catch { return { success: false, error: 'dataState.error' }; }
}
export async function deactivateEnvironment(id: string) {
  const owner = meta.owner;
  try { await deactivateEnvironmentApi(id); await loadEnvironments(owner, true); return { success: true }; }
  catch { return { success: false, error: 'dataState.error' }; }
}
export async function reactivateEnvironment(id: string) {
  const current = getById(id);
  if (!current) return { success: false, error: 'environments.errors.notFound' };
  return updateEnvironment(id, { code: current.code, quantity: current.quantity ?? undefined, status: 'active' });
}

export async function assignFichaToEnvironment(id: string, idChip: string) {
  try { await assignFichaApi(id, idChip); await loadEnvironments(meta.owner, true); return { success: true }; }
  catch { return { success: false, error: 'dataState.error' }; }
}
export async function unassignFichaFromEnvironment(id: string, idChip: string) {
  try { await unassignFichaApi(id, idChip); await loadEnvironments(meta.owner, true); return { success: true }; }
  catch { return { success: false, error: 'dataState.error' }; }
}
