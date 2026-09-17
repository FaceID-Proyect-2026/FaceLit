import { api } from './api';

export const getManagedUsers = async (search = '') => {
  const endpoint = search.trim() ? '/api/admin/users/search' : '/api/admin/users';
  const config = search.trim() ? { params: { query: search.trim() } } : undefined;
  const { data } = await api.get(endpoint, config);
  return Array.isArray(data) ? data : data?.data ?? data?.users ?? [];
};

export const getManagedUser = async (id) => {
  const { data } = await api.get(`/api/admin/users/${id}`);
  return data;
};

export const updateManagedUser = async (id, payload) => {
  const { data } = await api.put(`/api/admin/users/${id}`, payload);
  return data;
};

export const deleteManagedUser = async (id) => {
  const { data } = await api.delete(`/api/admin/users/${id}`);
  return data;
};

// PUT /api/admin/users/{userId}/role — solo ADMINISTRATOR
// role: string con el nombre del rol destino (ej. 'INSTRUCTOR')
export const assignRole = async (userId, role) => {
  const { data } = await api.put(`/api/admin/users/${userId}/role`, { role });
  return data;
};
