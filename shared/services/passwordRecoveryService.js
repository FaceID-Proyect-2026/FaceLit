import { api } from './api';

export const requestRecovery = async (email) => {
  const { data } = await api.post('/api/auth/request-recovery', { email });
  return data; // { message: "Se envió un código..." }
};

export const resetPassword = async (token, newPassword, confirmPassword) => {
  const { data } = await api.post('/api/auth/reset-password', {
    token,
    newPassword,
    confirmPassword,
  });
  return data; // { message: "Contraseña restablecida correctamente" }
};