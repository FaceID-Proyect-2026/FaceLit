// ─────────────────────────────────────────────
//  app/apprentice/facial.tsx
//  Reconocimiento Facial — Aprendiz
//  RF-5.1: Pantalla de confirmación de identidad
//  RF-5.2: Captura con validación inteligente
//  Solo puede registrar la persona autenticada.
// ─────────────────────────────────────────────
import FaceGuideOverlay from '@/features/auth/components/FaceGuideOverlay';
import ShutterButton from '@/features/auth/components/ShutterButton';
import WebCamera from '@/features/auth/components/WebCamera';
import { useFacialRegistration } from '@/features/auth/hooks/useFacialRegistration';
import { getFacialRecordsSnapshot } from '@/features/facial/facialStore';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// CameraView solo existe en nativo — importarlo en web devuelve null y rompe el render.
// Se importa con require() condicional dentro del componente de cámara.

// ── Paso del flujo ─────────────────────────────
type Step = 'confirm' | 'camera' | 'done';

export default function ApprenticeFacialScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const [step, setStep] = useState<Step>('confirm');
  const [confirmed, setConfirmed] = useState(false);

  const text   = isDark ? Colors.dark.text       : Colors.light.text;
  const muted  = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14'              : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const bg     = isDark ? Colors.dark.background : Colors.light.background;

  // Nombre completo del aprendiz
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
    : (user?.email ?? '');

  // Estado del registro facial actual
  const records = getFacialRecordsSnapshot();
  const myRecord = records.find(r => r.userId === user?.id);
  const isRegistered = myRecord?.status === 'registered';

  const {
    screenState, photoUri, isTaking, quality, successModalVisible,
    isWeb, isPositioning, canFinish, cameraRef,
    handleOpenCamera, handleConfirmCamera, handleCancelCamera,
    handleTakePhotoNative, handleWebCapture,
    handleWebShutter, handleRetake, handleFinish, handleCloseSuccessModal,
  } = useFacialRegistration();

  // ── Cancelar desde la cámara → limpia estado y vuelve al paso confirm ──
  function handleCancelAndReturn() {
    handleCancelCamera();
    setStep('confirm');
  }

  // ── Confirmación de identidad (RF-5.1) ────────
  function handleConfirmAndProceed() {
    if (!confirmed) return;
    if (isRegistered) {
      alert(
        t('facialReg.alreadyRegisteredTitle', 'Ya tienes un rostro registrado'),
        t('facialReg.alreadyRegisteredBody', 'Para reemplazar tu registro facial necesitas autorización del Coordinador.'),
      );
      return;
    }
    setStep('camera');
    handleOpenCamera();
  }

  // ── Al cerrar modal de éxito ───────────────────
  function handleSuccess() {
    handleCloseSuccessModal();
    setStep('done');
  }

  // ── Validaciones de calidad como chips ────────
  const qualityWarnings: { icon: string; label: string; ok: boolean }[] = [
    { icon: 'sunny-outline',   label: t('facialReg.checkLight',    'Iluminación'),    ok: quality !== 'lowLight' },
    { icon: 'scan-outline',    label: t('facialReg.checkFace',     'Rostro visible'), ok: screenState !== 'idle' && screenState !== 'requesting' },
    { icon: 'camera-outline',  label: t('facialReg.checkFrontal',  'Vista frontal'),  ok: quality === 'good' },
  ];

  // ─────────────────────────────────────────────
  //  PASO 1 — Confirmación de identidad
  // ─────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <View style={[s.safe, { backgroundColor: bg }]}>
        {DialogUI}

        {/* Header */}
        <View style={[s.header, { borderBottomColor: border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: text }]}>{t('sidebar.facialRecognition')}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>

          {/* Estado actual del registro */}
          <View style={[s.statusCard, { backgroundColor: isRegistered ? Colors.success + '15' : Colors.warning + '15', borderColor: isRegistered ? Colors.success : Colors.warning }]}>
            <Ionicons name={isRegistered ? 'checkmark-circle' : 'alert-circle'} size={28} color={isRegistered ? Colors.success : Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[s.statusTitle, { color: text }]}>
                {isRegistered
                  ? t('facialReg.alreadyRegisteredTitle', 'Registro completado')
                  : t('facialReg.pendingTitle', 'Registro pendiente')}
              </Text>
              <Text style={[s.statusDesc, { color: muted }]}>
                {isRegistered
                  ? t('facialReg.registeredOn', 'Tu rostro fue registrado el') + ` ${myRecord?.date ?? ''}`
                  : t('facialReg.registerFaceDesc', 'Completa tu registro facial para que el sistema pueda registrar tu asistencia automáticamente.')}
              </Text>
            </View>
          </View>

          {/* Aviso de responsabilidad (RF-5.1) */}
          <View style={[s.noticeCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[s.noticeIconWrap, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="person-circle-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[s.noticeTitle, { color: text }]}>
              {t('facialReg.identityTitle', 'Verificación de identidad')}
            </Text>
            <Text style={[s.noticeBody, { color: text }]}>
              {t('facialReg.identityNotice', 'La persona que se va a registrar es:')}
            </Text>
            <LinearGradient
              colors={['#65B361', '#4A9146']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.nameBadge}
            >
              <Text style={s.nameBadgeText}>{fullName}</Text>
            </LinearGradient>
          </View>

          {/* Instrucciones */}
          <View style={[s.instructCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[s.instructTitle, { color: text }]}>{t('facialReg.instructions')}</Text>
            {[
              { icon: 'sunny-outline',         text: t('facialReg.instr2') },
              { icon: 'eye-outline',            text: t('facialReg.instr3') },
              { icon: 'glasses-outline',        text: t('facialReg.instr4') },
              { icon: 'phone-portrait-outline', text: t('facialReg.noPhonePhoto', 'No fotografíes una pantalla o foto impresa') },
              { icon: 'person-outline',         text: t('facialReg.instr5') },
            ].map((item, i) => (
              <View key={i} style={s.instructRow}>
                <View style={[s.instructDot, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name={item.icon as any} size={16} color={theme.primary} />
                </View>
                <Text style={[s.instructText, { color: muted }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Casilla de confirmación */}
          <TouchableOpacity
            onPress={() => setConfirmed(c => !c)}
            style={[s.checkRow, { borderColor: confirmed ? theme.primary : border }]}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, { borderColor: confirmed ? theme.primary : muted, backgroundColor: confirmed ? theme.primary : 'transparent' }]}>
              {confirmed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={[s.checkLabel, { color: text }]}>
              {t('facialReg.confirmResponsibility', 'He leído el aviso y entiendo que soy responsable de este registro.')}
            </Text>
          </TouchableOpacity>

          {/* Botón continuar */}
          <TouchableOpacity
            onPress={handleConfirmAndProceed}
            disabled={!confirmed || isRegistered}
            style={[s.primaryBtn, { backgroundColor: (!confirmed || isRegistered) ? muted + '40' : theme.primary }]}
            activeOpacity={0.85}
          >
            <Ionicons name="scan-outline" size={20} color={Colors.white} />
            <Text style={s.primaryBtnText}>
              {isRegistered
                ? t('facialReg.alreadyRegisteredTitle', 'Ya registrado')
                : t('facialReg.captureBtn')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  //  PASO 2 — Cámara + validación inteligente
  // ─────────────────────────────────────────────
  if (step === 'camera') {
    return (
      <View style={[s.safe, { backgroundColor: '#000' }]}>
        {DialogUI}
        {/* Header cámara */}
        <View style={[s.camHeader]}>
          <TouchableOpacity onPress={handleCancelAndReturn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={s.camHeaderTitle}>{t('facialReg.title')}</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Chips de calidad */}
        <View style={s.qualityRow}>
          {qualityWarnings.map(w => (
            <View key={w.label} style={[s.qualityChip, { backgroundColor: w.ok ? Colors.success + '22' : Colors.error + '22', borderColor: w.ok ? Colors.success : Colors.error }]}>
              <Ionicons name={w.icon as any} size={13} color={w.ok ? Colors.success : Colors.error} />
              <Text style={{ color: w.ok ? Colors.success : Colors.error, fontSize: 11, fontWeight: '700' }}>{w.label}</Text>
            </View>
          ))}
        </View>

        {/* Vista de cámara */}
        <View style={s.cameraWrap}>
          {photoUri ? (
            // Vista previa después de captura
            <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: Colors.white, fontSize: FontSize.lg, marginBottom: 24 }}>{t('facialReg.captured')}</Text>
              <View style={s.previewActions}>
                <TouchableOpacity onPress={handleRetake} style={[s.secondaryBtn]}>
                  <Ionicons name="refresh-outline" size={18} color={Colors.white} />
                  <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('facialReg.retake')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleFinish} disabled={!canFinish}
                  style={[s.primaryBtn, { backgroundColor: canFinish ? theme.primary : muted + '60', flex: 1 }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.white} />
                  <Text style={s.primaryBtnText}>{t('facialReg.finish')}</Text>
                </TouchableOpacity>
              </View>
              {quality === 'lowLight' && (
                <Text style={{ color: Colors.warning, textAlign: 'center', paddingHorizontal: 24, marginTop: 12 }}>
                  {t('facialReg.lowLight')}
                </Text>
              )}
            </View>
          ) : isWeb ? (
            <WebCamera
              primaryColor={theme.primary}
              isTaking={isTaking}
              isPositioning={isPositioning}
              screenState={screenState}
              quality={quality}
              onCapture={handleWebCapture}
              onShutter={handleWebShutter}
              onConfirm={handleConfirmCamera}
              onCancel={handleCancelAndReturn}
            />
          ) : (
            (() => {
              // require condicional: evita que CameraView sea null en web
              const { CameraView: NativeCameraView } = require('expo-camera');
              return (
                <NativeCameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
                  <FaceGuideOverlay
                    primaryColor={theme.primary}
                    isPositioning={isPositioning}
                    screenState={screenState}
                    quality={quality}
                    onConfirm={handleConfirmCamera}
                    onCancel={handleCancelAndReturn}
                  />
                </NativeCameraView>
              );
            })()
          )}
        </View>

        {/* Botón disparador (solo nativo, cuando cámara activa y no hay foto) */}
        {!photoUri && !isWeb && (
          <View style={s.shutterWrap}>
            <ShutterButton
              primaryColor={theme.primary}
              onPress={handleTakePhotoNative}
              disabled={isTaking || screenState !== 'ready'}
              loading={isTaking}
            />
          </View>
        )}

        {/* Modal de éxito */}
        {successModalVisible && (
          <View style={s.successOverlay}>
            <View style={[s.successModal, { backgroundColor: cardBg }]}>
              <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
              <Text style={[s.successTitle, { color: text }]}>{t('facialReg.successTitle')}</Text>
              <Text style={[{ color: muted, textAlign: 'center', marginTop: 8 }]}>{t('facialReg.successMessage')}</Text>
              <TouchableOpacity onPress={handleSuccess} style={[s.primaryBtn, { marginTop: 24, backgroundColor: theme.primary }]}>
                <Text style={s.primaryBtnText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  // ─────────────────────────────────────────────
  //  PASO 3 — Registro completado
  // ─────────────────────────────────────────────
  return (
    <View style={[s.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={[s.successTitle, { color: text, marginTop: 20 }]}>{t('facialReg.successTitle')}</Text>
      <Text style={[{ color: muted, textAlign: 'center', marginTop: 8 }]}>{t('facialReg.successMessage')}</Text>
      <TouchableOpacity onPress={() => router.back()} style={[s.primaryBtn, { marginTop: 32, backgroundColor: theme.primary }]}>
        <Ionicons name="home-outline" size={18} color={Colors.white} />
        <Text style={s.primaryBtnText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },

  // Status card
  statusCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 16 },
  statusTitle: { fontSize: FontSize.base, fontWeight: FontWeight.black },
  statusDesc:  { fontSize: FontSize.sm, marginTop: 3, lineHeight: 18 },

  // Notice card
  noticeCard:    { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', gap: 12, marginBottom: 16 },
  noticeIconWrap:{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  noticeTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.black, textAlign: 'center' },
  noticeBody:    { fontSize: FontSize.base, textAlign: 'center' },
  nameBadge:     { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  nameBadgeText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.black },
  warningText:   { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 18 },

  // Instructions
  instructCard:  { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, gap: 8 },
  instructTitle: { fontSize: FontSize.base, fontWeight: FontWeight.black, marginBottom: 4 },
  instructRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  instructDot:   { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  instructText:  { flex: 1, fontSize: FontSize.sm, lineHeight: 18 },

  // Checkbox
  checkRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 10, borderWidth: 1.2, padding: 14, marginBottom: 20 },
  checkbox:    { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkLabel:  { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },

  // Camera
  camHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  camHeaderTitle:{ color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.black },
  qualityRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8, flexWrap: 'wrap' },
  qualityChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  cameraWrap:    { flex: 1 },
  shutterWrap:   { alignItems: 'center', paddingBottom: 40, paddingTop: 20 },
  previewActions:{ flexDirection: 'row', gap: 12, paddingHorizontal: 24 },

  // Success overlay
  successOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  successModal:  { borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340 },
  successTitle:  { fontSize: FontSize.xl, fontWeight: FontWeight.black, textAlign: 'center', marginTop: 12 },

  // Buttons
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24,
  },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.black },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
