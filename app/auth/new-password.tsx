// ─────────────────────────────────────────────
//  app/auth/new-password.tsx
//  RF-1.5 — Paso 3: establecer nueva contraseña
//  DISEÑO: animaciones de entrada, inputs animados,
//          botón con pulso, partículas de fondo.
//  OJO: no se toca ninguna lógica de backend.
// ─────────────────────────────────────────────
import { useNewPasswordForm } from '@/features/auth/hooks/useNewPasswordForm';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    Easing,
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

// ── Partícula flotante decorativa ─────────────
function FloatingParticle({
  delay, size, x, y, isDark,
}: { delay: number; size: number; x: string; y: string; isDark: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.15, 0.45, 0.15] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x as any,
        top:  y as any,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: isDark ? 'rgba(101,179,97,0.6)' : 'rgba(50,120,50,0.5)',
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}

// ── Modal de éxito ────────────────────────────
function SuccessModal({ visible, onContinue, isDark }: {
  visible: boolean;
  onContinue: () => void;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const bg    = isDark ? '#07120D' : '#FFFFFF';
  const text  = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? '#CAD6C8' : '#3D5C3A';

  // Animación de entrada del modal
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const ITEMS = [
    t('passwordResetDone.security.item1'),
    t('passwordResetDone.security.item2'),
    t('passwordResetDone.security.item3'),
    t('passwordResetDone.security.item4'),
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={sm.overlay}>
        <Animated.View
          style={[
            sm.card,
            { backgroundColor: bg },
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Ícono */}
          <View style={sm.iconWrap}>
            <Image source={require('@/assets/images/check.png')} style={sm.icon} resizeMode="contain" />
          </View>

          <Text style={[sm.title,    { color: text  }]}>{t('passwordResetDone.title')}</Text>
          <Text style={[sm.subtitle, { color: muted }]}>{t('passwordResetDone.subtitle1')}</Text>
          <Text style={[sm.subtitle, { color: muted, marginBottom: 18 }]}>{t('passwordResetDone.subtitle2')}</Text>

          {/* Registro de seguridad */}
          <View style={[sm.log, {
            backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.06)',
            borderColor: 'rgba(101,179,97,0.25)',
          }]}>
            <Text style={sm.logTitle}>{t('passwordResetDone.securityTitle')}</Text>
            {ITEMS.map((item, i) => (
              <View key={i} style={sm.logRow}>
                <Ionicons name="checkmark-circle" size={13} color="#65B361" />
                <Text style={[sm.logItem, { color: muted }]}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={sm.btn} onPress={onContinue} activeOpacity={0.85}>
            <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={sm.btnGradient}>
              <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
              <Text style={sm.btnText}>{t('passwordResetDone.loginBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  card:       { width: '100%', maxWidth: 420, borderRadius: 26, paddingHorizontal: 26, paddingVertical: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12 },
  iconWrap:   { marginBottom: 16 },
  icon:       { width: 84, height: 84 },
  title:      { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 4 },
  log:        { width: '100%', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 20 },
  logTitle:   { fontSize: 12, fontWeight: '800', color: '#65B361', marginBottom: 10 },
  logRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 5 },
  logItem:    { flex: 1, fontSize: 12, lineHeight: 18 },
  btn:        { width: '85%', borderRadius: 14, overflow: 'hidden' },
  btnGradient:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  btnText:    { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

// ── Animated Input Row ────────────────────────
function AnimatedInputRow({
  iconName, value, onChange, placeholder, placeholderColor,
  textColor, bgColor, borderColor, secureTextEntry, onToggle,
  showToggle, editable,
}: {
  iconName: any; value: string; onChange: (v: string) => void;
  placeholder: string; placeholderColor: string; textColor: string;
  bgColor: string; borderColor: string; secureTextEntry: boolean;
  onToggle?: () => void; showToggle?: boolean; editable?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onFocus = () => Animated.spring(scaleAnim, { toValue: 1.015, friction: 6, useNativeDriver: true }).start();
  const onBlur  = () => Animated.spring(scaleAnim, { toValue: 1,     friction: 6, useNativeDriver: true }).start();

  return (
    <Animated.View style={[ai.row, { backgroundColor: bgColor, borderColor, transform: [{ scale: scaleAnim }] }]}>
      <Ionicons name={iconName} size={18} color={placeholderColor} />
      <TextInput
        style={[ai.input, { color: textColor }] as any}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable !== false}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {showToggle && onToggle && (
        <TouchableOpacity onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={18} color={placeholderColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const ai = StyleSheet.create({
  row:   { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 15, outlineStyle: 'none' } as any,
});

// ── Screen ────────────────────────────────────
export default function NewPasswordScreen() {
  const { t }             = useTranslation();
  const { isDark, theme } = useTheme();

  const {
    password, confirmPassword,
    errors, requirements, loading, showSuccess,
    setPassword, setConfirmPassword, handleSubmit,
  } = useNewPasswordForm();

  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Animaciones de entrada ────────────────────
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(36)).current;

  // Animaciones escalonadas por sección
  const iconAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const reqAnim    = useRef(new Animated.Value(0)).current;
  const field1Anim = useRef(new Animated.Value(0)).current;
  const field2Anim = useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;

  // Pulso del botón submit
  const btnPulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrada de la tarjeta
    Animated.parallel([
      Animated.timing(cardAnim,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Aparición escalonada de elementos
    Animated.stagger(90, [
      Animated.timing(iconAnim,   { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(titleAnim,  { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(reqAnim,    { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(field1Anim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(field2Anim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(btnAnim,    { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Pulso continuo del botón
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.035, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1,     duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const timeout = setTimeout(() => pulse.start(), 1800);
    return () => {
      clearTimeout(timeout);
      pulse.stop();
    };
  }, []);

  const makeSlide = (anim: Animated.Value, offsetY = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });

  // Escala del ícono
  const iconScale = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  // Colores
  const text    = isDark ? '#FFFFFF' : '#111111';
  const muted   = isDark ? '#CAD6C8' : '#3D5C3A';
  const cardBg  = isDark ? '#07120D' : '#FFFFFF';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#F9FFF9';
  const inputBdr= isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';

  // Partículas decorativas
  const PARTICLES = [
    { size: 8,  x: '8%',  y: '12%', delay: 0    },
    { size: 5,  x: '88%', y: '8%',  delay: 600  },
    { size: 10, x: '75%', y: '22%', delay: 1200 },
    { size: 6,  x: '15%', y: '55%', delay: 400  },
    { size: 7,  x: '90%', y: '60%', delay: 900  },
    { size: 4,  x: '50%', y: '5%',  delay: 1500 },
    { size: 9,  x: '5%',  y: '80%', delay: 200  },
    { size: 5,  x: '92%', y: '85%', delay: 1100 },
  ];

  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      {/* Arcos decorativos */}
      <View style={[s.arcTop,    { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(20,70,28,0.18)' }]} />
      <View style={[s.arcBottom, { backgroundColor: isDark ? 'rgba(101,179,97,0.22)' : 'rgba(101,179,97,0.28)' }]} />

      {/* Partículas flotantes */}
      {PARTICLES.map((p, i) => (
        <FloatingParticle key={i} {...p} isDark={isDark} />
      ))}

      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            s.card,
            { backgroundColor: cardBg },
            { opacity: cardAnim, transform: [{ translateY: cardSlide }] },
          ]}>

            {/* ── Volver ── */}
            <TouchableOpacity onPress={() => router.back()} style={s.backRow} activeOpacity={0.7}>
              <View style={[s.backIconWrap, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
                <Ionicons name="arrow-back" size={20} color={theme.primary} />
              </View>
              <Text style={[s.backText, { color: theme.primary }]}>{t('newPassword.backBtn')}</Text>
            </TouchableOpacity>

            {/* ── Ícono animado ── */}
            <Animated.View style={[s.iconWrap, { opacity: iconAnim, transform: [{ scale: iconScale }] }]}>
              <View style={[s.iconCircle, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '14' }]}>
                <Image source={require('@/assets/images/candado.png')} style={s.icon} resizeMode="contain" />
              </View>
              {/* Halo pulsante bajo el ícono */}
              <View style={[s.iconHalo, { backgroundColor: theme.primary + '18' }]} />
            </Animated.View>

            {/* ── Título ── */}
            <Animated.View style={makeSlide(titleAnim)}>
              <Text style={[s.title,    { color: text  }]}>{t('newPassword.title')}</Text>
              <Text style={[s.subtitle, { color: muted }]}>{t('newPassword.subtitle')}</Text>
            </Animated.View>

            {/* ── Indicadores de requisitos ── */}
            <Animated.View style={[s.reqBox, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '33' }, makeSlide(reqAnim)]}>
              <Text style={[s.reqTitle, { color: theme.primary }]}>{t('newPassword.reqTitle')}</Text>
              <View style={s.reqGrid}>
                {requirements.map(req => (
                  <View key={req.key} style={s.reqRow}>
                    <Ionicons
                      name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={req.met ? theme.primary : isDark ? '#4A6A50' : '#BBBBBB'}
                    />
                    <Text style={[s.reqText, { color: req.met ? theme.primary : isDark ? '#6A8A70' : '#999999' }]}>
                      {req.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* ── Error de token (código expirado / usado / inválido) ── */}
            {errors.code ? (
              <View style={[s.tokenError, { backgroundColor: Colors.error + '1A', borderColor: Colors.error + '55' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
                <Text style={[s.tokenErrorText, { color: Colors.error }]}>{errors.code}</Text>
              </View>
            ) : null}

            {/* ── Nueva contraseña ── */}
            <Animated.View style={[s.fieldGroup, makeSlide(field1Anim)]}>
              <Text style={[s.label, { color: text }]}>{t('newPassword.passwordLabel')}</Text>
              <AnimatedInputRow
                iconName="lock-closed-outline"
                value={password}
                onChange={setPassword}
                placeholder={t('newPassword.passwordPlaceholder')}
                placeholderColor={isDark ? '#4A6A50' : '#AAAAAA'}
                textColor={text}
                bgColor={inputBg}
                borderColor={errors.password ? Colors.error : inputBdr}
                secureTextEntry={!showPwd}
                onToggle={() => setShowPwd(v => !v)}
                showToggle
                editable={!loading}
              />
              {errors.password ? <Text style={s.errorText}>{errors.password}</Text> : null}
            </Animated.View>

            {/* ── Confirmar contraseña ── */}
            <Animated.View style={[s.fieldGroup, makeSlide(field2Anim)]}>
              <Text style={[s.label, { color: text }]}>{t('newPassword.confirmLabel')}</Text>
              <AnimatedInputRow
                iconName="shield-checkmark-outline"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder={t('newPassword.confirmPlaceholder')}
                placeholderColor={isDark ? '#4A6A50' : '#AAAAAA'}
                textColor={text}
                bgColor={inputBg}
                borderColor={errors.confirm ? Colors.error : inputBdr}
                secureTextEntry={!showConfirm}
                onToggle={() => setShowConfirm(v => !v)}
                showToggle
                editable={!loading}
              />
              {errors.confirm ? <Text style={s.errorText}>{errors.confirm}</Text> : null}
            </Animated.View>

            {/* ── Botón restablecer (con pulso) ── */}
            <Animated.View style={[
              s.submitBtn,
              makeSlide(btnAnim, 10),
              !loading && { transform: [{ scale: btnPulse }] },
            ]}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                style={{ borderRadius: 16, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={loading ? ['#5A9A56', '#5A9A56', '#5A9A56'] : ['#72C96D', '#65B361', '#4FA14B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.submitBtnGradient}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
                  }
                  <Text style={s.submitBtnText}>
                    {loading ? t('newPassword.submittingBtn') : t('newPassword.submitBtn')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

          </Animated.View>
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
  scroll:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },

  card: {
    width: '100%', maxWidth: 680,
    borderRadius: 28, paddingHorizontal: 36, paddingVertical: 34,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16, shadowRadius: 18, elevation: 8,
  },

  // ── Volver ──
  backRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  backIconWrap: { width: 38, height: 38, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  backText:     { fontSize: 16, fontWeight: '800' },

  // ── Ícono ──
  iconWrap:   { alignItems: 'center', marginBottom: 18, position: 'relative' },
  iconCircle: { width: 84, height: 84, borderRadius: 42, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  iconHalo:   { position: 'absolute', bottom: -6, width: 60, height: 12, borderRadius: 30 },
  icon:       { width: 46, height: 46 },

  // ── Título ──
  title:    { fontSize: 27, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  // ── Requisitos ──
  reqBox:   { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 18 },
  reqTitle: { fontSize: 11, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 },
  reqGrid:  { gap: 6 },
  reqRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reqText:  { fontSize: 13 },

  // ── Error token ──
  tokenError:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  tokenErrorText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  // ── Campos ──
  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 14, fontWeight: '700', marginBottom: 7 },
  errorText:  { color: Colors.error, fontSize: 12, fontWeight: '700', marginTop: 5 },

  // ── Botón ──
  submitBtn:         { marginTop: 8 },
  submitBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 16 },
  submitBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
