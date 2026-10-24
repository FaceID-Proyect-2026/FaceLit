import { useSyncExternalStore } from 'react';
import { getFichasSnapshot, getProgramsSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { getSnapshot as getEnvironmentsSnapshot, subscribe as subscribeEnvironments } from '@/features/environments/environmentsStore';
import { ATTENDANCE_EVENTS, AttendanceEvent } from './types';

export interface ResolvedAttendance extends AttendanceEvent {
  userName: string;
  userDocument: string;
  userEmail: string;
  fichaId: string;
  fichaNumber: string;
  programId: string;
  programName: string;
  environmentName: string;
  instructorName: string;
}

/** Resolves an event only when every required cross-module relationship exists. */
export function resolveAttendance(events = ATTENDANCE_EVENTS): ResolvedAttendance[] {
  const fichas = getFichasSnapshot();
  const programs = getProgramsSnapshot();
  const environments = getEnvironmentsSnapshot();

  return events.flatMap(event => {
    const ficha = fichas.find(item => item.id === event.fichaId);
    const learner = ficha?.learners.find(item => item.id === event.userId);
    const program = ficha && programs.find(item => item.id === ficha.programId);
    const environment = environments.find(item => item.id === event.environmentId);

    if (!ficha || !learner || !program || !environment || Number.isNaN(Date.parse(event.date))) {
      return [];
    }

    return [{
      ...event,
      userName: `${learner.name} ${learner.lastname}`,
      userDocument: learner.document,
      userEmail: learner.email,
      fichaId: ficha.id,
      fichaNumber: ficha.number,
      programId: program.id,
      programName: program.name,
      environmentName: environment.code,
    }];
  });
}

export function useAttendance() {
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  useSyncExternalStore(subscribeEnvironments, getEnvironmentsSnapshot);
  return resolveAttendance();
}
