// ─────────────────────────────────────────────
//  features/academic/transversals/useTransversals.ts
// ─────────────────────────────────────────────
import { useCallback, useSyncExternalStore } from 'react';
import {
    deactivateTransversalStore,
    getTransversalById,
    getTransversalsByProgram,
    getTransversalsSnapshot,
    reactivateTransversalStore,
    registerTransversal,
    subscribe,
    updateTransversalStore,
} from './transversalsStore';

export function useTransversals() {
  const transversals = useSyncExternalStore(subscribe, getTransversalsSnapshot);
  const activeTransversals = transversals.filter(t => t.status === 'active');

  const getTransversal = useCallback((id: string) => getTransversalById(id), []);
  const byProgram = useCallback((programId: string) => getTransversalsByProgram(programId), []);
  const addTransversal = useCallback((name: string, programIds: string[]) => registerTransversal(name, programIds), []);
  const updateTransversal = useCallback(
    (id: string, name: string, status: 'active' | 'inactive', programIds: string[]) => updateTransversalStore(id, name, status, programIds),
    []
  );
  const deactivateTransversal = useCallback((id: string) => deactivateTransversalStore(id), []);
  const reactivateTransversal = useCallback((id: string) => reactivateTransversalStore(id), []);

  return {
    transversals, activeTransversals, getTransversal, byProgram,
    addTransversal, updateTransversal, deactivateTransversal, reactivateTransversal,
  };
}
