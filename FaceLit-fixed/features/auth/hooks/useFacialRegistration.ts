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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export type ScreenState = 'idle' | 'requesting' | 'positioning' | 'ready' | 'captured';
export type CaptureQuality = 'checking' | 'good' | 'lowLight';

const POSITIONING_DELAY_MS  = 1500; // tiempo simulado de "acércate más"
export const MIN_BRIGHTNESS_SCORE = 60; // umbral de brillo (0–255)

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

export function useFacialRegistration() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  const [screenState, setScreenState]                 = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri]                       = useState<string | null>(null);
  const [isTaking, setIsTaking]                       = useState(false);
  const [quality, setQuality]                         = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const cameraRef        = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb            = Platform.OS === 'web';
  const isPositioning    = screenState === 'positioning';
  const canFinish         = screenState === 'captured' && quality === 'good';

  useEffect(() => {
    return () => {
      if (positioningTimer.current) clearTimeout(positioningTimer.current);
    };
  }, []);

  // ── Iniciar simulación de "acércate más" → "posición correcta" ──
  const startPositioningSimulation = useCallback(() => {
    setScreenState('positioning');
    positioningTimer.current = setTimeout(() => {
      setScreenState('ready');
    }, POSITIONING_DELAY_MS);
  }, []);

  // ── Abrir cámara ──────────────────────────────
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
  }, [isWeb, permission, requestPermission, t, startPositioningSimulation]);

  // ── Evaluar calidad por brillo ────────────────
  const evaluateBrightness = useCallback((brightness: number) => {
    setQuality(brightness < MIN_BRIGHTNESS_SCORE ? 'lowLight' : 'good');
  }, []);

  // ── Captura nativa (expo-camera) ──────────────
  const handleTakePhotoNative = useCallback(async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        // En nativo no hay acceso directo a píxeles sin librerías extra,
        // así que se asume buena calidad salvo casos extremos
        setQuality('good');
        setScreenState('captured');
      }
    } catch {
      alert(t('facialReg.captureError'));
    } finally {
      setIsTaking(false);
    }
  }, [isTaking, t]);

  // ── Captura web (con análisis real de brillo) ─
  const handleWebCapture = useCallback((dataUri: string, brightness: number) => {
    setPhotoUri(dataUri);
    evaluateBrightness(brightness);
    setScreenState('captured');
  }, [evaluateBrightness]);

  const handleWebShutter = useCallback(() => {
    setIsTaking(true);
    setTimeout(() => setIsTaking(false), 200);
  }, []);

  // ── Retomar ────────────────────────────────────
  const handleRetake = useCallback(() => {
    setPhotoUri(null);
    setQuality('checking');
    startPositioningSimulation();
  }, [startPositioningSimulation]);

  // ── Finalizar ──────────────────────────────────
  const handleFinish = useCallback(() => {
    if (screenState !== 'captured' || !photoUri || quality !== 'good') return;
    setSuccessModalVisible(true);
  }, [screenState, photoUri, quality]);

  // Al cerrar el modal, recién ahí se navega al login.
  const handleCloseSuccessModal = useCallback(() => {
    setSuccessModalVisible(false);
    router.replace('/auth/login');
  }, []);

  return {
    // estado
    screenState,
    photoUri,
    isTaking,
    quality,
    successModalVisible,
    isWeb,
    isPositioning,
    canFinish,
    cameraRef,

    // acciones
    handleOpenCamera,
    handleTakePhotoNative,
    handleWebCapture,
    handleWebShutter,
    handleRetake,
    handleFinish,
    handleCloseSuccessModal,
  };
}
