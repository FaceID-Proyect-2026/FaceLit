import { useSyncExternalStore } from 'react';
import { getFichasSnapshot, getProgramsSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { getSnapshot as getEnvironmentsSnapshot, subscribe as subscribeEnvironments } from '@/features/environments/environmentsStore';
import { getSchedulesSnapshot, subscribe as subscribeSchedules } from '@/features/schedules/schedulesStore';
import { ATTENDANCE_EVENTS, AttendanceEvent } from './types';

export interface ResolvedAttendance extends AttendanceEvent {
  userName: string;
  userDocument: string;
  userEmail: string;
  fichaNumber: string;
  programId: string;
  programName: string;
  environmentName: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  instructorName: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function matchesScheduleDay(date: string, day: string) {
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && DAYS[parsed.getUTCDay()] === day;
}

/** Resolves an event only when every required cross-module relationship exists. */
export function resolveAttendance(events = ATTENDANCE_EVENTS): ResolvedAttendance[] {
  const fichas = getFichasSnapshot();
  const programs = getProgramsSnapshot();
  const schedules = getSchedulesSnapshot();
  const environments = getEnvironmentsSnapshot();

  return events.flatMap(event => {
    const schedule = schedules.find(item => item.id === event.scheduleId);
    const ficha = schedule && fichas.find(item => item.id === schedule.fichaId);
    const learner = ficha?.learners.find(item => item.id === event.userId);
    const program = ficha && programs.find(item => item.id === ficha.programId);
    const environment = schedule && environments.find(item => item.id === schedule.environmentId);

    if (!schedule || !ficha || !learner || !program || !environment || !matchesScheduleDay(event.date, schedule.day)) {
      return [];
    }

    return [{
      ...event,
      userName: `${learner.name} ${learner.lastname}`,
      userDocument: learner.document,
      userEmail: learner.email,
      fichaNumber: ficha.number,
      programId: program.id,
      programName: program.name,
      environmentName: environment.code,
      scheduleStartTime: schedule.startTime,
      scheduleEndTime: schedule.endTime,
      instructorName: schedule.instructorName,
    }];
  });
}

export function useAttendance() {
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  useSyncExternalStore(subscribeSchedules, getSchedulesSnapshot);
  useSyncExternalStore(subscribeEnvironments, getEnvironmentsSnapshot);
  return resolveAttendance();
}
