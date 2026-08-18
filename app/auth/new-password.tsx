// ─────────────────────────────────────────────
//  app/auth/new-password.tsx
// ─────────────────────────────────────────────
import { useNewPasswordForm } from '@/features/auth/hooks/useNewPasswordForm';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Sub-component: Modal de éxito (antes era password-reset-done.tsx) ──
function SuccessModal({ visible, onContinue, isDark }: { visible: boolean; onContinue: () => void; isDark: boolean }) {
  const { t } = useTranslation();
  const palette = isDark ? Colors.dark : Colors.light;

  const SECURITY_ITEMS = [
    t('passwordResetDone.security.item1'),
    t('passwordResetDone.security.item2'),
    t('passwordResetDone.security.item3'),
    t('passwordResetDone.security.item4'),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={m.overlay}>
        <View
          style={[
            m.card,
            {
              backgroundColor: palette.surface,
              borderColor: `${Colors.primary}38`,
            },
          ]}
        >
          <View style={m.iconWrapper}>
            <Image source={require('@/assets/images/check.png')} style={m.imagen} resizeMode="contain" />
          </View>

          <Text style={[m.title, { color: palette.text }]}>{t('passwordResetDone.title')}</Text>
          <Text style={[m.subtitle, { color: palette.textSecondary }]}>{t('passwordResetDone.subtitle1')}</Text>
          <Text style={[m.subtitle2, { color: palette.textSecondary }]}>{t('passwordResetDone.subtitle2')}</Text>

          <View style={[m.securityLog, { backgroundColor: palette.inputBg, borderColor: palette.border }]}>
            <Text style={[m.securityTitle, { color: palette.link }]}>{t('passwordResetDone.securityTitle')}</Text>
            {SECURITY_ITEMS.map((item) => (
              <Text key={item} style={[m.securityItem, { color: palette.text }]}>{item}</Text>
            ))}
          </View>

          <TouchableOpacity style={m.btn} onPress={onContinue} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]} style={m.btnGradient}>
              <Text style={m.btnText}>{t('passwordResetDone.loginBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 420, borderRadius: 26, paddingHorizontal: 28, paddingVertical: 34, borderWidth: 1, alignItems: 'center' },
  iconWrapper: { marginBottom: 18 },
  imagen: { width: 90, height: 90 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 4, lineHeight: 19 },
  subtitle2: { fontSize: 13, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  securityLog: { width: '100%', borderRadius: 14, padding: 16, marginBottom: 22, borderWidth: 1 },
  securityTitle: { fontWeight: '800', fontSize: 13, marginBottom: 8 },
  securityItem: { fontSize: 12, marginBottom: 5, lineHeight: 17 },
  btn: { width: '80%', borderRadius: 16, overflow: 'hidden' },
  btnGradient: { paddingVertical: 13, alignItems: 'center' },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});

// ─── Screen ────────────────────────────────────
export default function NewPasswordScreen() {
  const { t } = useTranslation();
  const { isDark, theme } = useTheme();
  const palette = isDark ? Colors.dark : Colors.light;

  const {
    password, confirmPassword, errors, requirements, loading, showSuccess,
    setPassword, setConfirmPassword, handleSubmit,
  } = useNewPasswordForm();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const text = palette.text;
  const muted = palette.textSecondary;
  const cardBg = palette.surface;
  const inputBg = palette.inputBg;
  const inputBorder = palette.inputBorder;
  const errorColor = Colors.error;

  const handleModalContinue = () => {
    router.replace(Routes.AUTH.LOGIN as any);
  };

  return (
    <LinearGradient
      colors={palette.gradient}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={[s.arcTop, { backgroundColor: isDark ? `${Colors.primary}14` : `${Colors.primary}38` }]} />
      <View style={[s.arcBottom, { backgroundColor: isDark ? `${Colors.primary}38` : `${Colors.primary}47` }]} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.card, { backgroundColor: cardBg, shadowColor: isDark ? Colors.black : Colors.primaryDark }]}>

            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Text style={s.backText}>{t('newPassword.backBtn')}</Text>
            </TouchableOpacity>

            <View style={s.iconWrapper}>
              <Image source={require('@/assets/images/candado.png')} style={s.image} resizeMode="contain" />
            </View>

            <Text style={[s.title, { color: text }]}>{t('newPassword.title')}</Text>
            <Text style={[s.subtitle, { color: muted }]}>{t('newPassword.subtitle')}</Text>

            <View style={[s.requirements, { backgroundColor: isDark ? `${Colors.primary}14` : Colors.primaryFaint }]}>
              <Text style={[s.reqTitle, { color: theme.primary }]}>{t('newPassword.reqTitle')}</Text>
              {requirements.map((req) => (
                <View key={req.key} style={s.reqRow}>
                  <Ionicons
                    name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={req.met ? theme.primary : palette.placeholder}
                  />
                  <Text style={[s.reqItem, { color: req.met ? theme.primary : palette.placeholder }]}>
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: text }]}>{t('newPassword.passwordLabel')}</Text>
            <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: errors.password ? errorColor : inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={18} color={palette.placeholder} />
              <TextInput
                style={[s.input, { color: text }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('newPassword.passwordPlaceholder')}
                placeholderTextColor={palette.placeholder}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.code ? (
              <View style={{ backgroundColor: `${Colors.error}1A`, borderWidth: 1, borderColor: Colors.error, borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <Text style={{ color: Colors.error, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                  {errors.code}
                </Text>
              </View>
            ) : null}

            <Text style={[s.fieldLabel, { color: text }]}>{t('newPassword.confirmLabel')}</Text>
            <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: errors.confirm ? errorColor : inputBorder }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={palette.placeholder} />
              <TextInput
                style={[s.input, { color: text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('newPassword.confirmPlaceholder')}
                placeholderTextColor={palette.placeholder}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} activeOpacity={0.7}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.placeholder} />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={[s.errorText, { color: errorColor }]}>{errors.confirm}</Text> : null}

            <TouchableOpacity style={s.button} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]} style={s.buttonGradient}>
                <Text style={s.buttonText}>
                  {loading ? (t('newPassword.submitting') ?? 'Guardando...') : t('newPassword.submitBtn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>

      <SuccessModal visible={showSuccess} onContinue={handleModalContinue} isDark={isDark} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  arcTop: { position: 'absolute', width: 300, height: 420, right: -120, top: -90, borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120, bottom: -30, borderRadius: 180 },
  card: { width: '100%', maxWidth: 750, borderRadius: 26, paddingHorizontal: 40, paddingVertical: 60, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  backBtn: { marginBottom: 18 },
  backText: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  iconWrapper: { alignItems: 'center', marginBottom: 16 },
  image: { width: 95, height: 95 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  requirements: { borderRadius: 14, padding: 16, marginBottom: 22 },
  reqTitle: { fontWeight: '800', fontSize: 13, marginBottom: 10 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reqItem: { fontSize: 13 },
  fieldLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderRadius: 14, paddingHorizontal: 14, marginBottom: 6, gap: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  errorText: { fontSize: 12, marginBottom: 12 },
  button: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  buttonGradient: { paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
});