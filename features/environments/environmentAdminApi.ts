import { api } from '@/shared/services/api';

export interface ManagedEnvironment {
  idEnvironment: string;
  environmentName: string;
  capacity: number | null;
  state: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string | null;
}

export interface EnvironmentInput {
  environmentName: string;
  capacity: number | null;
}

export async function listManagedEnvironments(search = '') {
  const { data } = await api.get<ManagedEnvironment[]>('/api/admin/environments', {
    params: search.trim() ? { search: search.trim() } : {},
  });
  return data;
}

export async function getManagedEnvironment(id: string) {
  const { data } = await api.get<ManagedEnvironment>(`/api/admin/environments/${id}`);
  return data;
}

export async function createManagedEnvironment(input: EnvironmentInput) {
  const { data } = await api.post<ManagedEnvironment>('/api/admin/environments', input);
  return data;
}

export async function updateManagedEnvironment(id: string, input: EnvironmentInput) {
  const { data } = await api.put<ManagedEnvironment>(`/api/admin/environments/${id}`, input);
  return data;
}

export async function setManagedEnvironmentState(id: string, state: ManagedEnvironment['state']) {
  const { data } = await api.patch<ManagedEnvironment>(`/api/admin/environments/${id}/state`, { state });
  return data;
}
