import { api } from '@/shared/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FACELIT_DEVICE_CODE_KEY = 'facelit_device_code';

function createDeviceCode() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
}

async function getDeviceCode() {
  const stored = await AsyncStorage.getItem(FACELIT_DEVICE_CODE_KEY);
  if (stored) return stored;

  const deviceCode = createDeviceCode();
  await AsyncStorage.setItem(FACELIT_DEVICE_CODE_KEY, deviceCode);
  return deviceCode;
}

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
  idDevice: string;
  deviceCode: string;
  idChip: string;
  chipCode: string;
  idInstructorScheduled: string;
  instructorScheduledName: string;
  idInstructorInCharge?: string | null;
  instructorInChargeName?: string | null;
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
  deviceCode?: string;
  idInstructorInCharge: string;
  idChip: string;
  registrationMinutes: number;
  exitTime?: string;
  shutdownTime?: string;
}) {
  const { data } = await api.post<RecordEnvironmentResponse>('/api/environment/sessions', {
    ...payload,
    deviceCode: payload.deviceCode ?? await getDeviceCode(),
  });
  return data;
}
