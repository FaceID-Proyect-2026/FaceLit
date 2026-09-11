// ─────────────────────────────────────────────
//  app/auth/verify-identity.tsx
//  RF-1.5 — Paso 2: verificación del código de 6 dígitos
//  RNF-1.9 — Seguridad del restablecimiento
// ─────────────────────────────────────────────
import { formatTime, useVerificationCode } from '@/features/auth/hooks/useVerificationCode';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { requestRecovery, verifyCode } from '@/shared/services/passwordRecoveryService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyIdentityScreen() {
  const { t } = useTranslation();
  const { isDark, theme } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const {
    code, setCode,
    timeLeft, expired, exhausted,
    error, loading, resending, resendCooldown,
    handleResend, handleVerify,
  } = useVerificationCode({
    namespace: 'verifyIdentity',
    checkExpired: false, // la expiración real la valida el mock/backend
    onVerify: async (enteredCode) => {
      // Llama al servicio que valida el código y devuelve un token
      const { token } = await verifyCode(email, enteredCode);
      // Navega a nueva contraseña pasando el token y el email
      router.push({
        pathname: Routes.AUTH.NEW_PASSWORD as any,
        params: { token, email },
      });
    },
    onResend: async () => {
      await requestRecovery(email);
    },
  });

  // Colores
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? '#CAD6C8' : '#3D5C3A';
  const cardBg = isDark ? '#07120D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#F9FFF9';
  const inputBdr = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';

  // Color del timer según urgencia
  const timerColor = timeLeft <= 60 ? Colors.error : timeLeft <= 120 ? '#E89B2C' : theme.primary;
  const timerBg = timeLeft <= 60 ? Colors.error + '1A' : timeLeft <= 120 ? '#E89B2C1A' : theme.primary + '1A';

  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={[s.arcTop, { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
      <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <View style={[s.card, { backgroundColor: cardBg }]}>

              {/* ── Volver ── */}
              {/* ── Volver ── */}
              <TouchableOpacity
                onPress={() => router.push(Routes.AUTH.PASSWORD_RECOVERY as any)}
                style={s.backRow}
                activeOpacity={0.7}
              >
                <Text style={[s.backText, { color: theme.primary }]}>{t('verifyIdentity.backBtn')}</Text>
              </TouchableOpacity>

              {/* ── Ícono reloj ── */}
              <View style={s.iconWrap}>
                <View style={[s.iconCircle, { borderColor: timerColor + '55', backgroundColor: timerColor + '14' }]}>
                  <Ionicons name="time-outline" size={38} color={timerColor} />
                </View>
              </View>

              {/* ── Título ── */}
              <Text style={[s.title, { color: text }]}>{t('verifyIdentity.title')}</Text>
              <Text style={[s.subtitle, { color: muted }]}>{t('verifyIdentity.subtitle')}</Text>
              <Text style={[s.emailLabel, { color: theme.primary }]} numberOfLines={1}>{email}</Text>

              {/* ── Timer ── */}
              <View style={[s.timerBadge, { backgroundColor: timerBg, borderColor: timerColor + '55' }]}>
                <Ionicons name="hourglass-outline" size={14} color={timerColor} />
                <Text style={[s.timerText, { color: timerColor }]}>
                  {expired
                    ? t('verifyIdentity.timerExpired')
                    : `${t('verifyIdentity.timerLabel')}${formatTime(timeLeft)}`
                  }
                </Text>
              </View>

              {/* ── Estado: intentos agotados ── */}
              {exhausted && (
                <View style={[s.alertBox, { backgroundColor: Colors.error + '1A', borderColor: Colors.error + '55' }]}>
                  <Ionicons name="warning-outline" size={16} color={Colors.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.alertTitle, { color: Colors.error }]}>{t('verifyIdentity.exhaustedTitle')}</Text>
                    <Text style={[s.alertMsg, { color: Colors.error }]}>{t('verifyIdentity.exhaustedMsg')}</Text>
                  </View>
                </View>
              )}

              {/* ── Campo de código ── */}
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: text }]}>{t('verifyIdentity.inputLabel')}</Text>
                <TextInput
                  style={[
                    s.codeInput,
                    {
                      color: text,
                      backgroundColor: inputBg,
                      borderColor: error ? Colors.error : expired || exhausted ? Colors.error + '66' : inputBdr,
                    },
                  ]}
                  value={code}
                  onChangeText={setCode}
                  placeholder={t('verifyIdentity.placeholder')}
                  placeholderTextColor={isDark ? '#4A6A50' : '#AAAAAA'}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading && !expired && !exhausted}
                  autoFocus
                />
                {error
                  ? <Text style={[s.errorText, { color: Colors.error }]}>{error}</Text>
                  : <Text style={[s.hintText, { color: muted }]}>{t('verifyIdentity.hint')}</Text>
                }
              </View>

              {/* ── Botón verificar ── */}
              <TouchableOpacity
                style={[s.verifyBtn, (loading || expired || exhausted) && s.btnDisabled]}
                onPress={handleVerify}
                disabled={loading || expired || exhausted}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#72C96D', '#65B361', '#4FA14B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.verifyBtnGradient}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  }
                  <Text style={s.verifyBtnText}>
                    {loading ? t('verifyIdentity.verifyingBtn') : t('verifyIdentity.verifyBtn')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Reenviar código ── */}
              <View style={s.resendWrap}>
                <TouchableOpacity
                  style={[
                    s.resendBtn,
                    {
                      borderColor: resendCooldown > 0 || resending
                        ? theme.primary + '44'
                        : theme.primary,
                      backgroundColor: resendCooldown > 0 || resending
                        ? theme.primary + '0A'
                        : theme.primary + '14',
                    },
                  ]}
                  onPress={handleResend}
                  disabled={resending || resendCooldown > 0}
                  activeOpacity={0.8}
                >
                  {resending
                    ? <ActivityIndicator size="small" color={theme.primary} />
                    : <Ionicons name="refresh-outline" size={15} color={theme.primary} />
                  }
                  <Text style={[s.resendText, { color: theme.primary, opacity: resendCooldown > 0 || resending ? 0.6 : 1 }]}>
                    {resending
                      ? t('verifyIdentity.resendingBtn')
                      : resendCooldown > 0
                        ? t('verifyIdentity.resendAvailable', { seconds: resendCooldown })
                        : t('verifyIdentity.resendBtn')
                    }
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  arcTop: { position: 'absolute', width: 300, height: 420, right: -120, top: -90, borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120, bottom: -30, borderRadius: 180 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 },

  card: {
    width: '100%', maxWidth: 460,
    borderRadius: 26, paddingHorizontal: 24, paddingVertical: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 6,
  },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { fontSize: 13, fontWeight: '700' },

  iconWrap: { alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emailLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', textDecorationLine: 'underline', marginTop: 4, marginBottom: 16 },

  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'center', marginBottom: 16 },
  timerText: { fontSize: 13, fontWeight: '700' },

  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  alertTitle: { fontSize: 13, fontWeight: '800' },
  alertMsg: { fontSize: 12, lineHeight: 18, marginTop: 2 },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  codeInput: {
    borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 16, textAlign: 'center',
    fontSize: 28, fontWeight: '800', letterSpacing: 10,
  },
  errorText: { color: Colors.error, fontSize: 12, fontWeight: '700', marginTop: 5 },
  hintText: { fontSize: 12, marginTop: 5, textAlign: 'center' },

  verifyBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  verifyBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  verifyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },

  resendWrap: { alignItems: 'center' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  resendText: { fontSize: 13, fontWeight: '700' },
});
