// ─────────────────────────────────────────────
//  app/auth/teenager-registration.tsx
//  Solo VISTA — toda la lógica de negocio vive en
//  features/auth/hooks/useFacialRegistration.ts
//
//  • Móvil (Android/iOS): expo-camera (CameraView)
//  • Web: MediaDevices API del navegador (WebCamera)
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator, Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import GradientBackground from '@/shared/components/layout/GradientBackground';
import { useFacialRegistration } from '@/features/auth/hooks/useFacialRegistration';
import WebCamera from '@/features/auth/components/WebCamera';
import FaceGuideOverlay from '@/features/auth/components/FaceGuideOverlay';
import ShutterButton from '@/features/auth/components/ShutterButton';

// ── Constantes de presentación ────────────────
const INSTRUCTION_KEYS = [
  'facialReg.instr1',
  'facialReg.instr2',
  'facialReg.instr3',
  'facialReg.instr4',
  'facialReg.instr5',
];

const SUCCESS_BUTTON_GRADIENT = ['#72C96D', '#65B361', '#4FA14B'] as const;

// ─────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────
export default function TeenagerRegistrationScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  // ── Toda la lógica de negocio viene del hook ──
  const {
    screenState, photoUri, isTaking, quality, successModalVisible,
    isWeb, isPositioning, canFinish, cameraRef,
    handleOpenCamera, handleTakePhotoNative, handleWebCapture, handleWebShutter,
    handleRetake, handleFinish, handleCloseSuccessModal,
  } = useFacialRegistration();

  // ── Colores locales (presentación) ─────────────
  const text       = isDark ? Colors.dark.text      : Colors.light.text;
  const muted      = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg     = isDark ? Colors.dark.surface    : Colors.white;
  const cardBorder = isDark ? Colors.dark.border     : Colors.light.border;
  const instrBg    = isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.07)';

  // ── Render del área de cámara (solo vista, según el estado del hook) ──
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

            <View style={[ms.iconCircle, { backgroundColor: theme.primary }]}>
              <Ionicons name="checkmark" size={52} color="#FFFFFF" />
            </View>

            <Text style={[ms.title, { color: text }]}>
              {t('registrationSuccess.title')}
            </Text>

            <Text style={[ms.subtitle, { color: muted }]}>
              {t('registrationSuccess.subtitle')}
            </Text>

            <View style={[
              ms.divider,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
            ]} />

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

// ── Estilos (solo presentación) ────────────────
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
