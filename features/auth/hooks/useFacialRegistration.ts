import {
  LIVENESS_SEQUENCE_LENGTH, LIVENESS_FRAME_COUNT, LIVENESS_FRAME_DELAY_MS, LIVENESS_PREPARATION_MS,
  LIVENESS_CHALLENGES, buildLivenessSequence, replaceLivenessChallengeAtIndex,
  formatLivenessStep, buildChallengeFailureMessage, clampLivenessIndex,
} from '@/features/facial/livenessChallenges';
import type { LivenessChallenge } from '@/features/facial/livenessChallenges';
// ─────────────────────────────────────────────
//  features/auth/hooks/useFacialRegistration.ts
//  Lógica del registro facial separada de la
//  pantalla (clean code) — misma convención que
//  useLoginForm / useRegisterForm
//
//  Contiene: máquina de estados de la pantalla,
//  manejo de permisos de cámara, captura (nativa
//  y web), evaluación de calidad de imagen y la
//  navegación resultante.
// ─────────────────────────────────────────────
import { registerFacialCapture } from '@/features/facial/facialStore';
import { FacialUser } from '@/features/facial/types';
import { useAuth } from '@/shared/contexts/AuthContext';
import {
  getFacialEmbeddingErrorMessage,
  registerFacialEmbeddingFromImage,
  validateFacialLiveness,
} from '@/shared/services/facialEmbeddingService';
import { imageUriToDataUri } from '@/shared/utils/imageToBase64';
import { confirmMyFacialRegistration } from '@/shared/services/facialEnrollmentService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

export { LIVENESS_FRAME_COUNT, LIVENESS_CHALLENGES, buildLivenessSequence, replaceLivenessChallengeAtIndex } from '@/features/facial/livenessChallenges';
export type { LivenessChallenge } from '@/features/facial/livenessChallenges';

export type ScreenState = 'idle' | 'requesting' | 'confirmationRequired' | 'positioning' | 'ready' | 'captured';
export type CaptureQuality = 'checking' | 'good' | 'lowLight';

const POSITIONING_DELAY_MS  = 1500; // tiempo simulado de "acércate más"
export const MIN_BRIGHTNESS_SCORE = 60; // umbral de brillo (0–255)

const ALREADY_REGISTERED_ERROR = 'facial.validation.alreadyRegistered';
const DUPLICATE_FACE_ERROR_STATUS = 409;

// ── Helper de negocio: brillo promedio de una imagen (canvas web) ──
export function getAverageBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 255;

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let total = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    // Luminancia perceptual aproximada
    total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return total / pixelCount;
}

interface FacialRegistrationOptions {
  onRegistrationSaved?: () => void;
  resetToken?: string | null;
  targetUser?: FacialUser;
  replaceExisting?: boolean;
  createdBy?: string;
  allowLocalFallback?: boolean;
  requireResponsibilityConfirmation?: boolean;
}

function buildPhotoReference(photoUri: string, isWeb: boolean): string {
  if (photoUri.startsWith('data:')) {
    return `capture://${isWeb ? 'web' : 'native'}-facial-registration-${Date.now()}.jpg`;
  }
  return photoUri.length > 500 ? photoUri.slice(0, 500) : photoUri;
}

export function useFacialRegistration(options: FacialRegistrationOptions = {}) {
  const {
    onRegistrationSaved,
    resetToken,
    targetUser,
    replaceExisting = false,
    createdBy = 'mobile-app',
    allowLocalFallback = false,
    requireResponsibilityConfirmation = true,
  } = options;
  const { t } = useTranslation();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [screenState, setScreenState]                 = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri]                       = useState<string | null>(null);
  const [photoUris, setPhotoUris]                     = useState<string[]>([]);
  const [isTaking, setIsTaking]                       = useState(false);
  const [isRegistering, setIsRegistering]             = useState(false);
  const [isValidatingLiveness, setIsValidatingLiveness] = useState(false);
  const [quality, setQuality]                         = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle]         = useState('No se pudo registrar');
  const [errorModalMessage, setErrorModalMessage]     = useState<string | null>(null);
  const [errorRecoveryMode, setErrorRecoveryMode]     = useState<'challenge' | 'capture'>('challenge');
  const [livenessSequence, setLivenessSequence]       = useState<LivenessChallenge[]>(() => buildLivenessSequence());
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);
  const [livenessFrames, setLivenessFrames]           = useState<string[]>([]);

  const cameraRef        = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livenessGroupRef = useRef(0);
  const livenessValidationRef = useRef(false);
  const isWeb            = Platform.OS === 'web';
  const isPositioning    = screenState === 'positioning';
  const canFinish         = screenState === 'captured' && quality === 'good' && !isRegistering;
  const safeChallengeIndex = clampLivenessIndex(activeChallengeIndex);
  const livenessChallenge = livenessSequence[safeChallengeIndex] ?? livenessSequence[0] ?? LIVENESS_CHALLENGES[0];
  const livenessInstruction = screenState === 'captured'
    ? 'Dos retos correctos. Validando el registro…'
    : formatLivenessStep(livenessChallenge, safeChallengeIndex);

  const clearPositioningTimer = useCallback(() => {
    if (positioningTimer.current) {
      clearTimeout(positioningTimer.current);
      positioningTimer.current = null;
    }
  }, []);

  const randomizeLivenessChallenge = useCallback(() => {
    livenessGroupRef.current += 1;
    livenessValidationRef.current = false;
    setIsValidatingLiveness(false);
    setLivenessSequence((current) => buildLivenessSequence(current.map((challenge) => challenge.code)));
    setActiveChallengeIndex(0);
    setLivenessFrames([]);
  }, []);

  const resetFailedLivenessGroup = useCallback((failedChallengeIndex: number) => {
    clearPositioningTimer();
    livenessGroupRef.current += 1;
    livenessValidationRef.current = false;
    setIsValidatingLiveness(false);
    setScreenState('idle');
    setPhotoUri(null);
    setPhotoUris([]);
    setLivenessSequence((current) => replaceLivenessChallengeAtIndex(current, failedChallengeIndex));
    setQuality('checking');
  }, [clearPositioningTimer]);

  useEffect(() => {
    return () => {
      clearPositioningTimer();
      livenessGroupRef.current += 1;
    };
  }, [clearPositioningTimer]);

  // ── Iniciar simulación de "acércate más" → "posición correcta" ──
  const startPositioningSimulation = useCallback((resetSequence = true) => {
    clearPositioningTimer();
    if (resetSequence) randomizeLivenessChallenge();
    setScreenState('positioning');
    positioningTimer.current = setTimeout(() => {
      setScreenState('ready');
    }, POSITIONING_DELAY_MS);
  }, [clearPositioningTimer, randomizeLivenessChallenge]);

  const continuePositioningSimulation = useCallback(() => {
    clearPositioningTimer();
    setScreenState('positioning');
    positioningTimer.current = setTimeout(() => {
      setScreenState('ready');
    }, POSITIONING_DELAY_MS);
  }, [clearPositioningTimer]);

  // ── Abrir cámara — para en confirmationRequired antes de posicionar ──
  const handleOpenCamera = useCallback(async () => {
    if (isWeb) {
      if (requireResponsibilityConfirmation) {
        setScreenState('confirmationRequired');
      } else {
        startPositioningSimulation();
      }
      return;
    }

    if (permission?.granted) {
      if (requireResponsibilityConfirmation) {
        setScreenState('confirmationRequired');
      } else {
        startPositioningSimulation();
      }
      return;
    }

    if (permission?.canAskAgain === false) {
      alert(t('facialReg.permissionDenied'));
      return;
    }

    setScreenState('requesting');
    const result = await requestPermission();
    if (result.granted) {
      if (requireResponsibilityConfirmation) {
        setScreenState('confirmationRequired');
      } else {
        startPositioningSimulation();
      }
    } else {
      setScreenState('idle');
      alert(t('facialReg.permissionDenied'));
    }
  }, [isWeb, permission, requestPermission, requireResponsibilityConfirmation, startPositioningSimulation, t]);

  // ── Aceptar confirmación → inicia posicionamiento ──
  const handleConfirmCamera = useCallback(() => {
    startPositioningSimulation();
  }, [startPositioningSimulation]);

  // ── Cancelar desde la confirmación → vuelve a idle ──
  const handleCancelCamera = useCallback(() => {
    livenessGroupRef.current += 1;
    livenessValidationRef.current = false;
    setIsValidatingLiveness(false);
    setScreenState('idle');
    setPhotoUri(null);
    setPhotoUris([]);
    setLivenessFrames([]);
    setActiveChallengeIndex(0);
    setQuality('checking');
  }, []);

  // ── Evaluar calidad por brillo ────────────────
  const evaluateBrightness = useCallback((brightness: number) => {
    setQuality(brightness < MIN_BRIGHTNESS_SCORE ? 'lowLight' : 'good');
  }, []);

  const handleLivenessCapture = useCallback(async (frames: string[], brightness?: number) => {
    if (livenessValidationRef.current || activeChallengeIndex >= LIVENESS_SEQUENCE_LENGTH) return;
    livenessValidationRef.current = true;
    setIsValidatingLiveness(true);
    const groupId = livenessGroupRef.current;
    const preview = frames[frames.length - 1];
    if (!preview) {
      livenessValidationRef.current = false;
      setIsValidatingLiveness(false);
      return;
    }
    const challenge = livenessChallenge;
    try {
      const imageFrames = await Promise.all(frames.map((uri) => imageUriToDataUri(uri)));
      const result = await validateFacialLiveness({
        imageFrames,
        livenessChallenge: challenge.code,
      });
      if (groupId !== livenessGroupRef.current) return;
      if (!result.live) {
        resetFailedLivenessGroup(activeChallengeIndex);
        setErrorRecoveryMode('challenge');
        setErrorModalTitle('Acción no realizada');
        setErrorModalMessage(buildChallengeFailureMessage(challenge, result.reason));
        return;
      }
    } catch (error: any) {
      if (groupId !== livenessGroupRef.current) return;
      const message = getFacialEmbeddingErrorMessage(error);
      const normalized = message.toLowerCase();
      resetFailedLivenessGroup(activeChallengeIndex);
      setErrorRecoveryMode('challenge');
      setErrorModalTitle(normalized.includes('más de un rostro') || normalized.includes('mas de un rostro')
        ? 'Más de un rostro detectado'
        : 'No se pudo validar la acción');
      setErrorModalMessage(message);
      return;
    }

    if (groupId !== livenessGroupRef.current) return;
    const nextFrames = [...livenessFrames, ...frames];

    if (brightness !== undefined) {
      evaluateBrightness(brightness);
    } else {
      setQuality('good');
    }

    if (activeChallengeIndex < LIVENESS_SEQUENCE_LENGTH - 1) {
      setLivenessFrames(nextFrames);
      setActiveChallengeIndex((index) => index + 1);
      setPhotoUri(null);
      setPhotoUris([]);
      continuePositioningSimulation();
      livenessValidationRef.current = false;
      setIsValidatingLiveness(false);
      return;
    }

    setPhotoUri(preview);
    setPhotoUris(nextFrames);
    setLivenessFrames(nextFrames);
    setScreenState('captured');
    livenessValidationRef.current = false;
    setIsValidatingLiveness(false);
  }, [activeChallengeIndex, continuePositioningSimulation, evaluateBrightness, livenessChallenge, livenessFrames, resetFailedLivenessGroup]);

  // ── Captura nativa (expo-camera) ──────────────
  const handleTakePhotoNative = useCallback(async () => {
    if (!cameraRef.current || isTaking) return;
    const groupId = livenessGroupRef.current;
    setIsTaking(true);
    try {
      const captures: string[] = [];
      for (let index = 0; index < LIVENESS_FRAME_COUNT; index += 1) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: false });
        if (groupId !== livenessGroupRef.current) return;
        if (photo?.uri) captures.push(photo.uri);
        if (index < LIVENESS_FRAME_COUNT - 1) {
          await new Promise((resolve) => setTimeout(resolve, LIVENESS_FRAME_DELAY_MS));
        }
      }
      if (captures.length === LIVENESS_FRAME_COUNT) {
        await handleLivenessCapture(captures);
      }
    } catch {
      alert(t('facialReg.captureError'));
    } finally {
      setIsTaking(false);
    }
  }, [handleLivenessCapture, isTaking, t]);

  // ── Captura web (con análisis real de brillo) ─
  const handleWebCapture = useCallback((dataUri: string | string[], brightness: number) => {
    const frames = Array.isArray(dataUri) ? dataUri : [dataUri];
    handleLivenessCapture(frames, brightness);
  }, [handleLivenessCapture]);

  const handleWebShutter = useCallback(() => {
    setIsTaking(true);
    setTimeout(() => setIsTaking(false), 200);
  }, []);

  // ── Retomar ────────────────────────────────────
  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setPhotoUris([]);
    setLivenessFrames([]);
    setActiveChallengeIndex(0);
    setQuality('checking');
    startPositioningSimulation();
  }, [startPositioningSimulation]);

  // Reintenta únicamente el reto que falló. Los retos anteriores y sus
  // capturas permanecen intactos para no obligar al usuario a comenzar de 0.
  const handleRetryCurrentChallenge = useCallback(() => {
    setPhotoUri(null);
    setPhotoUris([]);
    setQuality('checking');
    startPositioningSimulation(false);
  }, [startPositioningSimulation]);

  // ── Finalizar ──────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (!photoUri) {
      setErrorRecoveryMode('capture');
      setErrorModalMessage(t('facial.validation.noFace'));
      return;
    }
    if (screenState !== 'captured' || quality !== 'good' || isRegistering) return;

    // Mapea los roles del backend (MAYÚSCULAS) al formato que espera el facialStore
    const ROLE_MAP: Record<string, string> = {
      ADMINISTRATOR: 'administrador',
      COORDINATOR:   'administrador', // coordinador tiene permisos equivalentes
      INSTRUCTOR:    'instructor',
      APPRENTICE:    'aprendiz',
    };

    const facialUser = targetUser ?? (user
      ? {
          id:   user.id,
          name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
          role: (ROLE_MAP[user.role] ?? 'aprendiz') as import('@/features/facial/types').FacialRole,
        }
      : undefined);

    if (!facialUser) {
      setErrorRecoveryMode('capture');
      setErrorModalMessage(t('facial.validation.userNotFound'));
      return;
    }

    setIsRegistering(true);
    try {
      const imageBase64 = await imageUriToDataUri(photoUri);
      const sourceFrames = photoUris.length >= LIVENESS_FRAME_COUNT ? photoUris : [photoUri];
      const imageFrames = await Promise.all(sourceFrames.map((uri) => imageUriToDataUri(uri)));
      await registerFacialEmbeddingFromImage({
        userId: facialUser.id,
        imageBase64,
        imageFrames,
        livenessChallenge: livenessChallenge.code,
        livenessChallenges: livenessSequence.map((challenge) => challenge.code),
        photoReference: buildPhotoReference(photoUri, isWeb),
        replaceExisting,
        resetToken,
        createdBy,
      });

      // The server has committed the embedding and consumed the single-use grant.
      onRegistrationSaved?.();
      if (!targetUser || targetUser.id === user?.id) await confirmMyFacialRegistration();

      const result = registerFacialCapture(facialUser, photoUri, true, replaceExisting);
      if (!result.success && result.error !== ALREADY_REGISTERED_ERROR) {
        setErrorModalMessage(t(result.error));
        return;
      }
      setSuccessModalVisible(true);
    } catch (error: any) {
      // Reiniciar la captura evita concatenar frames nuevos con los ya enviados.
      setErrorRecoveryMode('capture');
      const message = getFacialEmbeddingErrorMessage(error);
      console.warn('[FacialRegistration] Error registering embedding', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      // A duplicate face is a definitive server-side rejection. Never use
      // the local fallback here, otherwise the UI could show a saved record
      // even though the backend correctly refused to persist it.
      if (error?.response?.status === DUPLICATE_FACE_ERROR_STATUS) {
        setErrorModalTitle('Rostro ya registrado');
        setErrorModalMessage(message);
        return;
      }
      if (allowLocalFallback) {
        const result = registerFacialCapture(facialUser, photoUri, true, replaceExisting);
        if (!result.success && result.error !== ALREADY_REGISTERED_ERROR) {
          setErrorModalMessage(t(result.error));
          return;
        }
        setSuccessModalVisible(true);
        return;
      }
      setErrorModalMessage(message);
    } finally {
      setIsRegistering(false);
    }
  }, [screenState, photoUri, photoUris, quality, isRegistering, isWeb, t, user, targetUser, replaceExisting, resetToken, onRegistrationSaved, createdBy, allowLocalFallback, livenessChallenge.code, livenessSequence]);

  useEffect(() => {
    if (isWeb || screenState !== 'ready' || photoUri || isTaking || isRegistering || errorModalMessage || successModalVisible) {
      return;
    }
    const timer = setTimeout(() => {
      handleTakePhotoNative();
    }, LIVENESS_PREPARATION_MS);
    return () => clearTimeout(timer);
  }, [errorModalMessage, handleTakePhotoNative, isRegistering, isTaking, isWeb, photoUri, screenState, successModalVisible]);

  useEffect(() => {
    if (screenState !== 'captured' || quality !== 'good' || isRegistering || successModalVisible || errorModalMessage) {
      return;
    }
    handleFinish();
  }, [errorModalMessage, handleFinish, isRegistering, quality, screenState, successModalVisible]);

  // Al cerrar el modal se queda en el flujo actual; la pantalla decide qué mostrar después.
  const handleCloseSuccessModal = useCallback(() => {
    setSuccessModalVisible(false);
  }, []);

  const handleCloseErrorModal = useCallback(() => {
    setErrorModalMessage(null);
    setErrorModalTitle('No se pudo registrar');
    if (errorRecoveryMode === 'capture') {
      handleRetake();
      return;
    }
    handleRetryCurrentChallenge();
  }, [errorRecoveryMode, handleRetake, handleRetryCurrentChallenge]);

  return {
    // estado
    screenState,
    photoUri,
    isTaking,
    isRegistering,
    isValidatingLiveness,
    quality,
    successModalVisible,
    errorModalVisible: Boolean(errorModalMessage),
    errorModalTitle,
    errorModalMessage,
    isWeb,
    isPositioning,
    canFinish,
    livenessChallenge,
    livenessInstruction,
    livenessSequence,
    activeChallengeIndex,
    cameraRef,

    // acciones
    handleOpenCamera,
    handleConfirmCamera,
    handleCancelCamera,
    handleTakePhotoNative,
    handleWebCapture,
    handleWebShutter,
    randomizeLivenessChallenge,
    handleRetake,
    handleFinish,
    handleCloseSuccessModal,
    handleCloseErrorModal,
  };
}
