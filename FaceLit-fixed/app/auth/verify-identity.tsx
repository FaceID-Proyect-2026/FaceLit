import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';

const CODE_MOCK    = '264255';
const INITIAL_TIME = 5 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function VerifyIdentityScreen() {
  const { t }    = useTranslation();
  const { isDark } = useTheme();

  const [code,     setCode]     = useState('');
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [error,    setError]    = useState('');

  const text        = isDark ? '#FFFFFF' : '#000000';
  const muted       = isDark ? '#CAD6C8' : '#1E1E1E';
  const cardBg      = isDark ? '#07120D' : '#FFFFFF';
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.78)' : '#000000';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = () => {
    if (code.length !== 6) {
      setError(t('verifyIdentity.errors.length'));
      return;
    }
    if (code !== CODE_MOCK) {
      setError(t('verifyIdentity.errors.invalid'));
      return;
    }
    setError('');
    router.push('/auth/new-password');
  };

  const handleResend = () => setTimeLeft(INITIAL_TIME);

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#000000', '#06170F', '#0B2D17']
          : ['#F7FFF4', '#E5F7DF', '#1E4C28']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View
        style={[
          styles.backgroundArcTop,
          { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' },
        ]}
      />
      <View
        style={[
          styles.backgroundArcBottom,
          { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' },
        ]}
      />

      <SafeAreaView style={styles.safe}>
        <View
          style={[
            styles.card,
            { backgroundColor: cardBg, shadowColor: isDark ? '#000000' : '#1C3A1D' },
          ]}
        >
          {/* Volver */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push('/auth/password-recovery')}
          >
            <Text style={styles.backText}>
              {t('verifyIdentity.backBtn')}
            </Text>
          </TouchableOpacity>

          {/* Ícono reloj */}
          <View style={styles.clockCircle}>
            <Text style={styles.clockIcon}>🕐</Text>
          </View>

          {/* Título */}
          <Text style={[styles.title, { color: text }]}>
            {t('verifyIdentity.title')}
          </Text>

          {/* Subtítulo + correo */}
          <Text style={[styles.subtitle, { color: muted }]}>
            {t('verifyIdentity.subtitle')}
          </Text>
          <Text style={styles.email}>correo@ejemplo.com</Text>

          {/* Timer */}
          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>
              {t('verifyIdentity.timerLabel')}{formatTime(timeLeft)}
            </Text>
          </View>

          {/* Reenviar */}
          <TouchableOpacity style={styles.resendBtn} onPress={handleResend}>
            <Text style={styles.resendText}>
              {t('verifyIdentity.resendBtn')}
            </Text>
          </TouchableOpacity>

          {/* Input */}
          <Text style={[styles.inputLabel, { color: text }]}>
            {t('verifyIdentity.inputLabel')}
          </Text>
          <TextInput
            style={[
              styles.codeInput,
              {
                color: text,
                backgroundColor: inputBg,
                borderColor: error ? '#D92027' : inputBorder,
              },
            ]}
            value={code}
            onChangeText={(v) => {
              setCode(v.replace(/\D/g, ''));
              setError('');
            }}
            placeholder={t('verifyIdentity.placeholder')}
            placeholderTextColor={isDark ? '#AEB6C2' : '#7A7A7A'}
            keyboardType="number-pad"
            maxLength={6}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={[styles.hint, { color: muted }]}>
            {t('verifyIdentity.hint')}
          </Text>

          {/* Botón verificar */}
          <TouchableOpacity style={styles.button} onPress={handleVerify}>
            <LinearGradient
              colors={['#72C96D', '#65B361', '#4FA14B']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {t('verifyIdentity.verifyBtn')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient:          { flex: 1 },
  safe:              { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  backgroundArcTop: {
    position: 'absolute', width: 300, height: 420,
    right: -120, top: -90, borderRadius: 200,
  },
  backgroundArcBottom: {
    position: 'absolute', width: 420, height: 220,
    left: -120, bottom: -30, borderRadius: 180,
  },
  card: {
    width: '100%', maxWidth: 750, borderRadius: 26,
    paddingHorizontal: 40, paddingVertical: 60,
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18,
    shadowRadius: 18, elevation: 8,
  },
  backBtn:     { marginBottom: 18 },
  backText:    { color: '#65B361', fontSize: 14, fontWeight: '700' },
  clockCircle: {
    width: 110, height: 110, borderRadius: 55, borderWidth: 4,
    borderColor: '#65B361', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 18,
  },
  clockIcon:   { fontSize: 54 },
  title:       { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:    { fontSize: 14, textAlign: 'center' },
  email: {
    fontSize: 14, textAlign: 'center', color: '#65B361',
    textDecorationLine: 'underline', marginBottom: 18, marginTop: 4, fontWeight: '700',
  },
  timerBadge: {
    backgroundColor: '#E89B2C', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    alignSelf: 'center', marginBottom: 12,
  },
  timerText:   { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  resendBtn:   { alignSelf: 'center', marginBottom: 24 },
  resendText:  { color: '#65B361', fontWeight: '700', textDecorationLine: 'underline' },
  inputLabel:  { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  codeInput: {
    borderWidth: 1.2, borderRadius: 14, paddingVertical: 14,
    textAlign: 'center', fontSize: 22, letterSpacing: 8,
  },
  errorText:      { color: '#D92027', fontSize: 12, marginTop: 6 },
  hint:           { fontSize: 12, marginTop: 8, marginBottom: 24 },
  button:         { width: '100%', borderRadius: 16, overflow: 'hidden' },
  buttonGradient: { paddingVertical: 12, alignItems: 'center' },
  buttonText:     { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});