import { api } from '@/shared/services/api';

export interface EnvironmentOption {
  idEnvironment: string;
  environmentName: string;
  capacity?: number;
  state?: string;
}

export interface SessionInstructor {
  idInstructor: string;
  firstName: string;
  lastName: string;
  instructorType: string;
  status: string;
}

export interface SessionChip {
  idChip: string;
  chipCode: string;
  programName: string;
  state: string;
}

export interface RecordEnvironmentResponse {
  idRecordEnvironment: string;
  idEnvironment: string;
  environmentName: string;
  idChip: string;
  chipCode: string;
  idInstructorInCharge: string;
  instructorName: string;
  sessionStart: string;
  registrationMinutes: number;
  exitTime?: string;
  shutdownTime?: string;
  active: boolean;
}

export async function searchSessionEnvironments(search: string) {
  const { data } = await api.get<EnvironmentOption[]>('/api/environment/environments', {
    params: { search },
  });
  return data;
}

export async function getOrCreateSessionEnvironment(environmentName: string) {
  const { data } = await api.post<EnvironmentOption>('/api/environment/environments', {
    environmentName,
  });
  return data;
}

export async function fetchSessionInstructors() {
  const { data } = await api.get<SessionInstructor[]>('/api/environment/instructors-for-session');
  return data;
}

export async function fetchChipsForSessionInstructor(idInstructor: string) {
  const { data } = await api.get<SessionChip[]>(`/api/environment/chips-for-instructor/${idInstructor}`);
  return data;
}

export async function createEnvironmentSession(payload: {
  idEnvironment: string;
  idInstructorInCharge: string;
  idChip: string;
  registrationMinutes: number;
  exitTime?: string;
  shutdownTime?: string;
}) {
  const { data } = await api.post<RecordEnvironmentResponse>('/api/environment/sessions', payload);
  return data;
}
