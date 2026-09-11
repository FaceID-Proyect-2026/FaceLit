// ─────────────────────────────────────────────
//  app/auth/password-recovery.tsx
//  RF-1.5 — Paso 1: ingreso de correo
//  Solo VISTA — lógica en usePasswordRecoveryForm
// ─────────────────────────────────────────────
import { usePasswordRecoveryForm } from '@/features/auth/hooks/usePasswordRecoveryForm';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BTN_COLORS = ['#72C96D', '#65B361', '#4FA14B'] as const;

export default function PasswordRecoveryScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const {
    email, error, showModal, loading,
    setEmail, handleSubmit, closeModal, handleModalContinue, handleCancel,
  } = usePasswordRecoveryForm();

  const [focused, setFocused] = useState(false);

  // Colores
  const text = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? '#CAD6C8' : '#3D5C3A';
  const cardBg = isDark ? '#07120D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#F9FFF9';
  const inputBdr = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';
  const errorClr = Colors.error;

  return (
    <>
      <LinearGradient
        colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.gradient}
      >
        {/* Arcos decorativos */}
        <View style={[s.arcTop, { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
        <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              <View style={[s.card, { backgroundColor: cardBg }]}>

                {/* ── Botón volver ── */}
                <TouchableOpacity onPress={handleCancel} style={s.backRow} activeOpacity={0.7}>
                  <Text style={[s.backText, { color: theme.primary }]}>{t('verifyIdentity.backBtn')}</Text>
                </TouchableOpacity>

                {/* ── Ícono ── */}
                <View style={s.iconWrap}>
                  <View style={[s.iconCircle, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '14' }]}>
                    <Ionicons name="mail-outline" size={38} color={theme.primary} />
                  </View>
                </View>

                {/* ── Título ── */}
                <Text style={[s.title, { color: text }]}>{t('passwordRecovery.title')}</Text>
                <Text style={[s.subtitle, { color: muted }]}>{t('passwordRecovery.subtitle')}</Text>

                {/* ── Campo correo ── */}
                <View style={s.fieldGroup}>
                  <Text style={[s.label, { color: text }]}>{t('passwordRecovery.emailLabel')}</Text>
                  <View style={[s.inputRow, {
                    backgroundColor: inputBg,
                    borderColor: error ? errorClr : focused ? theme.primary : inputBdr,
                  }]}>
                    <Ionicons name="mail-outline" size={18} color={error ? errorClr : muted} />
                    <TextInput
                      style={[s.input, { color: text }] as any}
                      placeholder={t('passwordRecovery.emailPlaceholder')}
                      placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      editable={!loading}
                    />
                    {email.length > 0 && !loading && (
                      <TouchableOpacity onPress={() => setEmail('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={16} color={muted} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {error ? <Text style={[s.errorText, { color: errorClr }]}>{error}</Text> : null}
                </View>

                {/* ── Botones ── */}
                <View style={s.btnRow}>
                  <TouchableOpacity
                    style={[s.primaryBtn, loading && s.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={BTN_COLORS} style={s.btnGradient}>
                      {loading
                        ? <ActivityIndicator size="small" color="#FFFFFF" />
                        : <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                      }
                      <Text style={s.btnText}>
                        {loading ? t('passwordRecovery.sendingBtn') : t('passwordRecovery.sendBtn')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.secondaryBtn, { borderColor: theme.primary }]}
                    onPress={handleCancel}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.secondaryText, { color: theme.primary }]}>{t('passwordRecovery.cancelBtn')}</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Modal: código enviado ── */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={m.overlay}>
          <View style={[m.card, { backgroundColor: cardBg, borderColor: theme.primary + '33' }]}>

            {/* Ícono central */}
            <View style={[m.iconCircle, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
              <Ionicons name="mail-open-outline" size={40} color={theme.primary} />
            </View>

            {/* Título y descripción */}
            <Text style={[m.title, { color: text }]}>{t('tokenSent.title')}</Text>
            <Text style={[m.subtitle, { color: muted }]}>{t('tokenSent.subtitle')}</Text>

            {/* Correo ingresado */}
            <View style={[m.emailRow, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '33' }]}>
              <Ionicons name="at-circle-outline" size={16} color={theme.primary} />
              <Text style={[m.emailText, { color: theme.primary }]} numberOfLines={1}>{email}</Text>
            </View>

            {/* Separador */}
            <View style={[m.divider, { backgroundColor: theme.primary + '22' }]} />

            {/* Botón continuar */}
            <TouchableOpacity style={m.btn} onPress={handleModalContinue} activeOpacity={0.85}>
              <LinearGradient colors={BTN_COLORS} style={m.btnGradient}>
                <Ionicons name="keypad-outline" size={16} color="#FFFFFF" />
                <Text style={m.btnText}>{t('tokenSent.btn')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Link cancelar */}
            <TouchableOpacity onPress={closeModal} style={m.cancelBtn} activeOpacity={0.7}>
              <Text style={[m.cancelText, { color: muted }]}>{t('passwordRecovery.cancelBtn')}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
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

  iconWrap: { alignItems: 'center', marginBottom: 18 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 24 },

  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  inputRow: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 15, outlineStyle: 'none' } as any,
  errorText: { fontSize: 12, fontWeight: '700', marginTop: 5 },

  btnRow: { gap: 10 },
  primaryBtn: { borderRadius: 14, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.65 },
  secondaryBtn: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    width: '100%', maxWidth: 400,
    borderRadius: 24, borderWidth: 1,
    paddingHorizontal: 28, paddingVertical: 32,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 16, paddingHorizontal: 8 },
  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 9,
    marginBottom: 20, maxWidth: '100%',
  },
  emailText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  divider: { width: '100%', height: 1, marginBottom: 20 },
  btn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 13 },
});
