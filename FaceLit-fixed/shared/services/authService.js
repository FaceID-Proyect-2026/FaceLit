import { api } from './api';
import { removeToken, saveToken } from './tokenStorage';

export const login = async (email, password) => {
  const { data } = await api.post('/api/auth/login', {
    email,
    password,
    aceptoPoliticas: true,
  });
  // data = { token, role, permissions, userId, message }
  await saveToken(data.token);
  return data;
};

export const registerUser = async (payload) => {
  const { data } = await api.post('/api/auth/register', payload);
  return data; // { message, status, requiresConsent, id_user }
};

export const verifyEmail = async (idUser, code) => {
  const { data } = await api.post('/api/auth/verify-email', {
    id_user: idUser,
    code,
  });
  return data; // { message, status: 'EMAIL_VERIFIED' | 'MINOR_AGE_REDIRECT', minor }
};

export const resendCode = async (idUser) => {
  const { data } = await api.post(`/api/auth/resend-code?id_user=${idUser}`);
  return data; // { message }
};

export const getRegistrationStatus = async (document, email) => {
  const params = new URLSearchParams();
  if (document) params.append('document', document);
  if (email) params.append('email', email);
  const { data } = await api.get(`/api/auth/registration-status?${params.toString()}`);
  return data;
};

export const getMyProfile = async () => {
  const { data } = await api.get('/api/profile/me');
  return data; // { idUser, firstName, lastName, documentType, documentNumber, email }
};

export const logout = () => removeToken();

