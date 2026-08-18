// ─────────────────────────────────────────────
//  app/auth/email-validation.tsx
// ─────────────────────────────────────────────
import { formatTime, useVerificationCode } from '@/features/auth/hooks/useVerificationCode';
import GradientBackground from '@/shared/components/layout/GradientBackground';
import { AppButton, InputField } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { resendCode, verifyEmail } from '@/shared/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ─── Sub-component: Timer badge ───────────────
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

// ─── Sub-component: Modal de éxito ────────────
function SuccessModal({ visible, email, onContinue }: {
  visible: boolean;
  email: string;
  onContinue: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
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
          <AppButton title={t('emailValidatedSuccess.btn')} onPress={onContinue} fullWidth={false} style={m.btn} />
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 26, paddingHorizontal: 32, paddingVertical: 40, alignItems: 'center', shadowColor: Colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 16, lineHeight: 32 },
  emailBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 16 },
  emailText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  subtitle: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  divider: { width: '80%', height: 1, marginBottom: 24 },
  btn: { width: '70%', borderRadius: 14 },
});

// ─── Screen ───────────────────────────────────
export default function EmailValidationScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { email, idUser } = useLocalSearchParams<{ email: string; idUser: string }>();

  const [showSuccess, setShowSuccess] = useState(false);
  // Guardamos si el resultado indica menor de edad, para saber a dónde navegar después del modal
  const [isMinor, setIsMinor] = useState(false);

  const {
    code, setCode, timeLeft, expired,
    error, loading, resending, resendCooldown, handleResend, handleVerify,
  } = useVerificationCode({
    namespace: 'emailValidation',
    checkExpired: true,
    onVerify: async (code) => {
      const result = await verifyEmail(idUser, code);
      // result.status = 'EMAIL_VERIFIED' | 'MINOR_AGE_REDIRECT'
      setIsMinor(result.status === 'MINOR_AGE_REDIRECT');
      setShowSuccess(true);
    },
    onResend: async () => {
      await resendCode(idUser);
    },
  });

  const handleContinue = () => {
    setShowSuccess(false);
    if (isMinor) {
      // Menor de edad → falta el consentimiento del acudiente
      router.replace({ pathname: Routes.AUTH.MINOR_CONSENT as any, params: { minorEmail: email, idUser } });
    } else {

      // Mayor de edad → ya verificó su correo → va a registrar el  rostro del menor de edad
      router.replace(Routes.AUTH.TEENAGER_REGISTRATION as any);
    }
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[s.card, { backgroundColor: theme.card }]}>

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={16} color={theme.primary} />
            <Text style={[s.backText, { color: theme.primary }]}>{t('emailValidation.backBtn')}</Text>
          </TouchableOpacity>

          <View style={[s.clockCircle, { borderColor: theme.primary }]}>
            <Ionicons name="timer-outline" size={54} color={theme.primary} />
          </View>

          <Text style={[s.title, { color: theme.text }]}>{t('emailValidation.title')}</Text>

          <Text style={[s.subtitle, { color: theme.textMuted }]}>{t('emailValidation.subtitle')}</Text>
          <Text style={[s.emailText, { color: theme.primary }]}>{email || 'correo@ejemplo.com'}</Text>

          <TimerBadge timeLeft={timeLeft} />

          <TouchableOpacity style={s.resendBtn} onPress={handleResend} disabled={resending || resendCooldown > 0}>
            <Text
              style={[
                s.resendText,
                {
                  color: theme.link,
                  opacity: (resending || resendCooldown > 0) ? 0.5 : 1,
                },
              ]}
            >
              {resendCooldown > 0
                ? `Disponible en ${resendCooldown}s`
                : resending
                  ? t('verifyIdentity.resending') ?? 'Reenviando...'
                  : t('verifyIdentity.resendBtn')}
            </Text>
          </TouchableOpacity>
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

          <Text style={[s.hint, { color: theme.textMuted }]}>{t('emailValidation.hint')}</Text>

          <AppButton
            title={loading ? (t('emailValidation.verifying') ?? 'Verificando...') : t('emailValidation.verifyBtn')}
            onPress={handleVerify}
            disabled={expired || loading}
          />

        </View>
      </ScrollView>

      <SuccessModal visible={showSuccess} email={email} onContinue={handleContinue} />
    </GradientBackground>
  );
}

// ─── Styles ────────────────────────────────────
const s = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 900, borderRadius: 26, paddingHorizontal: 24, paddingVertical: 28, shadowColor: Colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  clockCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 20 },
  emailText: { fontSize: FontSize.base, textAlign: 'center', fontWeight: FontWeight.bold, textDecorationLine: 'underline', marginBottom: 20, marginTop: 4 },
  resendBtn: { alignSelf: 'center', marginBottom: 26 },
  resendText: { fontWeight: FontWeight.bold, textDecorationLine: 'underline', fontSize: FontSize.base },
  codeInputText: { textAlign: 'center', fontSize: 24, letterSpacing: 10 },
  hint: { fontSize: FontSize.sm, marginTop: 8, marginBottom: 22 },
});