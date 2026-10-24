// ─────────────────────────────────────────────
//  features/environments/useEnvironments.ts
//  Hook con lógica CRUD de ambientes.
//  Usa un store externo compartido (environmentsStore)
//  para que register/list/detail siempre vean los
//  mismos datos, sin importar cuántas veces se
//  invoque este hook.
// ─────────────────────────────────────────────
import { useState, useCallback, useMemo, useSyncExternalStore, useEffect } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { EnvironmentStatus } from './types';
import {
  subscribe,
  getMetaSnapshot,
  loadEnvironments,
  getSnapshot,
  registerEnvironment,
  updateEnvironment,
  deactivateEnvironment,
  reactivateEnvironment,
  deleteEnvironmentPermanently,
  assignFichaToEnvironment,
  unassignFichaFromEnvironment,
} from './environmentsStore';

export type EnvironmentStatusFilter = 'all' | EnvironmentStatus;

export function useEnvironments() {
  const { user } = useAuth();
  const owner = user ? `${user.id}:${user.role}` : '';
  const meta = useSyncExternalStore(subscribe, getMetaSnapshot);
  const retry = useCallback(() => { void loadEnvironments(owner, true); }, [owner]);
  useEffect(() => { void loadEnvironments(owner); }, [owner]);
  const environments = useSyncExternalStore(subscribe, getSnapshot);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnvironmentStatusFilter>('all');

  const filtered = useMemo(() => {
    let list = meta.owner === owner ? environments : [];

    if (statusFilter !== 'all') {
      list = list.filter(e => e.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(e => e.code.toLowerCase().includes(q));
    }

    return list;
  }, [environments, search, statusFilter, meta.owner, owner]);

  const getById = useCallback((id: string) => meta.owner === owner ? environments.find(environment => environment.id === id) : undefined, [environments, meta.owner, owner]);

  const register = registerEnvironment;
  const update = updateEnvironment;
  const deactivate = deactivateEnvironment;
  const reactivate = reactivateEnvironment;
  const deletePermanently = deleteEnvironmentPermanently;
  const assignFicha = assignFichaToEnvironment;
  const unassignFicha = unassignFichaFromEnvironment;

  return {
    loading: meta.loading || meta.owner !== owner,
    error: meta.owner === owner && meta.error,
    retry,
    environments: filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    getById,
    register,
    update,
    deactivate,
    reactivate,
    deletePermanently,
    assignFicha,
    unassignFicha,
  };
}
