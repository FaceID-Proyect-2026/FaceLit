// ─────────────────────────────────────────────
//  app/auth/new-password.tsx
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,15}$/;

export default function NewPasswordScreen() {
  const { t }           = useTranslation();
  const { isDark, theme } = useTheme();

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  const text        = isDark ? '#FFFFFF' : '#000000';
  const muted       = isDark ? '#CAD6C8' : '#1E1E1E';
  const cardBg      = isDark ? '#07120D' : '#FFFFFF';
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.78)' : '#BBBBBB';
  const errorColor  = '#D92027';

  // ── Array dentro del componente para acceder a t() ──
  const REQUIREMENTS = [
    { key: 'length', label: t('newPassword.req.length'), test: (p: string) => p.length >= 8 && p.length <= 15 },
    { key: 'upper',  label: t('newPassword.req.upper'),  test: (p: string) => /[A-Z]/.test(p) },
    { key: 'lower',  label: t('newPassword.req.lower'),  test: (p: string) => /[a-z]/.test(p) },
    { key: 'number', label: t('newPassword.req.number'), test: (p: string) => /\d/.test(p) },
    { key: 'symbol', label: t('newPassword.req.symbol'), test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(p) },
  ];

  const handleSubmit = () => {
    const e: Record<string, string> = {};

    if (!password)
      e.password = t('newPassword.errors.passwordRequired');
    else if (!PASSWORD_REGEX.test(password))
      e.password = t('newPassword.errors.passwordInvalid');

    if (!confirmPassword)
      e.confirm = t('newPassword.errors.confirmRequired');
    else if (password !== confirmPassword)
      e.confirm = t('newPassword.errors.confirmMismatch');

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    router.push('/auth/password-reset-done');
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

            {/* Volver */}
            <TouchableOpacity style={s.backBtn} onPress={() => router.push('/auth/verify-identity')}>
              <Text style={s.backText}>{t('newPassword.backBtn')}</Text>
            </TouchableOpacity>

            {/* Ícono */}
            <View style={s.iconWrapper}>
              <Image
                source={require('@/assets/images/candado.png')}
                style={s.image}
                resizeMode="contain"
              />
            </View>

            {/* Título */}
            <Text style={[s.title,    { color: text  }]}>{t('newPassword.title')}</Text>
            <Text style={[s.subtitle, { color: muted }]}>{t('newPassword.subtitle')}</Text>

            {/* Requisitos */}
            <View style={[s.requirements, { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.10)' }]}>
              <Text style={[s.reqTitle, { color: theme.primary }]}>
                {t('newPassword.reqTitle')}
              </Text>
              {REQUIREMENTS.map((req) => {
                const met = req.test(password);
                return (
                  <View key={req.key} style={s.reqRow}>
                    <Ionicons
                      name={met ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={met ? theme.primary : isDark ? '#4A5E49' : '#AAAAAA'}
                    />
                    <Text style={[s.reqItem, { color: met ? theme.primary : isDark ? '#7A8A78' : '#888888' }]}>
                      {req.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Nueva contraseña */}
            <Text style={[s.fieldLabel, { color: text }]}>
              {t('newPassword.passwordLabel')}
            </Text>
            <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: errors.password ? errorColor : inputBorder }]}>
              <Ionicons name="lock-closed-outline" size={18} color={isDark ? '#7A8A78' : '#999999'} />
              <TextInput
                style={[s.input, { color: text }]}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors((p) => ({ ...p, password: '' }));
                }}
                placeholder={t('newPassword.passwordPlaceholder')}
                placeholderTextColor={isDark ? '#AEB6C2' : '#AAAAAA'}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isDark ? '#7A8A78' : '#999999'}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}

            {/* Confirmar contraseña */}
            <Text style={[s.fieldLabel, { color: text }]}>
              {t('newPassword.confirmLabel')}
            </Text>
            <View style={[s.inputRow, { backgroundColor: inputBg, borderColor: errors.confirm ? errorColor : inputBorder }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? '#7A8A78' : '#999999'} />
              <TextInput
                style={[s.input, { color: text }]}
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  setErrors((p) => ({ ...p, confirm: '' }));
                }}
                placeholder={t('newPassword.confirmPlaceholder')}
                placeholderTextColor={isDark ? '#AEB6C2' : '#AAAAAA'}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} activeOpacity={0.7}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={isDark ? '#7A8A78' : '#999999'}
                />
              </TouchableOpacity>
            </View>
            {errors.confirm ? <Text style={s.errorText}>{errors.confirm}</Text> : null}

            {/* Botón */}
            <TouchableOpacity style={s.button} onPress={handleSubmit}>
              <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={s.buttonGradient}>
                <Text style={s.buttonText}>{t('newPassword.submitBtn')}</Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  scroll:   { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 15 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120,  bottom: -30, borderRadius: 180 },
  card: {
    width: '100%', maxWidth: 750, borderRadius: 26,
    paddingHorizontal: 40, paddingVertical: 60,
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8,
  },
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
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.2, borderRadius: 14,
    paddingHorizontal: 14, marginBottom: 6, gap: 10,
  },
  input:          { flex: 1, paddingVertical: 14, fontSize: 15 },
  errorText:      { color: '#D92027', fontSize: 12, marginBottom: 12 },
  button:         { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  buttonGradient: { paddingVertical: 12, alignItems: 'center' },
  buttonText:     { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});