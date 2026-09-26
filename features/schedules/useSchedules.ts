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
  deactivateScheduleStore,
  reactivateScheduleStore,
  deleteSchedulePermanentlyStore,
  unassignInstructorStore,
  unassignEnvironmentStore,
  registerExceptionStore,
  deleteExceptionStore,
  checkExceptionAvailability,
} from './schedulesStore';

export type ScheduleStatusFilter = 'all' | 'active' | 'inactive';

export function useSchedules() {
  const schedules = useSyncExternalStore(subscribe, getSchedulesSnapshot);
  const exceptions = useSyncExternalStore(subscribe, getExceptionsSnapshot);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>('all');

  const filteredSchedules = useMemo(() => {
    let list = schedules;
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        s => s.fichaNumber.toLowerCase().includes(q) ||
          s.environmentName.toLowerCase().includes(q) ||
          s.instructorName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [schedules, search, statusFilter]);

  const getById = useCallback((id: string) => getScheduleById(id), [schedules]);
  const checkConflict = useCallback(
    (data: { day: string; startTime: string; endTime: string; environmentId: string; instructorId: string; excludeId?: string }) =>
      checkScheduleConflict(data),
    [schedules]
  );

  const register = useCallback((data: Omit<Schedule, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => registerSchedule(data), []);
  const update = useCallback((id: string, data: Omit<Schedule, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => updateScheduleStore(id, data), []);
  const deactivate = useCallback((id: string) => deactivateScheduleStore(id), []);
  const reactivate = useCallback((id: string) => reactivateScheduleStore(id), []);
  const removePermanently = useCallback((id: string) => deleteSchedulePermanentlyStore(id), []);
  const unassignInstructor = useCallback((id: string) => unassignInstructorStore(id), []);
  const unassignEnvironment = useCallback((id: string) => unassignEnvironmentStore(id), []);

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
    statusFilter,
    setStatusFilter,
    getById,
    checkConflict,
    register,
    update,
    deactivate,
    reactivate,
    removePermanently,
    unassignInstructor,
    unassignEnvironment,
    getExceptionsBySchedule,
    registerException,
    removeException,
    checkExceptionAvail,
  };
}
