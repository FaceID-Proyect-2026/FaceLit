import { api } from './api';

export const requestConsent = async (payload) => {
  // payload = { id_user, fullName, identityDocument, emailGuardian }
  const { data } = await api.post('/api/consent/request', payload);
  return data; // { message, status: 'PENDING', idConsent }
};

export const resendConsent = async (idUser) => {
  const { data } = await api.post('/api/consent/resend', { id_user: idUser });
  return data;
};

export const confirmConsent = async (idUser, code) => {
  const { data } = await api.post('/api/consent/confirm', {
    id_user: idUser,
    code,
  });
  return data; // { message, status: 'ACCEPTED' | 'EXPIRED' }
};

export const refuseConsent = async (idUser, code) => {
  const { data } = await api.post('/api/consent/refuse', {
    id_user: idUser,
    code,
  });
  return data; // { message, status: 'REFUSED' | 'EXPIRED' }
};