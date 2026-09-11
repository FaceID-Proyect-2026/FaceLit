// ─────────────────────────────────────────────
//  app/auth/new-password.tsx
//  RF-1.5 — Paso 3: establecer nueva contraseña
//  RNF-1.2 — Política de contraseñas
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
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Modal de éxito ────────────────────────────
function SuccessModal({ visible, onContinue, isDark }: {
  visible: boolean;
  onContinue: () => void;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const bg   = isDark ? '#07120D' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted= isDark ? '#CAD6C8' : '#3D5C3A';

  const ITEMS = [
    t('passwordResetDone.security.item1'),
    t('passwordResetDone.security.item2'),
    t('passwordResetDone.security.item3'),
    t('passwordResetDone.security.item4'),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={sm.overlay}>
        <View style={[sm.card, { backgroundColor: bg }]}>

          {/* Ícono */}
          <View style={sm.iconWrap}>
            <Image source={require('@/assets/images/check.png')} style={sm.icon} resizeMode="contain" />
          </View>

          <Text style={[sm.title,    { color: text  }]}>{t('passwordResetDone.title')}</Text>
          <Text style={[sm.subtitle, { color: muted }]}>{t('passwordResetDone.subtitle1')}</Text>
          <Text style={[sm.subtitle, { color: muted, marginBottom: 18 }]}>{t('passwordResetDone.subtitle2')}</Text>

          {/* Registro de seguridad */}
          <View style={[sm.log, { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.06)', borderColor: 'rgba(101,179,97,0.25)' }]}>
            <Text style={sm.logTitle}>{t('passwordResetDone.securityTitle')}</Text>
            {ITEMS.map((item, i) => (
              <Text key={i} style={[sm.logItem, { color: muted }]}>{item}</Text>
            ))}
          </View>

          <TouchableOpacity style={sm.btn} onPress={onContinue} activeOpacity={0.85}>
            <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={sm.btnGradient}>
              <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
              <Text style={sm.btnText}>{t('passwordResetDone.loginBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const sm = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card:      { width: '100%', maxWidth: 420, borderRadius: 26, paddingHorizontal: 26, paddingVertical: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  iconWrap:  { marginBottom: 16 },
  icon:      { width: 80, height: 80 },
  title:     { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:  { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  log:       { width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  logTitle:  { fontSize: 12, fontWeight: '800', color: '#65B361', marginBottom: 8 },
  logItem:   { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  btn:       { width: '85%', borderRadius: 14, overflow: 'hidden' },
  btnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  btnText:   { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

// ── Screen ────────────────────────────────────
export default function NewPasswordScreen() {
  const { t }           = useTranslation();
  const { isDark, theme } = useTheme();

  const {
    password, confirmPassword,
    errors, requirements, loading, showSuccess,
    setPassword, setConfirmPassword, handleSubmit,
  } = useNewPasswordForm();

  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const text    = isDark ? '#FFFFFF' : '#111111';
  const muted   = isDark ? '#CAD6C8' : '#3D5C3A';
  const cardBg  = isDark ? '#07120D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#F9FFF9';
  const inputBdr= isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';

  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={[s.arcTop,    { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
      <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={[s.card, { backgroundColor: cardBg }]}>

            {/* ── Volver ── */}
            <TouchableOpacity onPress={() => router.back()} style={s.backRow} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={16} color={theme.primary} />
              <Text style={[s.backText, { color: theme.primary }]}>{t('newPassword.backBtn')}</Text>
            </TouchableOpacity>

            {/* ── Ícono ── */}
            <View style={s.iconWrap}>
              <Image source={require('@/assets/images/candado.png')} style={s.icon} resizeMode="contain" />
            </View>

            {/* ── Título ── */}
            <Text style={[s.title,    { color: text  }]}>{t('newPassword.title')}</Text>
            <Text style={[s.subtitle, { color: muted }]}>{t('newPassword.subtitle')}</Text>

            {/* ── Indicadores de requisitos ── */}
            <View style={[s.reqBox, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '33' }]}>
              <Text style={[s.reqTitle, { color: theme.primary }]}>{t('newPassword.reqTitle')}</Text>
              {requirements.map(req => (
                <View key={req.key} style={s.reqRow}>
                  <Ionicons
                    name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={req.met ? theme.primary : isDark ? '#4A6A50' : '#AAAAAA'}
                  />
                  <Text style={[s.reqText, { color: req.met ? theme.primary : isDark ? '#6A8A70' : '#999999' }]}>
                    {req.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── Error de token (código expirado / usado / inválido) ── */}
            {errors.code ? (
              <View style={[s.tokenError, { backgroundColor: Colors.error + '1A', borderColor: Colors.error + '55' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={[s.tokenErrorText, { color: Colors.error }]}>{errors.code}</Text>
              </View>
            ) : null}

            {/* ── Nueva contraseña ── */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: text }]}>{t('newPassword.passwordLabel')}</Text>
              <View style={[s.inputRow, {
                backgroundColor: inputBg,
                borderColor: errors.password ? Colors.error : inputBdr,
              }]}>
                <Ionicons name="lock-closed-outline" size={18} color={muted} />
                <TextInput
                  style={[s.input, { color: text }] as any}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('newPassword.passwordPlaceholder')}
                  placeholderTextColor={isDark ? '#4A6A50' : '#AAAAAA'}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPwd(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color={muted} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
            </View>

            {/* ── Confirmar contraseña ── */}
            <View style={s.fieldGroup}>
              <Text style={[s.label, { color: text }]}>{t('newPassword.confirmLabel')}</Text>
              <View style={[s.inputRow, {
                backgroundColor: inputBg,
                borderColor: errors.confirm ? Colors.error : inputBdr,
              }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={muted} />
                <TextInput
                  style={[s.input, { color: text }] as any}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t('newPassword.confirmPlaceholder')}
                  placeholderTextColor={isDark ? '#4A6A50' : '#AAAAAA'}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={muted} />
                </TouchableOpacity>
              </View>
              {errors.confirm ? <Text style={s.errorText}>{errors.confirm}</Text> : null}
            </View>

            {/* ── Botón restablecer ── */}
            <TouchableOpacity
              style={[s.submitBtn, loading && s.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#72C96D', '#65B361', '#4FA14B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.submitBtnGradient}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
                }
                <Text style={s.submitBtnText}>
                  {loading ? t('newPassword.submittingBtn') : t('newPassword.submitBtn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>

      <SuccessModal
        visible={showSuccess}
        isDark={isDark}
        onContinue={() => router.replace(Routes.AUTH.LOGIN as any)}
      />
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left:  -120, bottom: -30, borderRadius: 180 },
  scroll:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 },

  card: {
    width: '100%', maxWidth: 500,
    borderRadius: 26, paddingHorizontal: 24, paddingVertical: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 6,
  },

  backRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 18 },
  backText: { fontSize: 13, fontWeight: '700' },

  iconWrap: { alignItems: 'center', marginBottom: 14 },
  icon:     { width: 80, height: 80 },

  title:    { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 },

  reqBox:   { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 18 },
  reqTitle: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  reqRow:   { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  reqText:  { fontSize: 13 },

  tokenError:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  tokenErrorText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  fieldGroup: { marginBottom: 14 },
  label:      { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  inputRow:   { height: 50, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input:      { flex: 1, fontSize: 15, outlineStyle: 'none' } as any,
  errorText:  { color: Colors.error, fontSize: 12, fontWeight: '700', marginTop: 5 },

  submitBtn:         { borderRadius: 14, overflow: 'hidden', marginTop: 6 },
  submitBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnDisabled:       { opacity: 0.55 },
});
