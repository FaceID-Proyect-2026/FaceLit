import axios from 'axios';

import { EMBEDDING_API_KEY, EMBEDDING_API_URL } from '@/shared/constants/api';

export interface FacialEmbeddingFromImagePayload {
  userId: string;
  imageBase64: string;
  imageFrames?: string[];
  livenessChallenge?: string;
  photoReference?: string | null;
  replaceExisting?: boolean;
  createdBy?: string;
}

export interface FacialEmbeddingUpdateFromImagePayload {
  userId: string;
  imageBase64: string;
  photoReference?: string | null;
  updatedBy?: string;
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

export interface FacialSessionVerificationPayload {
  recordEnvironmentId: string;
  imageBase64: string;
  threshold?: number;
}

export interface FacialSessionVerificationResponse {
  match: boolean;
  id_apprentice?: string | null;
  similarity?: number | null;
  threshold: number;
  model_name: string;
  reason: string;
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
  const backendMessage = error?.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }
  const detail = formatApiDetail(error?.response?.data?.detail);
  if (detail) return detail;
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `No fue posible conectar con el servicio facial (${EMBEDDING_API_URL}). Verifica que el microservicio de embeddings esté encendido y que el puerto 8090 sea accesible.`;
  }
  if (error?.code === 'ECONNABORTED') {
    return 'El registro facial tardó demasiado. Intenta nuevamente con buena conexión y el servicio facial encendido.';
  }
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
      image_frames: payload.imageFrames ?? [],
      liveness_challenge: payload.livenessChallenge ?? null,
      photo_reference: payload.photoReference ?? null,
      replace_existing: payload.replaceExisting ?? false,
      created_by: payload.createdBy ?? 'mobile-app',
    },
  );

  return response.data;
}

export async function updateFacialEmbeddingFromImage(
  payload: FacialEmbeddingUpdateFromImagePayload,
): Promise<FacialEmbeddingResponse> {
  const response = await facialEmbeddingApi.patch<FacialEmbeddingResponse>(
    `/api/v1/facial-embeddings/users/${payload.userId}`,
    {
      image_base64: payload.imageBase64,
      photo_reference: payload.photoReference ?? null,
      updated_by: payload.updatedBy ?? 'mobile-app',
    },
  );

  return response.data;
}

export async function verifyFacialSessionFromImage(
  payload: FacialSessionVerificationPayload,
): Promise<FacialSessionVerificationResponse> {
  const response = await facialEmbeddingApi.post<FacialSessionVerificationResponse>(
    '/api/v1/facial-embeddings/verify-session',
    {
      record_environment_id: payload.recordEnvironmentId,
      image_base64: payload.imageBase64,
      threshold: payload.threshold,
    },
  );

  return response.data;
}
