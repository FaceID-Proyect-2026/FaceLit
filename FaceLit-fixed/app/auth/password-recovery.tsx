import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';

const correosRegistrados = [
  'admin@test.com',
  'usuario@empresa.com',
  'valery@gmail.com',
  'juan@gmail.com',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GRADIENT_DARK   = ['#000000', '#06170F', '#0B2D17'] as const;
const GRADIENT_LIGHT  = ['#F7FFF4', '#E5F7DF', '#1E4C28'] as const;
const BUTTON_GRADIENT = ['#72C96D', '#65B361', '#4FA14B'] as const;

export default function PasswordRecoveryScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();

  const [email,     setEmail]     = useState('');
  const [error,     setError]     = useState('');
  const [focused,   setFocused]   = useState(false);
  const [showModal, setShowModal] = useState(false);

  const text        = isDark ? '#FFFFFF' : '#000000';
  const muted       = isDark ? '#CAD6C8' : '#1E1E1E';
  const cardBg      = isDark ? '#07120D' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.78)' : '#000000';
  const inputBg     = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const errorColor  = '#D92027';

  const handleSubmit = () => {
    if (!EMAIL_REGEX.test(email)) {
      setError(t('passwordRecovery.errors.invalidEmail'));
      return;
    }
    if (!correosRegistrados.includes(email)) {
      setError(t('passwordRecovery.errors.emailNotFound'));
      return;
    }
    setError('');
    setShowModal(true);
  };

  const handleModalContinue = () => {
    setShowModal(false);
    router.push('/auth/verify-identity');
  };

  return (
    <>
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
          <KeyboardAvoidingView
            style={styles.kav}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView contentContainerStyle={styles.scroll}>
              <View style={[styles.card, { backgroundColor: cardBg }]}>

                {/* Título */}
                <Text style={[styles.title, { color: text }]}>
                  {t('passwordRecovery.title')}
                </Text>
                <Text style={[styles.subtitle, { color: muted }]}>
                  {t('passwordRecovery.subtitle')}
                </Text>

                {/* Campo correo */}
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { color: text }]}>
                    {t('passwordRecovery.emailLabel')}
                  </Text>

                  <View
                    style={[
                      styles.inputWrap,
                      {
                        backgroundColor: inputBg,
                        borderColor: error ? errorColor : focused ? theme.primary : inputBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={error ? errorColor : text}
                    />
                    <TextInput
                      style={[styles.input, { color: text }]}
                      placeholder={t('passwordRecovery.emailPlaceholder')}
                      placeholderTextColor={isDark ? '#AEB6C2' : '#323232'}
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        setError('');
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                    />
                  </View>

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}
                </View>

                {/* Botones */}
                <View style={styles.row}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                    <LinearGradient
                      colors={['#72C96D', '#65B361', '#4FA14B']}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnText}>
                        {t('passwordRecovery.sendBtn')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.replace('/auth/login')}
                  >
                    <Text style={styles.secondaryText}>
                      {t('passwordRecovery.cancelBtn')}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: cardBg,
                shadowColor: isDark ? '#000000' : '#1C3A1D',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Image
                source={require('@/assets/images/token.png')}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: text }]}>
                {t('tokenSent.title')}
              </Text>

              <Text style={[styles.modalSubtitle, { color: muted }]}>
                {t('tokenSent.subtitle')}
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleModalContinue}
                activeOpacity={0.85}
              >
                <LinearGradient colors={BUTTON_GRADIENT} style={styles.modalButtonGradient}>
                  <Text style={styles.modalButtonText}>{t('tokenSent.btn')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gradient:          { flex: 1 },
  safe:              { flex: 1 },
  kav:               { flex: 1 },
  backgroundArcTop: {
    position: 'absolute', width: 300, height: 420,
    right: -120, top: -90, borderRadius: 200,
  },
  backgroundArcBottom: {
    position: 'absolute', width: 420, height: 220,
    left: -120, bottom: -30, borderRadius: 180,
  },
  scroll: {
    flexGrow: 1, justifyContent: 'center',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 30,
  },
  card: {
    width: '100%', maxWidth: 460,
    borderRadius: 26, paddingHorizontal: 24, paddingVertical: 30,
  },
  title:      { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  fieldGroup: { marginTop: 12 },
  label:      { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  inputWrap: {
    height: 46, borderWidth: 1.2, borderRadius: 12,
    paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  input:       { flex: 1, fontSize: 16, outlineStyle: 'none' } as any,
  errorText:   { color: '#D92027', fontSize: 11, marginTop: 4, fontWeight: '700' },
  row:         { flexDirection: 'row', gap: 12, marginTop: 28 },
  primaryBtn:  { flex: 1, borderRadius: 14, overflow: 'hidden' },
  btnGradient: { paddingVertical: 12, alignItems: 'center' },
  btnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5,
    borderColor: '#65B361', justifyContent: 'center', alignItems: 'center',
  },
  secondaryText: { color: '#65B361', fontSize: 16, fontWeight: '700' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalCard: {
    width: '85%', maxWidth: 420, borderRadius: 26, overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18,
    shadowRadius: 18, elevation: 8,
  },
  modalHeader: {
    backgroundColor: '#65B361', paddingVertical: 32, alignItems: 'center',
  },
  modalImage: { width: 95, height: 95 },
  modalBody: {
    paddingHorizontal: 28, paddingVertical: 30, alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 26,
  },
  modalButton: { width: '70%', borderRadius: 16, overflow: 'hidden' },
  modalButtonGradient: { paddingVertical: 12, alignItems: 'center' },
  modalButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});