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
  imageFrames?: string[];
  livenessChallenge?: string;
  livenessChallenges?: string[];
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
  excuse?: boolean | null;
}

export interface AttendanceMatrixSession {
  idRecordEnvironment: string;
  date: string;
  environmentName: string;
  instructorName: string;
}

export interface AttendanceMatrixDay {
  idFacialEvent?: string | null;
  idRecordEnvironment: string;
  date: string;
  status: 'punctual' | 'late' | 'absent';
  entryTime: string;
  delayMinutes: number;
  environmentName: string;
  instructorName: string;
  fichaNumber: string;
  programName: string;
  exitRegistered: boolean;
  excuse?: boolean | null;
}

export interface AttendanceMatrixLearner {
  learnerId: string;
  apprenticeId: string;
  learnerName: string;
  learnerDocument: string;
  days: AttendanceMatrixDay[];
}

export interface AttendanceMatrixResponse {
  idChip: string;
  chipCode?: string | null;
  idProgram?: string | null;
  programName?: string | null;
  sessions: AttendanceMatrixSession[];
  learners: AttendanceMatrixLearner[];
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
    imageFrames: payload.imageFrames ?? [payload.imageBase64],
    livenessChallenge: payload.livenessChallenge,
    livenessChallenges: payload.livenessChallenges ?? [],
    origin: payload.origin,
  });

  return data;
}

export async function fetchAttendanceMatrix(params: {
  idChip: string;
  dateFrom: string;
  dateTo: string;
}): Promise<AttendanceMatrixResponse> {
  const { data } = await api.get<AttendanceMatrixResponse>('/api/facial/events/attendance-matrix', {
    params,
  });

  return data;
}

export async function updateFacialEventExcuse(payload: {
  idRecordEnvironment: string;
  idApprentice: string;
  excuse: boolean;
}): Promise<FacialEventResponse> {
  const { data } = await api.patch<FacialEventResponse>('/api/facial/events/excuse', payload);

  return data;
}
