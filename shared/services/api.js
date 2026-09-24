import axios from 'axios';
import { API_URL } from '../constants/api';
import { getToken, removeToken } from './tokenStorage';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, // importa más tiempo para operaciones de importación/validación de archivos pesados
  headers: { 'Content-Type': 'application/json' },
});

if (__DEV__) {
  console.info('[API] Base URL:', API_URL);
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Si el body es FormData, dejar que axios genere el Content-Type
  // con el boundary correcto — nunca forzar application/json en multipart.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No limpiar el token cuando el 401 viene del propio /login (credenciales
    // incorrectas): ahí nunca hubo sesión que invalidar.
    const isLoginRequest = error.config?.url?.includes('/api/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      console.warn('Token inválido o expirado — cerrando sesión local');
      removeToken();
      // Nota: esto solo limpia el storage. Para reflejar el logout en la UI
      // de inmediato (sin esperar a un reinicio de la app), AuthContext
      // debería exponer un "forceLogout" que este interceptor pueda llamar.
    }
    return Promise.reject(error);
  }
);
