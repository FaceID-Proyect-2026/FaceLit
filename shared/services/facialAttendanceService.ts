import { api } from './api';

export interface FacialEventPayload {
  idRecordEnvironment: string;
  idDevice: string;
  idApprentice: string;
  eventDatetime?: string;
  recognitionResult: string;
  matchScore?: number | null;
  origin: 'PC' | 'MOBILE';
}

export interface FacialAttendanceCapturePayload {
  idRecordEnvironment: string;
  idDevice: string;
  imageBase64: string;
  origin: 'PC' | 'MOBILE';
}

export interface FacialEventResponse {
  idFacialEvent: string;
  idRecordEnvironment: string;
  idDevice: string;
  idApprentice: string;
  eventDatetime: string;
  eventType: 'ENTRY' | 'EXIT';
  recognitionResult: string;
  attendanceStatus: 'PUNCTUAL' | 'LATE' | 'ABSENT';
  matchScore?: number | null;
  origin: 'PC' | 'MOBILE';
}

export async function registerFacialAttendanceEvent(
  payload: FacialEventPayload,
): Promise<FacialEventResponse> {
  const { data } = await api.post<FacialEventResponse>('/api/facial/events', {
    idRecordEnvironment: payload.idRecordEnvironment,
    idDevice: payload.idDevice,
    idApprentice: payload.idApprentice,
    eventDatetime: payload.eventDatetime ?? new Date().toISOString(),
    recognitionResult: payload.recognitionResult,
    matchScore: payload.matchScore ?? null,
    origin: payload.origin,
  });

  return data;
}

export async function registerFacialAttendanceFromImage(
  payload: FacialAttendanceCapturePayload,
): Promise<FacialEventResponse> {
  const { data } = await api.post<FacialEventResponse>('/api/facial/events/from-image', {
    idRecordEnvironment: payload.idRecordEnvironment,
    idDevice: payload.idDevice,
    imageBase64: payload.imageBase64,
    origin: payload.origin,
  });

  return data;
}
