import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { getAcademicMetaSnapshot, getFichasSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { refreshAcademicStoreFromBackend } from '@/features/academic/useAcademic';
import { useAuth } from '@/shared/contexts/AuthContext';
import { fetchAttendanceMatrix } from '@/shared/services/facialAttendanceService';
import { subscribeRealtime } from '@/shared/services/realtime';
import { createAttendanceDataStore } from './attendanceData';

export type { ResolvedAttendance } from './attendanceData';
export { resolveAttendance } from './attendanceData';
const attendanceData = createAttendanceDataStore(fetchAttendanceMatrix);

export function useAttendance() {
  const { user } = useAuth();
  const fichas = useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  const academic = useSyncExternalStore(subscribeAcademic, getAcademicMetaSnapshot);
  const snapshot = useSyncExternalStore(attendanceData.subscribe, attendanceData.getSnapshot);
  const owner = user ? `${user.id}:${user.role}` : '';
  const key = attendanceData.keyFor(owner, fichas);
  const retry = useCallback(() => {
    void (async () => {
      if (academic.loadError) {
        try { await refreshAcademicStoreFromBackend(user?.role); } catch { return; }
      }
      await attendanceData.load(owner, getFichasSnapshot(), true);
    })();
  }, [owner, academic.loadError, user]);
  useEffect(() => { void attendanceData.load(owner, fichas); }, [owner, fichas]);
  useEffect(() => subscribeRealtime(message => {
    if (message.type === 'sync' || message.type === 'data.changed') retry();
  }), [retry]);
  return useMemo(() => {
    const records = snapshot.key === key ? snapshot.records : [];
    const visible = user?.role === 'APPRENTICE' ? records.filter(row => row.userId === user.id) : records;
    return Object.assign([...visible], {
      loading: academic.loading || (!!owner && snapshot.key !== key) || snapshot.loading,
      error: !!academic.loadError || (snapshot.key === key && snapshot.error),
      retry,
    });
  }, [snapshot, key, academic, owner, user, retry]);
}
