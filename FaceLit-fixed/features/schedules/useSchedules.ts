// ─────────────────────────────────────────────
//  features/schedules/useSchedules.ts
//  Hook con lógica CRUD de Horarios y Excepciones.
//  Usa un store externo compartido (schedulesStore) para que
//  listado/registro/detalle/excepciones siempre vean los
//  mismos datos — igual que useEnvironments/useAcademic.
// ─────────────────────────────────────────────
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { Schedule, ScheduleException } from './types';
import {
  subscribe,
  getSchedulesSnapshot,
  getExceptionsSnapshot,
  getScheduleById,
  checkScheduleConflict,
  registerSchedule,
  updateScheduleStore,
  deleteScheduleStore,
  registerExceptionStore,
  deleteExceptionStore,
  checkExceptionAvailability,
} from './schedulesStore';

export function useSchedules() {
  const schedules = useSyncExternalStore(subscribe, getSchedulesSnapshot);
  const exceptions = useSyncExternalStore(subscribe, getExceptionsSnapshot);
  const [search, setSearch] = useState('');

  const filteredSchedules = useMemo(() => {
    if (!search.trim()) return schedules;
    const q = search.toLowerCase();
    return schedules.filter(
      s => s.fichaNumber.toLowerCase().includes(q) ||
        s.environmentName.toLowerCase().includes(q) ||
        s.instructorName.toLowerCase().includes(q)
    );
  }, [schedules, search]);

  const getById = useCallback((id: string) => getScheduleById(id), [schedules]);
  const checkConflict = useCallback(
    (data: { day: string; startTime: string; endTime: string; environmentId: string; instructorId: string; excludeId?: string }) =>
      checkScheduleConflict(data),
    [schedules]
  );

  const register = useCallback((data: Omit<Schedule, 'id'>) => registerSchedule(data), []);
  const update = useCallback((id: string, data: Omit<Schedule, 'id'>) => updateScheduleStore(id, data), []);
  const remove = useCallback((id: string) => deleteScheduleStore(id), []);

  const getExceptionsBySchedule = useCallback(
    (scheduleId: string) => exceptions.filter(e => e.scheduleId === scheduleId),
    [exceptions]
  );
  const registerException = useCallback((data: Omit<ScheduleException, 'id'>) => registerExceptionStore(data), []);
  const removeException = useCallback((id: string) => deleteExceptionStore(id), []);
  const checkExceptionAvail = useCallback(
    (data: { scheduleId: string; environmentId?: string; instructorId?: string }) => checkExceptionAvailability(data),
    [schedules]
  );

  return {
    schedules: filteredSchedules,
    allSchedules: schedules,
    exceptions,
    search,
    setSearch,
    getById,
    checkConflict,
    register,
    update,
    remove,
    getExceptionsBySchedule,
    registerException,
    removeException,
    checkExceptionAvail,
  };
}
