import { api } from './api';

const USERS_CACHE_TTL_MS = 60_000;
const usersCache = new Map();

const cacheKey = (search = '') => search.trim().toLowerCase();

const clearUsersCache = () => {
  usersCache.clear();
};

const prependCachedUser = (user) => {
  if (!user?.userId) return;

  for (const [key, cached] of usersCache.entries()) {
    if (key && !`${user.firstName ?? ''} ${user.lastName ?? ''} ${user.documentNumber ?? ''} ${user.email ?? ''}`.toLowerCase().includes(key)) {
      continue;
    }

    usersCache.set(key, {
      ...cached,
      data: [user, ...cached.data.filter((item) => item.userId !== user.userId)],
      timestamp: Date.now(),
    });
  }
};

export const getManagedUsers = async (search = '', options = {}) => {
  const key = cacheKey(search);
  const cached = usersCache.get(key);

  if (!options.force && cached && Date.now() - cached.timestamp < USERS_CACHE_TTL_MS) {
    return cached.data;
  }

  const endpoint = key ? '/api/admin/users/search' : '/api/admin/users';
  const config = key ? { params: { query: search.trim() } } : undefined;
  const { data } = await api.get(endpoint, config);
  const users = Array.isArray(data) ? data : data?.data ?? data?.users ?? [];
  usersCache.set(key, { data: users, timestamp: Date.now() });
  return users;
};

export const getManagedUsersCount = async () => {
  const { data } = await api.get('/api/admin/users/count');
  return Number(data?.total ?? 0);
};

export const getManagedUser = async (id) => {
  const { data } = await api.get(`/api/admin/users/${id}`);
  return data;
};

export const createManagedUser = async (payload) => {
  const { data } = await api.post('/api/admin/users', payload);
  prependCachedUser(data);
  return data;
};

export const updateManagedUser = async (id, payload) => {
  const { data } = await api.put(`/api/admin/users/${id}`, payload);
  clearUsersCache();
  return data;
};

export const deleteManagedUser = async (id) => {
  const { data } = await api.delete(`/api/admin/users/${id}`);
  clearUsersCache();
  return data;
};

// PUT /api/admin/users/{userId}/role — solo ADMINISTRATOR
// role: string con el nombre del rol destino (ej. 'INSTRUCTOR')
export const assignRole = async (userId, role) => {
  const { data } = await api.put(`/api/admin/users/${userId}/role`, { role });
  clearUsersCache();
  return data;
};
