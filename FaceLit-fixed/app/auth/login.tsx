// ─────────────────────────────────────────────
//  app/auth/login.tsx — código limpio + i18n
// ─────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Dimensions, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Routes } from '@/shared/constants/routes';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useLoginForm } from '@/features/auth/hooks/useLoginForm';
import NavLink from '@/features/auth/components/NavLink';

// ── Constantes ────────────────────────────────
const { width } = Dimensions.get('window');
const CARD_MAX  = 600;
const isWide    = width >= 768;

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const router            = useRouter();
  const { form, errors, setField, handleSubmit } = useLoginForm();

  const [showPassword, setShowPassword] = useState(false);
  const [focused,      setFocused]      = useState<string | null>(null);

  // ── Colores locales ───────────────────────────
  const text        = isDark ? Colors.dark.text        : Colors.light.text;
  const muted       = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const cardBg      = isDark ? Colors.dark.surface     : Colors.white;
  const inputBg     = isDark ? Colors.dark.inputBg     : Colors.light.inputBg;
  const inputBorder = isDark ? Colors.dark.inputBorder : Colors.light.inputBorder;
  const cardBorder  = isDark ? Colors.dark.border      : Colors.light.border;

  return (
    <LinearGradient
      colors={isDark
        ? ['#000000', '#06170F', '#0B2D17']
        : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={[s.arcTop,    { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
      <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

              {/* Volver */}
              <TouchableOpacity
                onPress={() => router.push('/')}
                style={[s.backBtn, {
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(0,0,0,0.12)',
                }]}
              >
                <Ionicons name="arrow-back" size={18} color={text} />
              </TouchableOpacity>

              {/* Título */}
              <Text style={[s.title, { color: text }]}>{t('login.title')}</Text>
              <Text style={[s.subtitle, { color: muted }]}>{t('login.subtitle')}</Text>

              {/* ── Email ── */}
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: text }]}>{t('login.email')}</Text>
                <View style={[s.inputWrap, {
                  backgroundColor: inputBg,
                  borderColor: errors.email
                    ? Colors.error
                    : focused === 'email'
                    ? theme.primary
                    : inputBorder,
                }]}>
                  <Ionicons name="mail-outline" size={18} color={muted} />
                  <TextInput
                    style={[s.input, { color: text }] as any}
                    value={form.email}
                    onChangeText={v => setField('email', v)}
                    placeholder={t('login.emailPlaceholder')}
                    placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
                {errors.email
                  ? <Text style={s.errorText}>{errors.email}</Text>
                  : null}
              </View>

              {/* ── Contraseña ── */}
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: text }]}>{t('login.password')}</Text>
                <View style={[s.inputWrap, {
                  backgroundColor: inputBg,
                  borderColor: errors.password
                    ? Colors.error
                    : focused === 'password'
                    ? theme.primary
                    : inputBorder,
                }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={muted} />
                  <TextInput
                    style={[s.input, { color: text }] as any}
                    value={form.password}
                    onChangeText={v => setField('password', v)}
                    placeholder={t('login.passwordPlaceholder')}
                    placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(v => !v)}
                    style={s.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18} color={muted}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password
                  ? <Text style={s.errorText}>{errors.password}</Text>
                  : null}
              </View>

              {/* ── Política de privacidad ── */}
              <View style={[s.policyCard, {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : '#F3F8F3',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(0,0,0,0.07)',
              }]}>
                <TouchableOpacity
                  onPress={() => setField('accepted', !form.accepted)}
                  activeOpacity={0.8}
                  style={s.policyRow}
                >
                  {/* Checkbox */}
                  <View style={[s.checkbox, {
                    borderColor: errors.policy
                      ? Colors.error
                      : form.accepted
                      ? theme.primary
                      : inputBorder,
                    backgroundColor: form.accepted
                      ? theme.primary
                      : Colors.transparent,
                  }]}>
                    {form.accepted && (
                      <Ionicons name="checkmark" size={12} color={Colors.white} />
                    )}
                  </View>

                  {/* Texto en una sola línea usando flex wrap */}
                  <View style={s.policyTextWrap}>
                    <Text style={[s.policyText, { color: text }]}>
                      {t('login.policyPrefix')}{' '}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push(Routes.AUTH.PRIVACY_NOTICE as any)}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Text style={[s.policyLink, { color: theme.primary }]}>
                        {t('login.policyLink')}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[s.policyText, { color: text }]}>
                      {t('login.policySuffix')}
                    </Text>
                  </View>
                </TouchableOpacity>

                {errors.policy
                  ? <Text style={[s.errorText, { marginTop: 6, marginLeft: 30 }]}>
                      {t('login.policyError')}
                    </Text>
                  : null}
              </View>

              {/* ── Botón iniciar sesión ── */}
              <TouchableOpacity
                onPress={handleSubmit}
                style={s.loginBtn}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#72C96D', '#65B361', '#4FA14B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.loginBtnGradient}
                >
                  <Ionicons name="log-in-outline" size={18} color={Colors.white} />
                  <Text style={s.loginBtnText}>{t('login.loginBtn')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Links ── */}
              <View style={s.links}>
                <NavLink
                  href={Routes.AUTH.PASSWORD_RECOVERY}
                  label={t('login.forgotPassword')}
                />
                <View style={s.registerRow}>
                  <Text style={[s.bottomText, { color: muted }]}>
                    {t('login.noAccount')}{' '}
                  </Text>
                  <NavLink
                    href={Routes.AUTH.REGISTER}
                    label={t('login.registerLink')}
                  />
                </View>
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
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  kav:       { flex: 1 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120,  bottom: -30, borderRadius: 180 },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },

  card: {
    width: '100%',
    maxWidth: CARD_MAX,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: isWide ? 40 : 24,
    paddingVertical: 30,
  },

  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    width: 36, height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title:    { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  fieldGroup: { marginBottom: 14 },
  label:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 6 },
  inputWrap:  {
    height: 48, borderWidth: 1.2, borderRadius: 12,
    paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', gap: 10,
  },
  input:   { flex: 1, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  eyeBtn:  { padding: 4 },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },

  // ── Política ── fix: texto en una sola línea
  policyCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4, marginBottom: 4 },
  policyRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:   {
    width: 20, height: 20,
    borderWidth: 1.5, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  // Contenedor del texto en fila — flexWrap para que no se rompa feo
  policyTextWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
  },
  policyText: { fontSize: FontSize.md, lineHeight: 22 },
  policyLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    textDecorationLine: 'underline',
    lineHeight: 22,
  },

  // ── Botón ──
  loginBtn:         { width: '100%', maxWidth: 320, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginTop: 20, marginBottom: 10 },
  loginBtnGradient: { paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  loginBtnText:     { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  // ── Links ──
  links:       { alignItems: 'center', marginTop: 16, gap: 12 },
  registerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  bottomText:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});