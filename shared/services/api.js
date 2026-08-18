import axios from 'axios';
import { API_URL } from '../constants/api';
import { getToken } from './tokenStorage';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Token inválido o expirado — redirigir a login');
    }
    return Promise.reject(error);
  }
);