import type { AttendanceMatrixResponse } from '@/shared/services/facialAttendanceService';
import type { Ficha } from '@/features/academic/types';
import type { AttendanceEvent } from './types';

export interface ResolvedAttendance extends AttendanceEvent {
  userName: string;
  userDocument: string;
  userEmail: string;
  fichaNumber: string;
  programId: string;
  programName: string;
  environmentName: string;
  instructorName: string;
}

/** Adapt persisted matrix rows without joining demonstration stores. */
export function resolveAttendance(matrices: AttendanceMatrixResponse[], fichas: Ficha[]): ResolvedAttendance[] {
  return matrices.flatMap(matrix => {
    const ficha = fichas.find(item => item.id === matrix.idChip);
    if (!ficha) return [];
    return matrix.learners.flatMap(learner => learner.days.map(day => {
      if (!['punctual', 'late', 'absent'].includes(day.status)) throw new Error('Invalid attendance status');
      return {
        id: day.idFacialEvent ?? `${day.idRecordEnvironment}:${learner.apprenticeId}`,
        idRecordEnvironment: day.idRecordEnvironment,
        userId: learner.learnerId,
        fichaId: matrix.idChip,
        environmentId: day.idEnvironment ?? '',
        userName: learner.learnerName,
        userDocument: learner.learnerDocument,
        userEmail: ficha.learners.find(item => item.id === learner.learnerId)?.email ?? '',
        fichaNumber: day.fichaNumber,
        programId: matrix.idProgram ?? ficha.programId,
        programName: day.programName,
        environmentName: day.environmentName,
        instructorName: day.instructorName,
        date: day.date,
        sessionStartTime: day.sessionStartTime ?? '',
        sessionEndTime: day.sessionEndTime ?? '',
        entryTime: day.entryTime,
        exitTime: day.exitTime ?? '',
        exitRegistered: day.exitRegistered,
        status: day.status,
        delayMinutes: day.delayMinutes,
        excuse: day.excuse,
      };
    }));
  });
}

type FetchMatrix = (params: { idChip: string; dateFrom: string; dateTo: string }) => Promise<AttendanceMatrixResponse>;

export function createAttendanceDataStore(fetchMatrix: FetchMatrix) {
  let snapshot = { key: '', records: [] as ResolvedAttendance[], loading: false, error: false };
  let generation = 0;
  let lastLoaded = 0;
  let pending: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  const keyFor = (owner: string, fichas: Ficha[]) => `${owner}|${fichas.map(f => f.id).sort().join(',')}`;

  function load(owner: string, fichas: Ficha[], force = false): Promise<void> {
    const key = keyFor(owner, fichas);
    if (!force && snapshot.key === key && pending) return pending;
    if (!force && snapshot.key === key && !snapshot.error && Date.now() - lastLoaded < 15000) return Promise.resolve();
    const request = ++generation;
    snapshot = { key, records: [], loading: !!owner && fichas.length > 0, error: false };
    emit();
    if (!owner || fichas.length === 0) { lastLoaded = Date.now(); pending = null; return Promise.resolve(); }
    const dateTo = new Date().toISOString().slice(0, 10);
    pending = Promise.all(fichas.map(ficha => fetchMatrix({ idChip: ficha.id, dateFrom: '1970-01-01', dateTo })))
      .then(matrices => {
        if (request === generation) {
          snapshot = { key, records: resolveAttendance(matrices, fichas), loading: false, error: false };
          lastLoaded = Date.now();
        }
      }).catch(() => {
        if (request === generation) snapshot = { key, records: [], loading: false, error: true };
      }).finally(() => { if (request === generation) { pending = null; emit(); } });
    return pending;
  }
  return {
    load, keyFor,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
