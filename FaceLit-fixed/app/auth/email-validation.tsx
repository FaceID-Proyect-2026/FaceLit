// ─────────────────────────────────────────────
//  app/auth/email-validation.tsx
//  Solo VISTA — toda la lógica de negocio vive en
//  features/auth/hooks/useVerificationCode.ts
//  (el mismo hook compartido con verify-identity.tsx)
// ─────────────────────────────────────────────
import GradientBackground from '@/shared/components/layout/GradientBackground';
import { AppButton, InputField } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { formatTime, useVerificationCode } from '@/features/auth/hooks/useVerificationCode';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ── Constante de presentación (código de demo mostrado en pantalla) ──
const CODE_MOCK = '123456';

// ─── Sub-component: Timer badge (vista pura) ──
function TimerBadge({ timeLeft }: { timeLeft: number }) {
  const { t } = useTranslation();
  const color = timeLeft > 60 ? Colors.warning : Colors.error;

  return (
    <View style={[badge.wrap, { backgroundColor: color }]}>
      <Ionicons name="alarm-outline" size={14} color={Colors.white} />
      <Text style={badge.text}>
        {t('emailValidation.timerLabel')}{formatTime(timeLeft)}
      </Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'center', marginBottom: 14 },
  text: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});

// ─── Sub-component: Demo box (vista pura) ─────
function DemoBox() {
  const { t }     = useTranslation();
  const { theme } = useTheme();

  return (
    <View style={[demo.wrap, { backgroundColor: theme.border }]}>
      <Ionicons name="information-circle-outline" size={13} color={theme.textMuted} />
      <Text style={[demo.text, { color: theme.textMuted }]}>
        {t('emailValidation.demoText')}{' '}
        <Text style={{ fontWeight: FontWeight.extrabold, color: theme.primary }}>
          {CODE_MOCK}
        </Text>
      </Text>
    </View>
  );
}

const demo = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, padding: 10, borderRadius: 8 },
  text: { fontSize: FontSize.sm },
});

// ─── Sub-component: Modal de éxito (vista pura) ──
function SuccessModal({ visible, email, onContinue }: {
  visible: boolean;
  email: string;
  onContinue: () => void;
}) {
  const { t }     = useTranslation();
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={m.overlay}>
        <View style={[m.card, { backgroundColor: theme.card }]}>

          <View style={[m.iconCircle, { borderColor: theme.primary }]}>
            <Ionicons name="checkmark-circle" size={72} color={theme.primary} />
          </View>

          <Text style={[m.title, { color: theme.text }]}>
            {t('emailValidatedSuccess.title')}
          </Text>

          <View style={[m.emailBadge, { backgroundColor: theme.primaryFaint, borderColor: theme.primary }]}>
            <Ionicons name="mail-open-outline" size={16} color={theme.primary} />
            <Text style={[m.emailText, { color: theme.primary }]}>
              {email || 'correo@ejemplo.com'}
            </Text>
          </View>

          <Text style={[m.subtitle, { color: theme.textMuted }]}>
            {t('emailValidatedSuccess.subtitle')}
          </Text>

          <View style={[m.divider, { backgroundColor: theme.border }]} />

          <AppButton
            title={t('emailValidatedSuccess.btn')}
            onPress={onContinue}
            fullWidth={false}
            style={m.btn}
          />

        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%', maxWidth: 420, borderRadius: 26,
    paddingHorizontal: 32, paddingVertical: 40,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 12,
  },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 16, lineHeight: 32 },
  emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16 },
  emailText:  { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  subtitle:   { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  divider:    { width: '80%', height: 1, marginBottom: 24 },
  btn:        { width: '70%', borderRadius: 14 },
});

// ─── Screen ───────────────────────────────────
export default function EmailValidationScreen() {
  const { t }     = useTranslation();
  const { theme } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  // ── Estado puramente de UI (no es lógica de negocio) ──
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Toda la lógica de negocio viene del hook COMPARTIDO ──
  // (el mismo que usa verify-identity.tsx — antes esta pantalla
  // tenía su propio hook local duplicado, ya se unificó)
  const {
    code, setCode, timeLeft, expired,
    error, handleResend, handleVerify,
  } = useVerificationCode({
    namespace: 'emailValidation',
    codeMock: CODE_MOCK,
    checkExpired: true, // email-validation SÍ bloquea el botón al expirar (a diferencia de verify-identity)
    onVerified: () => setShowSuccess(true), // ← abre el modal en vez de navegar directo
  });

  const handleContinue = () => {
    setShowSuccess(false);
    router.push({ pathname: '/auth/register' as any, params: { validatedEmail: email } });
  };

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.card, { backgroundColor: theme.card }]}>

          {/* Volver */}
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={16} color={theme.primary} />
            <Text style={[s.backText, { color: theme.primary }]}>
              {t('emailValidation.backBtn')}
            </Text>
          </TouchableOpacity>

          {/* Ícono */}
          <View style={[s.clockCircle, { borderColor: theme.primary }]}>
            <Ionicons name="timer-outline" size={54} color={theme.primary} />
          </View>

          {/* Título */}
          <Text style={[s.title, { color: theme.text }]}>
            {t('emailValidation.title')}
          </Text>

          {/* Subtítulo + email */}
          <Text style={[s.subtitle, { color: theme.textMuted }]}>
            {t('emailValidation.subtitle')}
          </Text>
          <Text style={[s.emailText, { color: theme.primary }]}>
            {email || 'correo@ejemplo.com'}
          </Text>

          {/* Timer */}
          <TimerBadge timeLeft={timeLeft} />

          {/* Reenviar */}
          <TouchableOpacity style={s.resendBtn} onPress={handleResend}>
            <Text style={[s.resendText, { color: theme.primary }]}>
              {t('emailValidation.resendBtn')}
            </Text>
          </TouchableOpacity>

          {/* Input código */}
          <InputField
            label={t('emailValidation.inputLabel')}
            value={code}
            onChangeText={setCode}
            placeholder={t('emailValidation.placeholder')}
            keyboardType="number-pad"
            maxLength={6}
            error={error}
            style={s.codeInputText}
          />

          <Text style={[s.hint, { color: theme.textMuted }]}>
            {t('emailValidation.hint')}
          </Text>

          {/* Botón verificar */}
          <AppButton
            title={t('emailValidation.verifyBtn')}
            onPress={handleVerify}
            disabled={expired}
          />

          {/* Demo */}
          <DemoBox />

        </View>
      </ScrollView>

      {/* Modal de éxito — aparece encima de todo al verificar */}
      <SuccessModal
        visible={showSuccess}
        email={email}
        onContinue={handleContinue}
      />
    </GradientBackground>
  );
}

// ─── Styles (solo presentación) ───────────────
const s = StyleSheet.create({
  scroll: {
    flexGrow: 1, alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32, paddingHorizontal: 20,
  },
  card: {
    width: '100%', maxWidth: 900, borderRadius: 26,
    paddingHorizontal: 24, paddingVertical: 28,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18, shadowRadius: 18, elevation: 8,
  },
  backBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText:    { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  clockCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  title:       { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  subtitle:    { fontSize: FontSize.base, textAlign: 'center', lineHeight: 20 },
  emailText:   { fontSize: FontSize.base, textAlign: 'center', fontWeight: FontWeight.bold, textDecorationLine: 'underline', marginBottom: 20, marginTop: 4 },
  resendBtn:   { alignSelf: 'center', marginBottom: 26 },
  resendText:  { fontWeight: FontWeight.bold, textDecorationLine: 'underline', fontSize: FontSize.base },
  codeInputText: { textAlign: 'center', fontSize: 24, letterSpacing: 10 },
  hint:        { fontSize: FontSize.sm, marginTop: 8, marginBottom: 22 },
});
