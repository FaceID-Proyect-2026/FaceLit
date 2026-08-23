import { api } from './api';

export const getDocumentTypes = async () => {
  const { data } = await api.get('/api/catalogos/document-types');
  return Array.isArray(data) ? data : data?.data ?? data?.documentTypes ?? [];
};