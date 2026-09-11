import {
  DEFAULT_FACIAL_SETTINGS,
  FACIAL_REGISTRATION_MINUTES_OPTIONS,
  FacialEvent,
  FacialRecognitionSettings,
  FacialRecord,
  FacialSessionConfig,
  FacialUser,
  MOCK_FACIAL_RECORDS,
  VALID_FACIAL_ROLES,
} from './types';

type Listener = () => void;
type RegistrationResult = { success: true; record: FacialRecord } | { success: false; error: string };
type ConfigResult = { success: true; config: FacialSessionConfig } | { success: false; error: string };
type SettingsResult = { success: true; settings: FacialRecognitionSettings } | { success: false; error: string };

let records: FacialRecord[] = MOCK_FACIAL_RECORDS;
let events: FacialEvent[] = [];
let sessionConfig: FacialSessionConfig | null = null;
let recognitionSettings: FacialRecognitionSettings = DEFAULT_FACIAL_SETTINGS;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(listener => listener());

export function subscribeFacial(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFacialRecordsSnapshot() { return records; }
export function getFacialEventsSnapshot() { return events; }
export function getFacialConfigSnapshot() { return sessionConfig; }
export function getFacialSettingsSnapshot() { return recognitionSettings; }

// Guarda los ajustes operativos de la jornada de reconocimiento facial:
// tiempo de registro, hora de salida y hora de apagado del punto.
export function saveFacialRecognitionSettings(data: FacialRecognitionSettings): SettingsResult {
  if (!FACIAL_REGISTRATION_MINUTES_OPTIONS.includes(data.registrationMinutes)) {
    return { success: false, error: 'facial.settings.validation.registrationMinutesRequired' };
  }
  if (!data.exitTime) {
    return { success: false, error: 'facial.settings.validation.exitTimeRequired' };
  }
  if (!data.shutdownTime) {
    return { success: false, error: 'facial.settings.validation.shutdownTimeRequired' };
  }
  if (data.shutdownTime <= data.exitTime) {
    return { success: false, error: 'facial.settings.validation.shutdownAfterExit' };
  }

  recognitionSettings = { ...data };
  emit();
  return { success: true, settings: recognitionSettings };
}

// Guarda (o actualiza) la configuración de la sesión de reconocimiento
// facial: ambiente, instructor y ficha esperados. RF del módulo 5.
export function saveFacialSessionConfig(data: Omit<FacialSessionConfig, 'id' | 'updatedAt'>): ConfigResult {
  if (!data.environmentId) return { success: false, error: 'facial.setup.validation.environmentRequired' };
  if (!data.instructorId) return { success: false, error: 'facial.setup.validation.instructorRequired' };
  if (!data.fichaId) return { success: false, error: 'facial.setup.validation.fichaRequired' };

  sessionConfig = {
    id: sessionConfig?.id ?? `facial-config-${Date.now()}`,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  emit();
  return { success: true, config: sessionConfig };
}

export function registerFacialCapture(user: FacialUser | undefined, captureUri: string | null, trainingSucceeded = true): RegistrationResult {
  if (!user) return { success: false, error: 'facial.validation.userNotFound' };
  if (!VALID_FACIAL_ROLES.includes(user.role)) return { success: false, error: 'facial.validation.invalidRole' };
  if (!captureUri) return { success: false, error: 'facial.validation.noFace' };
  if (!trainingSucceeded) return { success: false, error: 'facial.validation.trainingFailed' };
  if (records.some(record => record.userId === user.id && record.status === 'registered')) {
    return { success: false, error: 'facial.validation.alreadyRegistered' };
  }

  const record: FacialRecord = {
    id: `face-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    status: 'registered',
    date: new Date().toISOString().slice(0, 10),
    captureUri,
  };
  records = [...records.filter(item => item.userId !== user.id), record];
  emit();
  return { success: true, record };
}

export function registerFacialEvent(event: Omit<FacialEvent, 'id' | 'occurredAt'> & { occurredAt?: string }) {
  const facialEvent: FacialEvent = { id: `event-${Date.now()}`, ...event, occurredAt: event.occurredAt ?? new Date().toISOString() };
  events = [...events, facialEvent];
  emit();
  return facialEvent;
}
