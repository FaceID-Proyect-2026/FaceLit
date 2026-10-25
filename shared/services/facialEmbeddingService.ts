import { api } from './api';

import { API_URL } from '@/shared/constants/api';

export interface FacialEmbeddingFromImagePayload {
  resetToken?: string | null;
  userId: string;
  imageBase64: string;
  imageFrames?: string[];
  livenessChallenge?: string;
  livenessChallenges?: string[];
  photoReference?: string | null;
  replaceExisting?: boolean;
  createdBy?: string;
}

export interface FacialLivenessCheckPayload {
  imageFrames: string[];
  livenessChallenge: string;
}

export interface FacialLivenessCheckResponse {
  live: boolean;
  reason: string;
}

export interface FacialEmbeddingResponse {
  id: string;
  user_id: string;
  embedding_dimension: number;
  model_name: string;
  photo_reference?: string | null;
  status: string;
  created_at: string;
}



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
  const backendMessage = error?.response?.data?.message;
  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }
  const detail = formatApiDetail(error?.response?.data?.detail);
  if (detail) return detail;
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return `No fue posible conectar con el backend (${API_URL}). Verifica tu conexión e intenta nuevamente.`;
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
  const response = await api.post<FacialEmbeddingResponse>(
    '/api/facial/embeddings/from-image',
    {
      image_base64: payload.imageBase64,
      image_frames: payload.imageFrames ?? [],
      liveness_challenge: payload.livenessChallenge ?? null,
      liveness_challenges: payload.livenessChallenges ?? [],
      photo_reference: payload.photoReference ?? null,
      replace_existing: payload.replaceExisting ?? false,
      reset_token: payload.resetToken ?? null,
    },
    { timeout: 180000 },
  );

  return response.data;
}

export async function validateFacialLiveness(
  payload: FacialLivenessCheckPayload,
): Promise<FacialLivenessCheckResponse> {
  const response = await api.post<FacialLivenessCheckResponse>(
    '/api/facial/embeddings/liveness-check',
    {
      image_frames: payload.imageFrames,
      liveness_challenge: payload.livenessChallenge,
    },
    { timeout: 180000 },
  );

  return response.data;
}
