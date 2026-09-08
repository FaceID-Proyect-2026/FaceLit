// ─────────────────────────────────────────────
//  features/academic/periods/useAcademicPeriods.ts
// ─────────────────────────────────────────────
import { useCallback, useSyncExternalStore } from 'react';
import {
    deactivatePeriodStore,
    getPeriodById,
    getPeriodsSnapshot,
    PeriodInput,
    reactivatePeriodStore,
    registerPeriod,
    subscribe,
    updatePeriodStore,
} from './periodsStore';

export function useAcademicPeriods() {
  const periods = useSyncExternalStore(subscribe, getPeriodsSnapshot);
  const activePeriods = periods.filter(p => p.status === 'active');

  const getPeriod = useCallback((id: string) => getPeriodById(id), []);
  const addPeriod = useCallback((input: PeriodInput) => registerPeriod(input), []);
  const updatePeriod = useCallback((id: string, input: PeriodInput) => updatePeriodStore(id, input), []);
  const deactivatePeriod = useCallback((id: string) => deactivatePeriodStore(id), []);
  const reactivatePeriod = useCallback((id: string) => reactivatePeriodStore(id), []);

  return { periods, activePeriods, getPeriod, addPeriod, updatePeriod, deactivatePeriod, reactivatePeriod };
}
