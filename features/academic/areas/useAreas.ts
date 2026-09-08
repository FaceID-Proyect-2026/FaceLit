// ─────────────────────────────────────────────
//  features/academic/areas/useAreas.ts
// ─────────────────────────────────────────────
import { useCallback, useSyncExternalStore } from 'react';
import {
    deactivateAreaStore,
    getAreasSnapshot,
    reactivateAreaStore,
    registerArea,
    subscribe,
    updateAreaStore,
} from './areasStore';

export function useAreas() {
  const areas = useSyncExternalStore(subscribe, getAreasSnapshot);
  const activeAreas = areas.filter(a => a.status === 'active');

  const addArea = useCallback((name: string) => registerArea(name), []);
  const updateArea = useCallback((id: string, name: string, status: 'active' | 'inactive') => updateAreaStore(id, name, status), []);
  const deactivateArea = useCallback((id: string) => deactivateAreaStore(id), []);
  const reactivateArea = useCallback((id: string) => reactivateAreaStore(id), []);

  return { areas, activeAreas, addArea, updateArea, deactivateArea, reactivateArea };
}
