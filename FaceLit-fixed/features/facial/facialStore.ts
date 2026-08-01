import { FacialEvent, FacialRecord, FacialUser, MOCK_FACIAL_RECORDS, VALID_FACIAL_ROLES } from './types';

type Listener = () => void;
type RegistrationResult = { success: true; record: FacialRecord } | { success: false; error: string };

let records: FacialRecord[] = MOCK_FACIAL_RECORDS;
let events: FacialEvent[] = [];
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(listener => listener());

export function subscribeFacial(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFacialRecordsSnapshot() { return records; }
export function getFacialEventsSnapshot() { return events; }

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
