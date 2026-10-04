import axios from 'axios';

import { EMBEDDING_API_KEY, EMBEDDING_API_URL } from '@/shared/constants/api';

export interface FacialEmbeddingFromImagePayload {
  userId: string;
  imageBase64: string;
  photoReference?: string | null;
  replaceExisting?: boolean;
  createdBy?: string;
}

export interface FacialEmbeddingResponse {
  id: string;
  user_id: string;
  embedding: number[];
  embedding_dimension: number;
  model_name: string;
  photo_reference?: string | null;
  status: string;
  registered_at: string;
}

const facialEmbeddingApi = axios.create({
  baseURL: EMBEDDING_API_URL,
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': EMBEDDING_API_KEY,
  },
});

function formatApiDetail(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        const location = Array.isArray(item?.loc) ? item.loc.join('.') : 'body';
        return `${location}: ${item?.msg ?? 'Error de validación'}`;
      })
      .join('\n');
  }
  return null;
}

export function getFacialEmbeddingErrorMessage(error: any): string {
  const status = error?.response?.status;
  const detail = formatApiDetail(error?.response?.data?.detail);
  if (detail) return status ? `Error ${status}: ${detail}` : detail;
  if (error?.message) return error.message;
  return 'No fue posible registrar el embedding facial.';
}

export async function registerFacialEmbeddingFromImage(
  payload: FacialEmbeddingFromImagePayload,
): Promise<FacialEmbeddingResponse> {
  const response = await facialEmbeddingApi.post<FacialEmbeddingResponse>(
    '/api/v1/facial-embeddings/from-image',
    {
      user_id: payload.userId,
      image_base64: payload.imageBase64,
      photo_reference: payload.photoReference ?? null,
      replace_existing: payload.replaceExisting ?? false,
      created_by: payload.createdBy ?? 'mobile-app',
    },
  );

  return response.data;
}
