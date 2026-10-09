import { api } from './api';

export interface FacialEnrollmentStatus {
  registered: boolean;
  registrationDate?: string | null;
  padAvailable?: boolean;
}

export async function fetchMyFacialEnrollmentStatus(): Promise<FacialEnrollmentStatus> {
  const { data } = await api.get<FacialEnrollmentStatus>('/api/facial/registration-status');
  return data;
}
