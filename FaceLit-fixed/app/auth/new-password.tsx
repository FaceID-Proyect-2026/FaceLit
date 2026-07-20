// ─────────────────────────────────────────────
//  app/auth/new-password.tsx
// ─────────────────────────────────────────────
import { useNewPasswordForm } from '@/features/auth/hooks/useNewPasswordForm';
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
function SuccessModal({ visible, onContinue }: { visible: boolean; onContinue: () => void }) {
  const { t } = useTranslation();

  const SECURITY_ITEMS = [
    t('passwordResetDone.security.item1'),
    t('passwordResetDone.security.item2'),
    t('passwordResetDone.security.item3'),
    t('passwordResetDone.security.item4'),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={m.overlay}>
        <View style={m.card}>
          <View style={m.iconWrapper}>
            <Image source={require('@/assets/images/check.png')} style={m.imagen} resizeMode="contain" />
          </View>

          <Text style={m.title}>{t('passwordResetDone.title')}</Text>
          <Text style={m.subtitle}>{t('passwordResetDone.subtitle1')}</Text>
          <Text style={m.subtitle2}>{t('passwordResetDone.subtitle2')}</Text>

          <View style={m.securityLog}>
            <Text style={m.securityTitle}>{t('passwordResetDone.securityTitle')}</Text>
            {SECURITY_ITEMS.map((item) => (
              <Text key={item} style={m.securityItem}>{item}</Text>
            ))}
          </View>

          <TouchableOpacity style={m.btn} onPress={onContinue} activeOpacity={0.85}>
            <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={m.btnGradient}>
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
  card: { width: '100%', maxWidth: 420, backgroundColor: '#07120D', borderRadius: 26, paddingHorizontal: 28, paddingVertical: 34, borderWidth: 1, borderColor: 'rgba(101,179,97,0.22)', alignItems: 'center' },
  iconWrapper: { marginBottom: 18 },
  imagen: { width: 90, height: 90 },
  title: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 13, color: '#CAD6C8', textAlign: 'center', marginBottom: 4, lineHeight: 19 },
  subtitle2: { fontSize: 13, color: '#CAD6C8', textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  securityLog: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  securityTitle: { color: '#7ED957', fontWeight: '800', fontSize: 13, marginBottom: 8 },
  securityItem: { color: '#FFFFFF', fontSize: 12, marginBottom: 5, lineHeight: 17 },
  btn: { width: '80%', borderRadius: 16, overflow: 'hidden' },
  btnGradient: { paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

// ─── Screen ────────────────────────────────────
export default function NewPasswordScreen() {
  const { t }             = useTranslation();
  const { isDark, theme } = useTheme();

  const {
    password, confirmPassword, errors, requirements, loading, showSuccess,
    setPassword, setConfirmPassword, handleSubmit,
  } = useNewPasswordForm();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);

  const text        = isDark ? '#FFFFFF' : '#000000';
  const muted       = isDark ? '#CAD6C8' : '#1E1E1E';
  const cardBg      = isDark ? '#07120D' : '#FFFFFF';
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.78)' : '#BBBBBB';
  const errorColor  = '#D92027';

  const handleModalContinue = () => {
    router.replace(Routes.AUTH.LOGIN as any);
  };

  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={[s.arcTop,    { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
      <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={[s.card, { backgroundColor: cardBg, shadowColor: isDark ? '#000000' : '#1C3A1D' }]}>

            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Text style={s.backText}>{t('newPassword.backBtn')}</Text>
            </TouchableOpacity>

            <View style={s.iconWrapper}>
              <Image source={require('@/assets/images/candado.png')} style={s.image} resizeMode="contain" />
            </View>

            <Text style={[s.title,    { color: text  }]}>{t('newPassword.title')}</Text>
            <Text style={[s.subtitle, { color: muted }]}>{t('newPassword.subtitle')}</Text>

            <View style={[s.requirements, { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.10)' }]}>
              <Text style={[s.reqTitle, { color: theme.primary }]}>{t('newPassword.reqTitle')}</Text>
              {requirements.map((req) => (
                <View key={req.key} style={s.reqRow}>
                  <Ionicons
                    name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={req.met ? theme.primary : isDark ? '#4A5E49' : '#AAAAAA'}
                  />
                  <Text style={[s.reqItem, { color: req.met ? theme.primary : isDark ? '#7A8A78' : '#888888' }]}>
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: text }]}>{t('newPassword.passwordLabel')}</Text>
            <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: errors.password ? errorColor : inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={18} color={isDark ? '#7A8A78' : '#999999'} />
              <TextInput
                style={[s.input, { color: text }]}
                value={password}
                onChangeText={setPassword}
                placeholder={t('newPassword.passwordPlaceholder')}
                placeholderTextColor={isDark ? '#AEB6C2' : '#AAAAAA'}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#7A8A78' : '#999999'} />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}

            <Text style={[s.fieldLabel, { color: text }]}>{t('newPassword.confirmLabel')}</Text>
            <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: errors.confirm ? errorColor : inputBorder }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? '#7A8A78' : '#999999'} />
              <TextInput
                style={[s.input, { color: text }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('newPassword.confirmPlaceholder')}
                placeholderTextColor={isDark ? '#AEB6C2' : '#AAAAAA'}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} activeOpacity={0.7}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#7A8A78' : '#999999'} />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={s.errorText}>{errors.confirm}</Text> : null}

            <TouchableOpacity style={s.button} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={s.buttonGradient}>
                <Text style={s.buttonText}>
                  {loading ? (t('newPassword.submitting') ?? 'Guardando...') : t('newPassword.submitBtn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>

      <SuccessModal visible={showSuccess} onContinue={handleModalContinue} />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120,  bottom: -30, borderRadius: 180 },
  card: { width: '100%', maxWidth: 750, borderRadius: 26, paddingHorizontal: 40, paddingVertical: 60, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  backBtn:     { marginBottom: 18 },
  backText:    { color: '#65B361', fontSize: 14, fontWeight: '700' },
  iconWrapper: { alignItems: 'center', marginBottom: 16 },
  image:       { width: 95, height: 95 },
  title:       { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:    { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  requirements: { borderRadius: 14, padding: 16, marginBottom: 22 },
  reqTitle:     { fontWeight: '800', fontSize: 13, marginBottom: 10 },
  reqRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  reqItem:      { fontSize: 13 },
  fieldLabel:   { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderRadius: 14, paddingHorizontal: 14, marginBottom: 6, gap: 10 },
  input:          { flex: 1, paddingVertical: 14, fontSize: 15 },
  errorText:      { color: '#D92027', fontSize: 12, marginBottom: 12 },
  button:         { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  buttonGradient: { paddingVertical: 12, alignItems: 'center' },
  buttonText:     { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});