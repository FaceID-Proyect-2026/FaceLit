// ─────────────────────────────────────────────
//  features/environments/useEnvironments.ts
//  Hook con lógica CRUD de ambientes.
//  Usa un store externo compartido (environmentsStore)
//  para que register/list/detail siempre vean los
//  mismos datos, sin importar cuántas veces se
//  invoque este hook.
// ─────────────────────────────────────────────
import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import { EnvironmentStatus } from './types';
import {
  subscribe,
  getSnapshot,
  getById as storeGetById,
  registerEnvironment,
  updateEnvironment,
  deactivateEnvironment,
  assignFichaToEnvironment,
  unassignFichaFromEnvironment,
} from './environmentsStore';

export type EnvironmentStatusFilter = 'all' | EnvironmentStatus;

export function useEnvironments() {
  const environments = useSyncExternalStore(subscribe, getSnapshot);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EnvironmentStatusFilter>('all');

  const filtered = useMemo(() => {
    let list = environments;

    if (statusFilter !== 'all') {
      list = list.filter(e => e.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(e => e.code.toLowerCase().includes(q));
    }

    return list;
  }, [environments, search, statusFilter]);

  const getById = useCallback((id: string) => storeGetById(id), [environments]);

  const register = useCallback(registerEnvironment, []);
  const update = useCallback(updateEnvironment, []);
  const deactivate = useCallback(deactivateEnvironment, []);
  const assignFicha = useCallback(assignFichaToEnvironment, []);
  const unassignFicha = useCallback(unassignFichaFromEnvironment, []);

  return {
    environments: filtered,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    getById,
    register,
    update,
    deactivate,
    assignFicha,
    unassignFicha,
  };
}
