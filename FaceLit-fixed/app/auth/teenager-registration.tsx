// ─────────────────────────────────────────────
//  app/auth/teenager-registration.tsx
//  Registro facial — código limpio + i18n
//
//  • Móvil (Android/iOS): expo-camera (CameraView)
//  • Web: MediaDevices API del navegador
//
//  Validaciones:
//  1. "Acércate más" — simulada, tras 1.5s pasa a "posición correcta"
//  2. Brillo de imagen — real, lee píxeles del canvas/foto
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator, Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
// import { Routes } from '@/shared/constants/routes'; // ya no se usa: el modal de éxito reemplazó la navegación
import GradientBackground from '@/shared/components/layout/GradientBackground';

// ── Constantes ────────────────────────────────
const INSTRUCTION_KEYS = [
  'facialReg.instr1',
  'facialReg.instr2',
  'facialReg.instr3',
  'facialReg.instr4',
  'facialReg.instr5',
];

const POSITIONING_DELAY_MS  = 1500; // tiempo simulado de "acércate más"
const MIN_BRIGHTNESS_SCORE  = 60;   // umbral de brillo (0–255)

// ── Modal de éxito ─────────────────────────────
const SUCCESS_BUTTON_GRADIENT = ['#72C96D', '#65B361', '#4FA14B'] as const;

type ScreenState = 'idle' | 'requesting' | 'positioning' | 'ready' | 'captured';
type CaptureQuality = 'checking' | 'good' | 'lowLight';

// ── Helper: brillo promedio de una imagen ─────
function getAverageBrightness(canvas: HTMLCanvasElement): number {
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

// ─────────────────────────────────────────────
//  Cámara web — MediaDevices API
// ─────────────────────────────────────────────
interface WebCameraProps {
  primaryColor: string;
  isTaking: boolean;
  isPositioning: boolean;
  onCapture: (dataUri: string, brightness: number) => void;
  onShutter: () => void;
}

function WebCamera({
  primaryColor, isTaking, isPositioning, onCapture, onShutter,
}: WebCameraProps) {
  const { t } = useTranslation();
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('facialReg.permissionDenied'));
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [t]);

  const capture = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const brightness = getAverageBrightness(canvas);
    const dataUri = canvas.toDataURL('image/jpeg', 0.85);

    onCapture(dataUri, brightness);
    onShutter();
  }, [ready, onCapture, onShutter]);

  if (error) {
    return (
      <View style={wc.centerBox}>
        <Ionicons name="alert-circle-outline" size={36} color={Colors.error} />
        <Text style={wc.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* @ts-ignore — elemento HTML nativo */}
      <video
        ref={videoRef}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: ready ? 'block' : 'none',
        }}
        muted playsInline autoPlay
      />
      {/* @ts-ignore */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {!ready && (
        <View style={wc.centerBox}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={wc.loadingText}>{t('facialReg.requestingPermission')}</Text>
        </View>
      )}

      {ready && (
        <FaceGuideOverlay primaryColor={primaryColor} isPositioning={isPositioning} />
      )}

      {ready && (
        <ShutterButton
          primaryColor={primaryColor}
          disabled={isTaking || isPositioning}
          loading={isTaking}
          onPress={capture}
        />
      )}
    </View>
  );
}

const wc = StyleSheet.create({
  centerBox:   { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  errorText:   { color: Colors.error, fontSize: FontSize.md, textAlign: 'center', lineHeight: 19 },
  loadingText: { color: '#AAAAAA', fontSize: FontSize.md },
});

// ─────────────────────────────────────────────
//  Sub-componentes compartidos
// ─────────────────────────────────────────────
function FaceGuideOverlay({
  primaryColor, isPositioning,
}: { primaryColor: string; isPositioning: boolean }) {
  const { t } = useTranslation();

  return (
    <View style={s.faceGuideContainer} pointerEvents="none">
      <View style={[
        s.faceGuide,
        { borderColor: isPositioning ? Colors.warning : primaryColor },
      ]} />
      <View style={[
        s.positionBadge,
        { backgroundColor: isPositioning ? Colors.warning : primaryColor },
      ]}>
        <Ionicons
          name={isPositioning ? 'resize-outline' : 'checkmark-circle'}
          size={14} color={Colors.white}
        />
        <Text style={s.positionBadgeText}>
          {isPositioning ? t('facialReg.moveCloser') : t('facialReg.goodPosition')}
        </Text>
      </View>
    </View>
  );
}

function ShutterButton({
  primaryColor, disabled, loading, onPress,
}: { primaryColor: string; disabled: boolean; loading: boolean; onPress: () => void }) {
  return (
    <View style={s.shutterContainer}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[s.shutterOuter, { borderColor: primaryColor, opacity: disabled ? 0.5 : 1 }]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={primaryColor} />
        ) : (
          <View style={[s.shutterInner, { backgroundColor: primaryColor }]} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
export default function TeenagerRegistrationScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  const [screenState, setScreenState]     = useState<ScreenState>('idle');
  const [photoUri, setPhotoUri]           = useState<string | null>(null);
  const [isTaking, setIsTaking]           = useState(false);
  const [quality, setQuality]             = useState<CaptureQuality>('checking');
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isWeb = Platform.OS === 'web';
  const isPositioning = screenState === 'positioning';

  const text       = isDark ? Colors.dark.text      : Colors.light.text;
  const muted      = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg     = isDark ? Colors.dark.surface    : Colors.white;
  const cardBorder = isDark ? Colors.dark.border     : Colors.light.border;
  const instrBg    = isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.07)';

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

  const canFinish = screenState === 'captured' && quality === 'good';

  // ── Render del área de cámara ──────────────────
  const renderCameraArea = () => {
    if (screenState === 'requesting') {
      return (
        <View style={s.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[s.hintText, { color: muted, marginTop: 14 }]}>
            {t('facialReg.requestingPermission')}
          </Text>
        </View>
      );
    }

    if (screenState === 'positioning' || screenState === 'ready') {
      if (isWeb) {
        return (
          <WebCamera
            primaryColor={theme.primary}
            isTaking={isTaking}
            isPositioning={isPositioning}
            onCapture={handleWebCapture}
            onShutter={handleWebShutter}
          />
        );
      }

      return (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={'front' as CameraType}
          />
          <FaceGuideOverlay primaryColor={theme.primary} isPositioning={isPositioning} />
          <ShutterButton
            primaryColor={theme.primary}
            disabled={isTaking || isPositioning}
            loading={isTaking}
            onPress={handleTakePhotoNative}
          />
        </View>
      );
    }

    if (screenState === 'captured' && photoUri) {
      const isGood = quality === 'good';
      return (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={s.capturedOverlay} pointerEvents="none">
            <View style={[s.capturedBadge, {
              backgroundColor: isDark ? 'rgba(7,18,13,0.80)' : 'rgba(255,255,255,0.85)',
            }]}>
              <Ionicons
                name={isGood ? 'checkmark-circle' : 'alert-circle'}
                size={22}
                color={isGood ? theme.primary : Colors.error}
              />
              <Text style={[s.capturedLabel, { color: isGood ? theme.primary : Colors.error }]}>
                {isGood ? t('facialReg.captureSuccess') : t('facialReg.lowLight')}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // idle
    return (
      <View style={s.centerState}>
        <View style={[s.faceFrame, { borderColor: theme.primaryFaint }]}>
          <Ionicons name="person-outline" size={64} color={theme.primaryFaint} />
        </View>
        <Text style={[s.hintText, { color: muted }]}>{t('facialReg.tapToCapture')}</Text>
      </View>
    );
  };

  // ── Render principal ────────────────────────────
  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

          {/* Encabezado */}
          <View style={s.header}>
            <View style={[s.iconCircle, {
              backgroundColor: isDark ? 'rgba(101,179,97,0.12)' : 'rgba(101,179,97,0.10)',
              borderColor: theme.primary,
            }]}>
              <Ionicons name="camera-outline" size={38} color={theme.primary} />
            </View>
            <Text style={[s.title, { color: text }]}>{t('facialReg.title')}</Text>
            <Text style={[s.subtitle, { color: muted }]}>{t('facialReg.subtitle')}</Text>
          </View>

          {/* Área de cámara */}
          <TouchableOpacity
            activeOpacity={screenState === 'idle' ? 0.8 : 1}
            onPress={screenState === 'idle' ? handleOpenCamera : undefined}
            style={[s.cameraBox, {
              backgroundColor: screenState === 'positioning' || screenState === 'ready'
                ? Colors.black
                : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(101,179,97,0.05)'),
              borderColor: screenState === 'captured' ? theme.primary : theme.primaryFaint,
              borderStyle: screenState === 'idle' || screenState === 'requesting' ? 'dashed' : 'solid',
            }]}
          >
            {renderCameraArea()}
          </TouchableOpacity>

          {/* Instrucciones */}
          <View style={[s.instrBox, { backgroundColor: instrBg, borderColor: theme.primaryFaint }]}>
            <View style={s.instrHeader}>
              <Ionicons name="list-outline" size={15} color={theme.primary} />
              <Text style={[s.instrTitle, { color: theme.primary }]}>
                {t('facialReg.instructions')}
              </Text>
            </View>
            {INSTRUCTION_KEYS.map((key, index) => (
              <View key={key} style={s.instrRow}>
                <View style={[s.instrNum, { backgroundColor: theme.primary }]}>
                  <Text style={s.instrNumText}>{index + 1}</Text>
                </View>
                <Text style={[s.instrItem, { color: muted }]}>{t(key)}</Text>
              </View>
            ))}
          </View>

          {/* Botones de acción */}
          <View style={s.actions}>
            {screenState === 'idle' && (
              <TouchableOpacity
                onPress={handleOpenCamera}
                style={[s.captureBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={20} color={Colors.white} />
                <Text style={s.captureBtnText}>{t('facialReg.captureBtn')}</Text>
              </TouchableOpacity>
            )}

            {screenState === 'captured' && (
              <TouchableOpacity
                onPress={handleRetake}
                style={[s.retakeBtn, { borderColor: isDark ? 'rgba(255,255,255,0.20)' : '#CCCCCC' }]}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={18} color={muted} />
                <Text style={[s.retakeBtnText, { color: muted }]}>{t('facialReg.retake')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleFinish}
              disabled={!canFinish}
              activeOpacity={0.85}
              style={[s.finishBtn, !canFinish && s.finishBtnDisabled]}
            >
              <View style={[
                s.finishBtnInner,
                { backgroundColor: canFinish ? theme.primary : '#888888' },
              ]}>
                <Ionicons name="checkmark-done-outline" size={20} color={Colors.white} />
                <Text style={s.finishBtnText}>{t('facialReg.finish')}</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* ── Modal de éxito de registro facial ── */}
      <Modal
        visible={successModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {}} // bloquea cierre con botón atrás; se cierra solo con el botón
      >
        <View style={ms.overlay}>
          <View style={[ms.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000000' : '#1C3A1D' }]}>

            {/* Círculo con check */}
            <View style={[ms.iconCircle, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={52} color="#FFFFFF" />
            </View>

            {/* Título */}
            <Text style={[ms.title, { color: text }]}>
              {t('registrationSuccess.title')}
            </Text>

            {/* Subtítulo */}
            <Text style={[ms.subtitle, { color: muted }]}>
              {t('registrationSuccess.subtitle')}
            </Text>

            {/* Separador */}
            <View style={[
              ms.divider,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
            ]} />

            {/* Botón */}
            <TouchableOpacity
              style={ms.button}
              onPress={handleCloseSuccessModal}
              activeOpacity={0.85}
            >
              <LinearGradient colors={SUCCESS_BUTTON_GRADIENT} style={ms.buttonGradient}>
                <Text style={ms.buttonText}>{t('registrationSuccess.btn')}</Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 },

  card: {
    width: '100%', maxWidth: 900, borderRadius: 26, borderWidth: 1,
    paddingHorizontal: 24, paddingVertical: 30,
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8,
  },

  header:     { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:      { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: FontSize.md, textAlign: 'center', lineHeight: 20 },

  cameraBox: { width: '100%', maxWidth: 420, height: 420, alignSelf: 'center', borderRadius: 20, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  centerState: { alignItems: 'center', gap: 14, padding: 20 },
  faceFrame:   { width: 110, height: 110, borderRadius: 55, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  hintText:    { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'center' },

  faceGuideContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  faceGuide:          { width: 170, height: 210, borderRadius: 90, borderWidth: 2, borderStyle: 'dashed' },

  positionBadge:     { position: 'absolute', bottom: 90, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  positionBadgeText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  shutterContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  shutterOuter:      { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  shutterInner:       { width: 46, height: 46, borderRadius: 23 },

  capturedOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 16 },
  capturedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, maxWidth: '90%' },
  capturedLabel:   { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, flexShrink: 1 },

  instrBox:    { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24 },
  instrHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  instrTitle:  { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, textTransform: 'uppercase', letterSpacing: 0.6 },
  instrRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  instrNum:    { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  instrNumText:{ color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.extrabold },
  instrItem:   { flex: 1, fontSize: FontSize.md, lineHeight: 19 },

  actions:    { gap: 12 },
  captureBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 16 },
  captureBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  retakeBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1.2 },
  retakeBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },

  finishBtn:         { borderRadius: 16, overflow: 'hidden' },
  finishBtnDisabled: { opacity: 0.55 },
  finishBtnInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  finishBtnText:     { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});

// ─── Styles del modal de éxito ────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  card: {
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 40,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  iconCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  divider: {
    width: '80%',
    height: 1,
    marginBottom: 28,
  },

  button: {
    width: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});