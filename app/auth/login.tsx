// ─────────────────────────────────────────────
//  app/auth/login.tsx — diseño mejorado + animación olvidé contraseña
// ─────────────────────────────────────────────
import PrivacyNoticeModal from '@/features/auth/components/PrivacyNoticeModal';
import { useLoginForm } from '@/features/auth/hooks/useLoginForm';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
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

const { width, height } = Dimensions.get('window');
const CARD_MAX = 560;
const isWide = width >= 768;

// ── Overlay de transición animada ─────────────
function TransitionOverlay({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0)).current;
  const ripple1  = useRef(new Animated.Value(0)).current;
  const ripple2  = useRef(new Animated.Value(0)).current;
  const ripple3  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      // Fase 1: aparece el fondo y las ondas
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(ripple1, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ripple2, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),
      Animated.timing(ripple3, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      // Fase 2: sostenido brevemente y luego navega
      Animated.delay(150),
    ]).start(() => onDone());
  }, [visible]);

  if (!visible) return null;

  const r1Size = ripple1.interpolate({ inputRange: [0, 1], outputRange: [0, width * 3.5] });
  const r2Size = ripple2.interpolate({ inputRange: [0, 1], outputRange: [0, width * 2.8] });
  const r3Size = ripple3.interpolate({ inputRange: [0, 1], outputRange: [0, width * 2.0] });
  const r1Op  = ripple1.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.25, 0] });
  const r2Op  = ripple2.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.45, 0.2, 0] });
  const r3Op  = ripple3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.35, 0.1] });
  const iconScale = scale.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Animated.View style={[so.overlay, { opacity }]}>
      {/* Ondas de ripple */}
      <Animated.View style={[so.ripple, { width: r1Size, height: r1Size, borderRadius: 9999, opacity: r1Op, backgroundColor: 'rgba(101,179,97,0.35)' }]} />
      <Animated.View style={[so.ripple, { width: r2Size, height: r2Size, borderRadius: 9999, opacity: r2Op, backgroundColor: 'rgba(101,179,97,0.28)' }]} />
      <Animated.View style={[so.ripple, { width: r3Size, height: r3Size, borderRadius: 9999, opacity: r3Op, backgroundColor: 'rgba(101,179,97,0.22)' }]} />

      {/* Ícono central */}
      <Animated.View style={[so.iconWrap, { transform: [{ scale: iconScale }] }]}>
        <View style={so.iconCircle}>
          <Ionicons name="key-outline" size={36} color="#FFFFFF" />
        </View>
        <Text style={so.iconLabel}>{t('login.recoveringAccess')}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const so = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4,28,14,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ripple: {
    position: 'absolute',
    alignSelf: 'center',
  },
  iconWrap: { alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(101,179,97,0.25)',
    borderWidth: 2, borderColor: '#65B361',
    alignItems: 'center', justifyContent: 'center',
  },
  iconLabel: { color: '#A8D8A4', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});

// ── Screen ────────────────────────────────────
export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const routerInstance = useRouter();
  const { form, errors, loading, alreadyAccepted, setField, setDocumentField, handleSubmit } = useLoginForm();

  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // Animaciones de entrada de la tarjeta
  const cardAnim  = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim,  { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleForgotPassword = () => {
    if (transitioning) return;
    setTransitioning(true);
  };

  const handleTransitionDone = () => {
    router.push(Routes.AUTH.PASSWORD_RECOVERY as any);
    // Pequeño delay para resetear el estado después de navegar
    setTimeout(() => setTransitioning(false), 800);
  };

  // ── Colores locales ───────────────────────────
  const text        = isDark ? Colors.dark.text       : Colors.light.text;
  const muted       = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg      = isDark ? Colors.dark.surface    : Colors.white;
  const inputBg     = isDark ? Colors.dark.inputBg    : Colors.light.inputBg;
  const inputBorder = isDark ? Colors.dark.inputBorder: Colors.light.inputBorder;
  const cardBorder  = isDark ? Colors.dark.border     : Colors.light.border;
  const forgotColor = isDark ? Colors.white            : theme.primaryDark;

  return (
    <>
      <LinearGradient
        colors={isDark
          ? ['#000000', '#06170F', '#0B2D17']
          : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.gradient}
      >
        {/* Arcos decorativos */}
        <View style={[s.arcTop,    { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
        <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

        {/* Círculos decorativos adicionales */}
        <View style={[s.deco1, { backgroundColor: isDark ? 'rgba(101,179,97,0.05)' : 'rgba(101,179,97,0.12)' }]} />
        <View style={[s.deco2, { backgroundColor: isDark ? 'rgba(101,179,97,0.04)' : 'rgba(101,179,97,0.08)' }]} />

        <SafeAreaView style={s.safe}>
          <KeyboardAvoidingView
            style={s.kav}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            enabled={Platform.OS === 'ios'}
          >
            <ScrollView
              contentContainerStyle={s.scroll}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
            >
              <Animated.View style={[
                s.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
                { opacity: cardAnim, transform: [{ translateY: cardSlide }] },
              ]}>

                {/* Volver */}
                <TouchableOpacity
                  onPress={() => routerInstance.push('/')}
                  style={[s.backBtn, {
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  }]}
                >
                  <Ionicons name="arrow-back" size={18} color={text} />
                </TouchableOpacity>

                {/* Ícono superior */}
                <View style={s.logoWrap}>
                  <View style={[s.logoCircle, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
                    <Ionicons name="person-circle-outline" size={46} color={theme.primary} />
                  </View>
                </View>

                {/* Título */}
                <Text style={[s.title,    { color: text  }]}>{t('login.title')}</Text>
                <Text style={[s.subtitle, { color: muted }]}>{t('login.subtitle')}</Text>

                {/* Separador decorativo */}
                <View style={[s.divider, { backgroundColor: theme.border }]} />

                {/* ── Documento ── */}
                <View style={s.fieldGroup}>
                  <Text style={[s.label, { color: text }]}>{t('login.document')}</Text>
                  <View style={[s.inputWrap, {
                    backgroundColor: inputBg,
                    borderColor: errors.document
                      ? Colors.error
                      : focused === 'document'
                        ? theme.borderStrong
                        : inputBorder,
                    shadowColor: focused === 'document' ? theme.borderStrong : 'transparent',
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: focused === 'document' ? 2 : 0,
                  }]}>
                    <Ionicons name="card-outline" size={18} color={focused === 'document' ? theme.text : muted} />
                    <TextInput
                      style={[s.input, { color: text }] as any}
                      value={form.document}
                      onChangeText={setDocumentField}
                      placeholder={t('login.documentPlaceholder')}
                      placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      autoCorrect={false}
                      autoCapitalize="none"
                      autoComplete="username"
                      textContentType="username"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      maxLength={15}
                      onFocus={() => setFocused('document')}
                      onBlur={() => setFocused(null)}
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  </View>
                  {errors.document ? <Text style={s.errorText}>{errors.document}</Text> : null}
                </View>

                {/* ── Contraseña ── */}
                <View style={s.fieldGroup}>
                  <Text style={[s.label, { color: text }]}>{t('login.password')}</Text>
                  <View style={[s.inputWrap, {
                    backgroundColor: inputBg,
                    borderColor: errors.password
                      ? Colors.error
                      : focused === 'password'
                        ? theme.borderStrong
                        : inputBorder,
                    shadowColor: focused === 'password' ? theme.borderStrong : 'transparent',
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: focused === 'password' ? 2 : 0,
                  }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={focused === 'password' ? theme.text : muted} />
                    <TextInput
                      ref={passwordRef}
                      style={[s.input, { color: text }] as any}
                      value={form.password}
                      onChangeText={v => setField('password', v)}
                      placeholder={t('login.passwordPlaceholder')}
                      placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password"
                      textContentType="password"
                      returnKeyType="done"
                      blurOnSubmit={false}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      onSubmitEditing={handleSubmit}
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
                  {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
                </View>

                {/* ── Política de privacidad ── */}
                {!alreadyAccepted && (
                  <View style={[s.policyCard, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F3F8F3',
                    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
                  }]}>
                    <TouchableOpacity
                      onPress={() => setField('accepted', !form.accepted)}
                      activeOpacity={0.8}
                      style={s.policyRow}
                    >
                      <View style={[s.checkbox, {
                        borderColor: errors.policy
                          ? Colors.error
                          : form.accepted
                            ? theme.primary
                            : inputBorder,
                        backgroundColor: form.accepted ? theme.primary : Colors.transparent,
                      }]}>
                        {form.accepted && (
                          <Ionicons name="checkmark" size={12} color={Colors.white} />
                        )}
                      </View>
                      <Text style={s.policyTextWrap}>
                        <Text style={[s.policyText, { color: text }]}>{t('login.policyPrefix')}{' '}</Text>
                        <Text style={[s.policyLink, { color: isDark ? theme.primaryLight : theme.primaryDark }]} onPress={() => setShowPrivacy(true)}>
                          {t('login.policyLink')}
                        </Text>
                        <Text style={[s.policyText, { color: text }]}>{t('login.policySuffix')}</Text>
                      </Text>
                    </TouchableOpacity>
                    {errors.policy
                      ? <Text style={[s.errorText, { marginTop: 6, marginLeft: 30 }]}>{t('login.policyError')}</Text>
                      : null}
                  </View>
                )}

                {/* ── Errores generales ── */}
                {errors.general ? (
                  <View style={[s.blockedBanner, {
                    backgroundColor: isDark ? 'rgba(217,32,39,0.12)' : '#FFF0F0',
                    borderColor: Colors.error,
                  }]}>
                    <Ionicons name="cloud-offline-outline" size={16} color={Colors.error} />
                    <Text style={[s.blockedText, { color: Colors.error }]}>{errors.general}</Text>
                  </View>
                ) : null}

                {errors.blocked ? (
                  <View style={[s.blockedBanner, {
                    backgroundColor: isDark ? 'rgba(217,32,39,0.12)' : '#FFF0F0',
                    borderColor: Colors.error,
                  }]}>
                    <Ionicons name="lock-closed" size={16} color={Colors.error} />
                    <Text style={[s.blockedText, { color: Colors.error }]}>{errors.blocked}</Text>
                  </View>
                ) : null}

                {/* ── Botón iniciar sesión ── */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[s.loginBtn, loading && s.loginBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <PrivacyNoticeModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
                  <LinearGradient
                    colors={['#72C96D', '#65B361', '#4FA14B']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.loginBtnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                    )}
                    <Text style={s.loginBtnText}>
                      {loading ? t('login.loggingIn') ?? t('login.loginBtn') : t('login.loginBtn')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* ── ¿Olvidaste tu contraseña? ── */}
                <View style={s.links}>
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={transitioning}
                    activeOpacity={0.7}
                    style={[s.forgotBtn, {
                      backgroundColor: isDark ? Colors.transparent : theme.primary + '14',
                      borderColor: isDark ? Colors.transparent : theme.primary + '33',
                    }]}
                  >
                    <Ionicons name="help-circle-outline" size={15} color={forgotColor} />
                    <Text style={[s.forgotText, { color: forgotColor }]}>
                      {t('login.forgotPassword')}
                    </Text>
                  </TouchableOpacity>
                </View>

              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>

      {/* Overlay de transición animada */}
      <TransitionOverlay visible={transitioning} onDone={handleTransitionDone} />
    </>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1 },
  kav:      { flex: 1 },

  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left:  -120, bottom: -30, borderRadius: 180 },
  deco1:     { position: 'absolute', width: 160, height: 160, left:   -60, top:   '35%', borderRadius: 80 },
  deco2:     { position: 'absolute', width: 100, height: 100, right:  -30, bottom: '30%', borderRadius: 50 },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },

  card: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: isWide ? 52 : 32,
    paddingVertical: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    width: 38, height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap:   { alignItems: 'center', marginBottom: 14 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  title:    { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: FontSize.md,    textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  divider: { height: 1.5, borderRadius: 2, marginBottom: 22 },

  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 6 },
  inputWrap: {
    height: 52, borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', gap: 10,
  },
  input:    { flex: 1, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  eyeBtn:   { padding: 4 },
  errorText:{ color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },

  policyCard:    { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4, marginBottom: 4 },
  policyRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox:      { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  policyTextWrap:{ flex: 1 },
  policyText:    { fontSize: FontSize.md, lineHeight: 22 },
  policyLink:    { fontSize: FontSize.md, fontWeight: FontWeight.bold, textDecorationLine: 'underline', lineHeight: 22 },

  blockedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  blockedText:   { flex: 1, fontSize: FontSize.sm, lineHeight: 20, fontWeight: FontWeight.bold },

  loginBtn:         { width: '100%', maxWidth: 340, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginTop: 22, marginBottom: 12 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnGradient: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  loginBtnText:     { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  links:     { alignItems: 'center', marginTop: 8 },
  forgotBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  forgotText:{ fontSize: FontSize.base, fontWeight: FontWeight.bold, textDecorationLine: 'underline' },
});
