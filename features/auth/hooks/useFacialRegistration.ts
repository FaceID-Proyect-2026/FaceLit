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
} from '@/shared/services/facialEmbeddingService';
import { imageUriToDataUri } from '@/shared/utils/imageToBase64';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

export type ScreenState = 'idle' | 'requesting' | 'confirmationRequired' | 'positioning' | 'ready' | 'captured';
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

interface FacialRegistrationOptions {
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
  const [isTaking, setIsTaking]                       = useState(false);
  const [isRegistering, setIsRegistering]             = useState(false);
  const [quality, setQuality]                         = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const cameraRef        = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb            = Platform.OS === 'web';
  const isPositioning    = screenState === 'positioning';
  const canFinish         = screenState === 'captured' && quality === 'good' && !isRegistering;

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
    setScreenState('idle');
    setPhotoUri(null);
    setQuality('checking');
  }, []);

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
  const handleFinish = useCallback(async () => {
    if (!photoUri) {
      alert(t('facial.validation.noFace'));
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
      alert(t('facial.validation.userNotFound'));
      return;
    }

    setIsRegistering(true);
    try {
      const imageBase64 = await imageUriToDataUri(photoUri);
      await registerFacialEmbeddingFromImage({
        userId: facialUser.id,
        imageBase64,
        photoReference: buildPhotoReference(photoUri, isWeb),
        replaceExisting,
        createdBy,
      });

      const result = registerFacialCapture(facialUser, photoUri, true, replaceExisting);
      if (!result.success) {
        alert(t(result.error));
        return;
      }
      setSuccessModalVisible(true);
    } catch (error: any) {
      const message = getFacialEmbeddingErrorMessage(error);
      console.warn('[FacialRegistration] Error registering embedding', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      if (allowLocalFallback) {
        const result = registerFacialCapture(facialUser, photoUri, true, replaceExisting);
        if (!result.success) {
          alert(t(result.error));
          return;
        }
        setSuccessModalVisible(true);
        return;
      }
      alert(message);
    } finally {
      setIsRegistering(false);
    }
  }, [screenState, photoUri, quality, isRegistering, isWeb, t, user, targetUser, replaceExisting, createdBy, allowLocalFallback]);

  // Al cerrar el modal se queda en el flujo actual; la pantalla decide qué mostrar después.
  const handleCloseSuccessModal = useCallback(() => {
    setSuccessModalVisible(false);
  }, []);

  return {
    // estado
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

    // acciones
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
