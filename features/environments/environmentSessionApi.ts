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
  createdAt?: string;
  updatedAt?: string;
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
  entryTime: string;
  registrationMinutes: number;
  exitTime: string;
  shutdownTime: string;
  active: boolean;
}

export async function searchSessionEnvironments(search: string) {
  const { data } = await api.get<EnvironmentOption[]>('/api/environment/environments', {
    params: { search },
  });
  return data;
}

export async function getOrCreateSessionEnvironment(environmentName: string, capacity?: number) {
  const { data } = await api.post<EnvironmentOption>('/api/environment/environments', {
    environmentName,
    ...(capacity === undefined ? {} : { capacity }),
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
  entryTime: string;
  registrationMinutes: number;
  exitTime: string;
  shutdownTime: string;
}) {
  const { data } = await api.post<RecordEnvironmentResponse>('/api/environment/sessions', {
    ...payload,
    deviceCode: payload.deviceCode ?? await getDeviceCode(),
  });
  return data;
}

export async function fetchCurrentActiveEnvironmentSession() {
  // Esta consulta debe reflejar inmediatamente una sesión creada desde otro
  // navegador. El parámetro evita reutilizar una respuesta GET cacheada.
  const { data, status } = await api.get<RecordEnvironmentResponse | null>('/api/environment/sessions/active', {
    params: { _ts: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  });
  return status === 204 || !data ? null : data;
}

export async function verifyEnvironmentSessionExitPassword(
  idRecordEnvironment: string,
  password: string,
  credentialOwner: 'RESPONSIBLE' | 'REPLACEMENT' = 'RESPONSIBLE',
) {
  const { data } = await api.post<boolean>(
    `/api/environment/sessions/${idRecordEnvironment}/verify-exit-password`,
    { password },
    { params: { credentialOwner } },
  );
  return data;
}
