import {
  MIN_BRIGHTNESS_SCORE,
  ScreenState,
  CaptureQuality,
  LIVENESS_FRAME_COUNT,
  LIVENESS_CHALLENGES,
  LivenessChallenge,
  buildLivenessSequence,
} from '@/features/auth/hooks/useFacialRegistration';
import { FacialSession } from '@/features/facial/types';
import { registerFacialAttendanceFromImage } from '@/shared/services/facialAttendanceService';
import { getFacialEmbeddingErrorMessage, validateFacialLiveness } from '@/shared/services/facialEmbeddingService';
import { imageUriToDataUri } from '@/shared/utils/imageToBase64';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

const POSITIONING_DELAY_MS = 1500;
const LIVENESS_SEQUENCE_LENGTH = 3;
const LIVENESS_START_DELAY_MS = 650;
const LIVENESS_FRAME_DELAY_MS = 380;

function formatLivenessStep(challenge: LivenessChallenge, index: number): string {
  return `Paso ${index + 1}/${LIVENESS_SEQUENCE_LENGTH}: ${challenge.label}`;
}

function buildChallengeFailureMessage(challenge: LivenessChallenge, reason?: string): string {
  const detail = reason && reason !== 'LIVE_OK' ? `\n\nDetalle: ${reason}` : '';
  return `No se completó la acción solicitada: ${challenge.label}.${detail}`;
}

function clampLivenessIndex(index: number): number {
  return Math.min(Math.max(index, 0), LIVENESS_SEQUENCE_LENGTH - 1);
}

interface UseSessionAttendanceCaptureOptions {
  session?: FacialSession;
}

export function useSessionAttendanceCapture({ session }: UseSessionAttendanceCaptureOptions) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isTaking, setIsTaking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isValidatingLiveness, setIsValidatingLiveness] = useState(false);
  const [quality, setQuality] = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalTitle, setErrorModalTitle] = useState('No se pudo registrar');
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [livenessSequence, setLivenessSequence] = useState<LivenessChallenge[]>(() => buildLivenessSequence());
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);
  const [livenessFrames, setLivenessFrames] = useState<string[]>([]);

  const cameraRef = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const livenessGroupRef = useRef(0);
  const livenessValidationRef = useRef(false);
  const isWeb = Platform.OS === 'web';
  const isPositioning = screenState === 'positioning';
  const canFinish = screenState === 'captured' && quality === 'good' && !isRegistering;
  const safeChallengeIndex = clampLivenessIndex(activeChallengeIndex);
  const livenessChallenge = livenessSequence[safeChallengeIndex] ?? livenessSequence[0] ?? LIVENESS_CHALLENGES[0];
  const livenessInstruction = formatLivenessStep(livenessChallenge, safeChallengeIndex);

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

  const resetFailedLivenessGroup = useCallback(() => {
    clearPositioningTimer();
    livenessGroupRef.current += 1;
    livenessValidationRef.current = false;
    setIsValidatingLiveness(false);
    setScreenState('idle');
    setPhotoUri(null);
    setPhotoUris([]);
    setLivenessFrames([]);
    setActiveChallengeIndex(0);
    setLivenessSequence((current) => buildLivenessSequence(current.map((challenge) => challenge.code)));
    setQuality('checking');
  }, [clearPositioningTimer]);

  useEffect(() => {
    return () => {
      clearPositioningTimer();
    };
  }, [clearPositioningTimer]);

  const startPositioningSimulation = useCallback(() => {
    clearPositioningTimer();
    randomizeLivenessChallenge();
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

  const handleOpenCamera = useCallback(async () => {
    if (isWeb) {
      startPositioningSimulation();
      return;
    }

    if (permission?.granted) {
      startPositioningSimulation();
      return;
    }

    if (permission?.canAskAgain === false) {
      alert(t('facialReg.permissionDenied'));
      return;
    }

    setScreenState('requesting');
    const result = await requestPermission();
    if (result.granted) {
      startPositioningSimulation();
    } else {
      setScreenState('idle');
      alert(t('facialReg.permissionDenied'));
    }
  }, [isWeb, permission, requestPermission, startPositioningSimulation, t]);

  const handleConfirmCamera = useCallback(() => {
    startPositioningSimulation();
  }, [startPositioningSimulation]);

  const handleCancelCamera = useCallback(() => {
    setScreenState('idle');
    setPhotoUri(null);
    setPhotoUris([]);
    setLivenessFrames([]);
    setActiveChallengeIndex(0);
    setQuality('checking');
  }, []);

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
    const imageFrames = await Promise.all(frames.map((uri) => imageUriToDataUri(uri)));

    try {
      const result = await validateFacialLiveness({
        imageFrames,
        livenessChallenge: challenge.code,
      });
      if (groupId !== livenessGroupRef.current) return;
      if (!result.live) {
        resetFailedLivenessGroup();
        setErrorModalTitle('Acción no realizada');
        setErrorModalMessage(buildChallengeFailureMessage(challenge, result.reason));
        return;
      }
    } catch (error: any) {
      if (groupId !== livenessGroupRef.current) return;
      const message = getFacialEmbeddingErrorMessage(error);
      const normalized = message.toLowerCase();
      resetFailedLivenessGroup();
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

  const handleTakePhotoNative = useCallback(async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const captures: string[] = [];
      await new Promise((resolve) => setTimeout(resolve, LIVENESS_START_DELAY_MS));
      for (let index = 0; index < LIVENESS_FRAME_COUNT; index += 1) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo?.uri) captures.push(photo.uri);
        if (index < LIVENESS_FRAME_COUNT - 1) {
          await new Promise((resolve) => setTimeout(resolve, LIVENESS_FRAME_DELAY_MS));
        }
      }
      if (captures.length === LIVENESS_FRAME_COUNT) {
        handleLivenessCapture(captures);
      }
    } catch {
      alert(t('facialReg.captureError'));
    } finally {
      setIsTaking(false);
    }
  }, [handleLivenessCapture, isTaking, t]);

  const handleWebCapture = useCallback((dataUri: string | string[], brightness: number) => {
    const frames = Array.isArray(dataUri) ? dataUri : [dataUri];
    handleLivenessCapture(frames, brightness);
  }, [handleLivenessCapture]);

  const handleWebShutter = useCallback(() => {
    setIsTaking(true);
    setTimeout(() => setIsTaking(false), 200);
  }, []);

  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setPhotoUris([]);
    setLivenessFrames([]);
    setActiveChallengeIndex(0);
    setQuality('checking');
    startPositioningSimulation();
  }, [startPositioningSimulation]);

  const handleFinish = useCallback(async () => {
    if (!session) {
      setErrorModalMessage('No hay una sesión activa para registrar asistencia.');
      return;
    }
    if (!photoUri) {
      setErrorModalMessage(t('facial.validation.noFace'));
      return;
    }
    if (screenState !== 'captured' || quality !== 'good' || isRegistering) return;

    setIsRegistering(true);
    try {
      const imageBase64 = await imageUriToDataUri(photoUri);
      const sourceFrames = photoUris.length >= LIVENESS_FRAME_COUNT ? photoUris : [photoUri];
      const imageFrames = await Promise.all(sourceFrames.map((uri) => imageUriToDataUri(uri)));
      await registerFacialAttendanceFromImage({
        idRecordEnvironment: session.idRecordEnvironment,
        idDevice: session.idDevice,
        imageBase64,
        imageFrames,
        livenessChallenge: livenessChallenge.code,
        livenessChallenges: livenessSequence.map((challenge) => challenge.code),
        origin: isWeb ? 'PC' : 'MOBILE',
      });

      setSuccessModalVisible(true);
    } catch (error: any) {
      setErrorModalMessage(getFacialEmbeddingErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  }, [isRegistering, isWeb, livenessChallenge.code, livenessSequence, photoUri, photoUris, quality, screenState, session, t]);

  useEffect(() => {
    if (isWeb || screenState !== 'ready' || photoUri || isTaking || isRegistering || errorModalMessage || successModalVisible) {
      return;
    }

    const timer = setTimeout(() => {
      handleTakePhotoNative();
    }, 900);
    return () => clearTimeout(timer);
  }, [
    errorModalMessage,
    handleTakePhotoNative,
    isRegistering,
    isTaking,
    isWeb,
    photoUri,
    screenState,
    successModalVisible,
  ]);

  useEffect(() => {
    if (screenState !== 'captured' || quality !== 'good' || isRegistering || successModalVisible || errorModalMessage) {
      return;
    }

    handleFinish();
  }, [errorModalMessage, handleFinish, isRegistering, quality, screenState, successModalVisible]);

  useEffect(() => {
    if (!successModalVisible) return;
    const timer = setTimeout(() => {
      setSuccessModalVisible(false);
      handleRetake();
    }, 1600);
    return () => clearTimeout(timer);
  }, [handleRetake, successModalVisible]);

  const handleCloseSuccessModal = useCallback(() => {
    setSuccessModalVisible(false);
    handleRetake();
  }, [handleRetake]);

  const handleCloseErrorModal = useCallback(() => {
    setErrorModalMessage(null);
    setErrorModalTitle('No se pudo registrar');
    handleRetake();
  }, [handleRetake]);

  return {
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
