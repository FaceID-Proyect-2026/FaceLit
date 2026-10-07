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

interface UseSessionAttendanceCaptureOptions {
  session?: FacialSession;
}

export function useSessionAttendanceCapture({ session }: UseSessionAttendanceCaptureOptions) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [quality, setQuality] = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb = Platform.OS === 'web';
  const isPositioning = screenState === 'positioning';
  const canFinish = screenState === 'captured' && quality === 'good' && !isRegistering;

  useEffect(() => {
    return () => {
      if (positioningTimer.current) clearTimeout(positioningTimer.current);
    };
  }, []);

  const startPositioningSimulation = useCallback(() => {
    setScreenState('positioning');
    positioningTimer.current = setTimeout(() => {
      setScreenState('ready');
    }, POSITIONING_DELAY_MS);
  }, []);

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
    setQuality('checking');
  }, []);

  const evaluateBrightness = useCallback((brightness: number) => {
    setQuality(brightness < MIN_BRIGHTNESS_SCORE ? 'lowLight' : 'good');
  }, []);

  const handleTakePhotoNative = useCallback(async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setQuality('good');
        setScreenState('captured');
      }
    } catch {
      alert(t('facialReg.captureError'));
    } finally {
      setIsTaking(false);
    }
  }, [isTaking, t]);

  const handleWebCapture = useCallback((dataUri: string, brightness: number) => {
    setPhotoUri(dataUri);
    evaluateBrightness(brightness);
    setScreenState('captured');
  }, [evaluateBrightness]);

  const handleWebShutter = useCallback(() => {
    setIsTaking(true);
    setTimeout(() => setIsTaking(false), 200);
  }, []);

  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setQuality('checking');
    startPositioningSimulation();
  }, [startPositioningSimulation]);

  const handleFinish = useCallback(async () => {
    if (!session) {
      alert('No hay una sesión activa para registrar asistencia.');
      return;
    }
    if (!photoUri) {
      alert(t('facial.validation.noFace'));
      return;
    }
    if (screenState !== 'captured' || quality !== 'good' || isRegistering) return;

    setIsRegistering(true);
    try {
      const imageBase64 = await imageUriToDataUri(photoUri);
      await registerFacialAttendanceFromImage({
        idRecordEnvironment: session.idRecordEnvironment,
        idDevice: session.idDevice,
        imageBase64,
        origin: isWeb ? 'PC' : 'MOBILE',
      });

      setSuccessModalVisible(true);
    } catch (error: any) {
      alert(getFacialEmbeddingErrorMessage(error));
    } finally {
      setIsRegistering(false);
    }
  }, [isRegistering, isWeb, photoUri, quality, screenState, session, t]);

  const handleCloseSuccessModal = useCallback(() => {
    setSuccessModalVisible(false);
  }, []);

  return {
    screenState,
    photoUri,
    isTaking,
    isRegistering,
    quality,
    successModalVisible,
    isWeb,
    isPositioning,
    canFinish,
    cameraRef,
    handleOpenCamera,
    handleConfirmCamera,
    handleCancelCamera,
    handleTakePhotoNative,
    handleWebCapture,
    handleWebShutter,
    handleRetake,
    handleFinish,
    handleCloseSuccessModal,
  };
}
