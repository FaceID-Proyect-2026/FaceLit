import { api } from './api';

export interface FacialEnrollmentStatus {
  registered: boolean;
  registrationDate?: string | null;
  padAvailable?: boolean;
}

export async function fetchMyFacialEnrollmentStatus(): Promise<FacialEnrollmentStatus> {
  const { data } = await api.get<FacialEnrollmentStatus>('/api/facial/registration-status');
  if (data.registered) await confirmMyFacialRegistration();
  return data;
}

export async function confirmMyFacialRegistration(): Promise<void> {
  // A delivery failure must not report a successfully saved embedding as failed.
  // This idempotent confirmation is retried when registration status is refreshed.
  try { await api.post('/api/facial/registration-confirmation'); }
  catch (error) { console.warn('[FacialRegistration] Confirmation pending', error); }
}

export interface FacialResetState {
  requestId: string | null;
  status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  canReregister: boolean;
  expiresAt: string | null;
  authorizationToken: string | null;
}

export async function fetchMyFacialResetState(): Promise<FacialResetState> {
  return (await api.get<FacialResetState>('/api/facial/reset-requests/me')).data;
}

export async function requestMyFacialReset(): Promise<FacialResetState> {
  return (await api.post<FacialResetState>('/api/facial/reset-requests')).data;
}
