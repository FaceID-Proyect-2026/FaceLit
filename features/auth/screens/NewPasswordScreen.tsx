import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Animated, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { s } from '@/features/auth/components/NewPasswordStyles';
import { FloatingParticle } from '@/features/auth/components/NewPassword/FloatingParticle';
import { SuccessModal } from '@/features/auth/components/NewPassword/SuccessModal';
import { AnimatedInputRow } from '@/features/auth/components/NewPassword/AnimatedInputRow';

import { useNewPasswordScreen } from '@/features/auth/hooks/useNewPasswordScreen';

export default function NewPasswordScreen() {
  const {
    t,
    isDark,
    theme,
    password,
    confirmPassword,
    errors,
    requirements,
    loading,
    showSuccess,
    isAccessLink,
    recoveryEmail,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    showPwd,
    setShowPwd,
    showConfirm,
    setShowConfirm,
    cardAnim,
    cardSlide,
    iconAnim,
    titleAnim,
    reqAnim,
    field1Anim,
    field2Anim,
    btnAnim,
    btnPulse,
    makeSlide,
    iconScale,
    text,
    muted,
    cardBg,
    inputBg,
    inputBdr,
    PARTICLES,
  } = useNewPasswordScreen();
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

              {errors.code && isAccessLink ? (
                <TouchableOpacity onPress={() => router.replace({ pathname: Routes.AUTH.PASSWORD_RECOVERY as any, params: { email: recoveryEmail ?? '' } })}>
                  <Text style={[s.backText, { color: theme.primary }]}>Solicitar nuevas instrucciones de acceso</Text>
                </TouchableOpacity>
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
