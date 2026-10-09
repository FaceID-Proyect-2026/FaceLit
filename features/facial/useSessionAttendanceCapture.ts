import { MIN_BRIGHTNESS_SCORE, ScreenState, CaptureQuality } from '@/features/auth/hooks/useFacialRegistration';
import { FacialSession } from '@/features/facial/types';
import { registerFacialAttendanceFromImage } from '@/shared/services/facialAttendanceService';
import { getFacialEmbeddingErrorMessage } from '@/shared/services/facialEmbeddingService';
import { imageUriToDataUri } from '@/shared/utils/imageToBase64';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

const POSITIONING_DELAY_MS = 1500;
const LIVENESS_FRAME_COUNT = 5;
const LIVENESS_START_DELAY_MS = 650;
const LIVENESS_FRAME_DELAY_MS = 380;

type LivenessChallenge = {
  code: 'BLINK' | 'OPEN_CLOSE_MOUTH' | 'STICK_TONGUE' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'MOVE_CLOSER' | 'MOVE_AWAY';
  label: string;
};

const LIVENESS_CHALLENGES: LivenessChallenge[] = [
  { code: 'BLINK', label: 'Pestañea una vez' },
  { code: 'OPEN_CLOSE_MOUTH', label: 'Abre y cierra la boca' },
  { code: 'STICK_TONGUE', label: 'Saca la lengua un momento' },
  { code: 'MOVE_LEFT', label: 'Mueve tu rostro hacia la izquierda' },
  { code: 'MOVE_RIGHT', label: 'Mueve tu rostro hacia la derecha' },
  { code: 'MOVE_CLOSER', label: 'Acércate un poco a la cámara' },
  { code: 'MOVE_AWAY', label: 'Aléjate un poco de la cámara' },
] ;

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
  const [quality, setQuality] = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
  const [livenessChallenge, setLivenessChallenge] = useState(() => LIVENESS_CHALLENGES[0]);

  const cameraRef = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb = Platform.OS === 'web';
  const isPositioning = screenState === 'positioning';
  const canFinish = screenState === 'captured' && quality === 'good' && !isRegistering;

  const randomizeLivenessChallenge = useCallback(() => {
    setLivenessChallenge((current) => {
      const nextOptions = LIVENESS_CHALLENGES.filter((challenge) => challenge.code !== current.code);
      return nextOptions[Math.floor(Math.random() * nextOptions.length)] ?? current;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (positioningTimer.current) clearTimeout(positioningTimer.current);
    };
  }, []);

  const startPositioningSimulation = useCallback(() => {
    randomizeLivenessChallenge();
    setScreenState('positioning');
    positioningTimer.current = setTimeout(() => {
      setScreenState('ready');
    }, POSITIONING_DELAY_MS);
  }, [randomizeLivenessChallenge]);

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
    setQuality('checking');
  }, []);

  const evaluateBrightness = useCallback((brightness: number) => {
    setQuality(brightness < MIN_BRIGHTNESS_SCORE ? 'lowLight' : 'good');
  }, []);

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
        setPhotoUri(captures[captures.length - 1]);
        setPhotoUris(captures);
        setQuality('good');
        setScreenState('captured');
      }
    } catch {
      alert(t('facialReg.captureError'));
    } finally {
      setIsTaking(false);
    }
  }, [isTaking, t]);

  const handleWebCapture = useCallback((dataUri: string | string[], brightness: number) => {
    const frames = Array.isArray(dataUri) ? dataUri : [dataUri];
    const preview = frames[frames.length - 1];
    if (!preview) return;
    setPhotoUri(preview);
    setPhotoUris(frames);
    evaluateBrightness(brightness);
    setScreenState('captured');
  }, [evaluateBrightness]);

  const handleWebShutter = useCallback(() => {
    setIsTaking(true);
    setTimeout(() => setIsTaking(false), 200);
  }, []);

  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setPhotoUris([]);
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
        origin: isWeb ? 'PC' : 'MOBILE',
      });

      setSuccessModalVisible(true);
    } catch (error: any) {
      setErrorModalMessage(getFacialEmbeddingErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  }, [isRegistering, isWeb, livenessChallenge.code, photoUri, photoUris, quality, screenState, session, t]);

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
    handleRetake();
  }, [handleRetake]);

  return {
    screenState,
    photoUri,
    isTaking,
    isRegistering,
    quality,
    successModalVisible,
    errorModalVisible: Boolean(errorModalMessage),
    errorModalMessage,
    isWeb,
    isPositioning,
    canFinish,
    livenessChallenge,
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
