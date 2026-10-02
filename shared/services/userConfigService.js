import { api } from './api';

export const getUserConfiguration = async () => {
  const { data } = await api.get('/api/profile/configuration');
  return data;
};

export const createUserConfiguration = async (payload) => {
  const { data } = await api.post('/api/profile/configuration', payload);
  return data;
};

export const updateUserConfiguration = async (payload) => {
  const { data } = await api.put('/api/profile/configuration', payload);
  return data;
};