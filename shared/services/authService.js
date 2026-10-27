import { api } from './api';
import { removeToken, saveToken } from './tokenStorage';

// El backend (LoginRequestDTO) espera numberDocument + password.
// Respuesta (LoginResponseDTO): { token, role, permissions, userId }
export const login = async (numberDocument, password, privacyAccepted = false) => {
  const { data } = await api.post('/api/auth/login', {
    numberDocument,
    password,
    privacyAccepted,
  });
  await saveToken(data.token);
  return data;
};

export const getPrivacyAcceptanceStatus = async (numberDocument) => {
  const { data } = await api.post('/api/auth/privacy-acceptance-status', {
    numberDocument,
  });
  return data === true;
};

export const verifyCurrentPassword = async (password) => {
  const { data } = await api.post('/api/auth/verify-password', { password });
  return data === true;
};

// POST /api/auth/change-password — requiere sesión activa (JWT)
export const changePassword = async (newPassword, confirmPassword) => {
  const { data } = await api.post('/api/auth/change-password', {
    newPassword,
    confirmPassword,
  });
  return data; // { message }
};

export const getMyProfile = async () => {
  const { data } = await api.get('/api/profile/me');
  return data; // { idUser, firstName, lastName, documentType, documentNumber, email }
};

export const logout = async () => {
  try { await api.post('/api/auth/logout'); }
  catch (error) { if (error.response?.status !== 401) throw error; }
  await removeToken();
};
