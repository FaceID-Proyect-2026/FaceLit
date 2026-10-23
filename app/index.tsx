// ─────────────────────────────────────────────
//  app/index.tsx — Landing Page FaceLit
// ─────────────────────────────────────────────
import { LanguageSelector, ThemeToggle } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAuth } from '@/shared/contexts/AuthContext';
import { isMobileEntry, mobileEntryRoute } from '@/shared/utils/entryPlatform';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useRootNavigationState } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Image, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ROLE_KEYS = ['coordinator', 'instructor', 'apprentice'] as const;
const ITEM_INDEXES = [0, 1, 2, 3] as const;

// ─── Componente: Rostro biométrico animado ─────
// Icono person-circle limpio con anillo pulsante y línea de escaneo.
// El texto de estado usa t() directamente en cada render → se traduce
// inmediatamente al cambiar el idioma (RF i18n).
function BiometricFace({ color, isDark }: { color: string; isDark: boolean }) {
  const { t } = useTranslation();

  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const scanAnim   = useRef(new Animated.Value(0)).current;
  const dotAnim    = useRef(new Animated.Value(0.3)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  // Índice numérico en estado — el texto se obtiene con t() en cada render
  // para que responda al cambio de idioma sin reiniciar el timer.
  const [statusIdx, setStatusIdx] = useState(0);
  const STATUS_COUNT = 5;

  // t() keys en orden fijo — nunca se modifican
  const statusLabel = t(`hero.faceStatus.s${statusIdx}` as any,
    // fallback por si la clave aún no tiene traducción
    { defaultValue: ['Inicializando...','Analizando...','Verificando...','Calculando...','Listo'][statusIdx] }
  );

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.delay(300),
      Animated.timing(scanAnim, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.delay(300),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(dotAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      Animated.delay(1000),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ])).start();

    const timer = setInterval(() => {
      setStatusIdx(i => (i + 1) % STATUS_COUNT);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const pulseScale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, 0.45, 0.1] });
  const scanY        = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-72, 72] });
  const glowOpacity  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] });

  const SIZE  = 180;
  const bg    = isDark ? '#030C06' : '#F8FAFC';
  const pill  = color + '1A';
  const pillB = color + '44';

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Anillo pulsante exterior */}
      <Animated.View style={{
        position: 'absolute',
        width: SIZE + 40, height: SIZE + 40,
        borderRadius: (SIZE + 40) / 2,
        borderWidth: 1.5, borderColor: color,
        transform: [{ scale: pulseScale }],
        opacity: pulseOpacity,
        top: -20,
      }} />

      {/* Círculo principal */}
      <View style={{
        width: SIZE, height: SIZE,
        borderRadius: SIZE / 2,
        borderWidth: 2, borderColor: color,
        backgroundColor: bg,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Brillo */}
        <Animated.View style={{
          position: 'absolute', width: '100%', height: '100%',
          backgroundColor: color, opacity: glowOpacity, borderRadius: SIZE / 2,
        }} />

        {/* Línea de escaneo */}
        <Animated.View style={{
          position: 'absolute', width: '78%', height: 1.5,
          backgroundColor: color, opacity: 0.75,
          transform: [{ translateY: scanY }],
        }} />

        {/* Ícono de persona — limpio, sin detalles raros */}
        <Ionicons name="person-circle-outline" size={108} color={color} style={{ opacity: 0.92 }} />

        {/* Esquinas de encuadre */}
        {[
          { top: 10, left: 10 },
          { top: 10, right: 10 },
          { bottom: 10, left: 10 },
          { bottom: 10, right: 10 },
        ].map((pos, i) => {
          const isTop    = 'top'    in pos;
          const isLeft   = 'left'   in pos;
          return (
            <View key={i} style={[{
              position: 'absolute', width: 16, height: 16,
              borderColor: color,
              borderTopWidth:    isTop  ? 2.5 : 0,
              borderBottomWidth: !isTop ? 2.5 : 0,
              borderLeftWidth:   isLeft ? 2.5 : 0,
              borderRightWidth:  !isLeft ? 2.5 : 0,
              borderTopLeftRadius:     (isTop  && isLeft)  ? 3 : 0,
              borderTopRightRadius:    (isTop  && !isLeft) ? 3 : 0,
              borderBottomLeftRadius:  (!isTop && isLeft)  ? 3 : 0,
              borderBottomRightRadius: (!isTop && !isLeft) ? 3 : 0,
            }, pos as any]} />
          );
        })}

        {/* Puntos biométricos laterales */}
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 52, left: 36 }} />
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 52, right: 36 }} />
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 90, left: 30 }} />
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 90, right: 30 }} />
      </View>

      {/* Barra de estado — texto desde t() → reactivo al cambio de idioma */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: pill, borderWidth: 1, borderColor: pillB,
      }}>
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dotAnim }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 0.5 }}>
          {statusLabel}
        </Text>
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dotAnim }} />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────
export default function EntryScreen() {
  const { loading, isAuthenticated, role } = useAuth();
  const navigation = useRootNavigationState();
  // Static HTML and the first client render agree: no landing before device detection.
  const [mobile, setMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setMobile(isMobileEntry(Platform.OS, typeof navigator === 'undefined' ? undefined : navigator));
  }, []);

  if (mobile === null) return null;
  if (!mobile) return <LandingScreen />;
  if (loading || !navigation?.key) return null;
  return <Redirect href={mobileEntryRoute(isAuthenticated, role)} />;
}

function LandingScreen() {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();
  const { width }         = useWindowDimensions();
  const isWide            = width >= 820;
  const showNavigation    = width >= 1100;

  // ── Refs ──────────────────────────────────────
  const scrollRef    = useRef<ScrollView>(null);
  const processRef   = useRef<View>(null);
  const rolesRef     = useRef<View>(null);
  const facialRef    = useRef<View>(null);

  // ── Estado botón flotante ─────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ── Animated value para el scrollY (para reveal de cards) ──
  const scrollYAnim = useRef(new Animated.Value(0)).current;

  // ── Animación de transición al login ──────────
  // Efecto: la pantalla hace un zoom-out + fade-out profesional
  // mientras el login aparece deslizándose desde la derecha
  // (expo-router maneja la animación del stack, aquí solo
  // animamos el contenido de la landing antes de navegar)
  const transAnim  = useRef(new Animated.Value(1)).current;
  const transAlpha = useRef(new Animated.Value(1)).current;
  const transY     = useRef(new Animated.Value(0)).current;
  const pillPulse   = useRef(new Animated.Value(0)).current;
  const ambientMotion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pillPulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pillPulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    animation.start();
    const ambient = Animated.loop(
      Animated.sequence([
        Animated.timing(ambientMotion, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(ambientMotion, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    ambient.start();
    return () => {
      animation.stop();
      ambient.stop();
    };
  }, [ambientMotion, pillPulse]);

  const goToLogin = () => {
    Animated.parallel([
      Animated.timing(transAnim,  { toValue: 0.93, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(transAlpha, { toValue: 0,    duration: 280, useNativeDriver: true }),
      Animated.timing(transY,     { toValue: -24,  duration: 320, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start(() => {
      router.push(Routes.AUTH.LOGIN as any);
      // Resetear para cuando vuelvan
      transAnim.setValue(1);
      transAlpha.setValue(1);
      transY.setValue(0);
    });
  };

  // ── Sube al inicio de la página ───────────────
  const goToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ── Scroll a sección — web + móvil ───────────
  const scrollToSection = (ref: React.RefObject<View | null>) => {
    if (!ref.current) return;
    if (Platform.OS === 'web') {
      (ref.current as any)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return;
    }
    const node = (scrollRef.current as any)?.getScrollableNode?.();
    if (!node) return;
    (ref.current as View).measureLayout(
      node,
      (_l: number, top: number) => scrollRef.current?.scrollTo({ y: top - 80, animated: true }),
      () => {}
    );
  };

  // ── Colores locales ────────────────────────────
  const heading    = theme.text;
  const body       = theme.textSecondary;
  const muted      = theme.textMuted;
  const border     = theme.border;
  const controlColor = isDark ? Colors.white : theme.primaryDark;
  const pillScale = pillPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] });
  const pillOpacity = pillPulse.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const floatY = ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const cardFloatY = ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const cardScale = ambientMotion.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.004, 1] });
  const signalX = ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [-150, 150] });
  const haloScale = ambientMotion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });

  const loginButton = (label: string) => (
    <TouchableOpacity onPress={goToLogin} accessibilityRole="button" activeOpacity={0.85} style={s.primaryBtnWrap}>
      <LinearGradient colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtn}>
        <Ionicons name="person-outline" size={18} color={Colors.white} />
        <Text style={[s.primaryBtnText, { flexShrink: 1, textAlign: 'center' }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const accentColor = isDark ? theme.primary : theme.primaryDark;
  const contentStyles = StyleSheet.create({
    eyebrow: { ...s.eyebrow, color: accentColor },
    editorialTitle: { ...s.editorialTitle, color: theme.text },
    editorialText: { ...s.editorialText, color: theme.textSecondary },
    editorialSubtitle: { ...s.editorialSubtitle, color: theme.text },
    videoTile: { ...s.videoTile, backgroundColor: isDark ? 'rgba(4,42,25,0.94)' : '#F3FBF5', borderWidth: 1, borderColor: isDark ? '#327448' : '#B7DCC1' },
    videoOrbit: { ...s.videoOrbit, borderColor: theme.primary + '30' },
    playCircle: { ...s.playCircle, backgroundColor: theme.primaryFaint },
    videoTitle: { ...s.videoTitle, color: theme.text },
    videoDescription: { ...s.videoDescription, color: theme.textSecondary },
    videoLink: { ...s.videoLink, color: accentColor },
    processStep: { ...s.processStep, borderTopColor: theme.primaryDark, backgroundColor: isDark ? 'rgba(4,42,25,0.74)' : '#F7FCF8', borderColor: isDark ? '#1F5A34' : '#C8E5D0' },
    stepNumber: { ...s.stepNumber, color: accentColor },
    stepText: { ...s.stepText, color: theme.textSecondary },
    roleRow: { ...s.roleRow, borderBottomColor: theme.border, backgroundColor: isDark ? 'rgba(4,42,25,0.62)' : 'rgba(246,252,247,0.92)', borderColor: isDark ? '#1F5A34' : '#C8E5D0' },
    listBullet: { ...s.listBullet, color: theme.textSecondary },
    editorialListText: { ...s.editorialListText, color: theme.textSecondary },
    tutorialDescription: { ...s.tutorialDescription, color: theme.textSecondary },
    tutorialButton: { ...s.tutorialButton, backgroundColor: theme.primaryDark },
    facialNote: { ...s.facialNote, borderLeftColor: theme.primaryDark, backgroundColor: isDark ? 'rgba(4,42,25,0.82)' : '#E9F6EC' },
    gifSlot: { ...s.gifSlot, backgroundColor: isDark ? 'rgba(2,34,20,0.92)' : '#EAF5EE', borderWidth: 1, borderColor: isDark ? '#327448' : '#AAD7B6' },
    gifCaption: { ...s.gifCaption, color: theme.textMuted },
    closingBrand: { ...s.closingBrand, color: accentColor },
    contactDetailText: { ...s.contactDetailText, color: theme.text },
    editorialFooter: { ...s.editorialFooter, color: theme.textMuted },
    aboutBand: { ...s.contentBand, backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : '#EEF4EF', borderTopWidth: 1, borderBottomWidth: 1, borderColor: isDark ? 'rgba(101,179,97,0.16)' : '#D8E5DC' },
    accessBand: { ...s.contentBand, backgroundColor: isDark ? 'rgba(8,45,34,0.68)' : '#E3F0E6' },
    footerBand: { ...s.contentBand, backgroundColor: isDark ? 'rgba(3,18,10,0.78)' : '#F3F7F4' },
  });

  const columnStyle = [s.editorialColumn, !isWide && s.stackedContent];
  const titleStyle = [contentStyles.editorialTitle, isWide && s.editorialTitleWide];
  const contactItems = [
    { icon: 'mail-outline', text: t('landing.contactEmail') },
  ];
  const roleVideoSources = {
    'landingPage.roles.coordinator': require('@/assets/videos/coordinator.mp4'),
    'landingPage.roles.instructor': require('@/assets/videos/instructor.mp4'),
    'landingPage.roles.apprentice': require('@/assets/videos/apprentice.mp4'),
  } as const;

  const resolveVideoUri = (source: unknown) =>
    typeof source === 'string'
      ? source
      : (source as any)?.uri ?? (source as any)?.default ?? '';

  // Replace this reserved tile with the tutorial player when its asset is ready.
  const videoTile = (key: string, general = false) => {
    const roleVideoUri = resolveVideoUri(roleVideoSources[key as keyof typeof roleVideoSources]);
    const hasRoleVideo = Platform.OS === 'web' && Boolean(roleVideoUri);

    return (
    <Animated.View accessibilityLabel={t('landingPage.media.video')} style={[contentStyles.videoTile, hasRoleVideo && s.autoVideoTile, { transform: [{ translateY: cardFloatY }] }]}>
      {hasRoleVideo ? (
        <>
          {React.createElement('video' as any, {
            src: roleVideoUri,
            autoPlay: true,
            loop: true,
            muted: true,
            playsInline: true,
            controls: false,
            style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
          })}
          <View style={s.autoVideoShade} pointerEvents="none" />
        </>
      ) : (
        <>
      <View style={contentStyles.videoOrbit} pointerEvents="none" />
      <Animated.View style={[s.videoOrbitSoft, { borderColor: theme.primary + '28', transform: [{ scale: haloScale }] }]} pointerEvents="none" />
      <View style={contentStyles.playCircle}><Ionicons name="play" size={28} color={theme.primary} /></View>
      <Text style={contentStyles.videoTitle}>{t(`${key}.videoTitle`)}</Text>
      {general && <Text style={contentStyles.videoDescription}>{t(`${key}.videoText`)}</Text>}
      {general && <Text style={contentStyles.videoLink}>{t(`${key}.videoButton`)} →</Text>}
        </>
      )}
    </Animated.View>
    );
  };

  const tutorial = (key: string, showAction = true) => (
    <View style={s.tutorial}>
      <Text style={contentStyles.editorialSubtitle}>{t(`${key}.videoTitle`)}</Text>
      <Text style={contentStyles.tutorialDescription}>{t(`${key}.videoText`)}</Text>
      {showAction && (
        <TouchableOpacity disabled accessibilityRole="button" accessibilityState={{ disabled: true }} style={contentStyles.tutorialButton}>
          <Ionicons name="play" size={16} color={Colors.white} />
          <Text style={s.tutorialButtonText}>{t(`${key}.videoButton`)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const checklist = (key: string) => (
    <View style={s.editorialList}>
      {ITEM_INDEXES.map(index => (
        <View key={index} style={s.editorialListRow}>
          <Text style={contentStyles.listBullet}>•</Text>
          <Text style={contentStyles.editorialListText}>{t(`${key}.items.${index}`)}</Text>
        </View>
      ))}
    </View>
  );

  const logoSource = isDark
    ? require('@/assets/images/logo.png')
    : require('@/assets/images/logo2.png');
  const logoMotion = () => (
    <Animated.View accessibilityLabel={t('landingPage.media.gif')} style={[contentStyles.gifSlot, { transform: [{ translateY: cardFloatY }] }]}>
      <Animated.View style={[s.logoVisualHalo, { borderColor: theme.primaryDark + '66', transform: [{ scale: haloScale }] }]} />
      <View style={[s.logoVisualFrame, { borderColor: isDark ? '#3E8A55' : '#91CFA1', backgroundColor: isDark ? '#02180E' : Colors.white }]}>
        <Image source={logoSource} style={s.logoVisualImage} resizeMode="contain" />
        <Animated.View style={[s.logoScanLine, { backgroundColor: theme.primary, transform: [{ translateX: signalX }] }]} pointerEvents="none" />
      </View>
      <View style={s.logoVideoMeta}>
        <View style={[s.logoSignalDot, { backgroundColor: theme.primary }]} />
        <Text style={[s.logoSignalText, { color: accentColor }]}>{t('landingPage.hero.biometry')}</Text>
      </View>
    </Animated.View>
  );

  // ── Render ────────────────────────────────────
  return (
    <View style={s.page}>
      <LinearGradient
        colors={isDark
          ? ['#050505', '#071810', '#0D2B1A']
          : ['#FAFAFA', '#FFFFFF', '#F1F5F9']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Capa contenido — animada al navegar al login */}
      <Animated.View style={[s.safe, {
        transform: [{ scale: transAnim }, { translateY: transY }],
        opacity: transAlpha,
      }]}>
        <SafeAreaView style={s.safeInner}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollYAnim } } }],
            {
              useNativeDriver: false,
              listener: (e: any) => setShowScrollTop(e.nativeEvent.contentOffset.y > 300),
            }
          )}
          scrollEventThrottle={16}
        >

          <View style={s.originalTop}>
          {/* ── Header ── */}
          <View style={[s.header, { borderBottomColor: border }]}>
            <TouchableOpacity onPress={goToLogin} activeOpacity={0.8} style={s.logoBtn}>
              <Image source={logoSource} style={s.logo} resizeMode="contain" />
            </TouchableOpacity>

            {showNavigation && (
              <View style={s.nav}>
                <TouchableOpacity onPress={() => scrollToSection(processRef)} activeOpacity={0.75} style={s.navBtn}>
                  <Text style={[s.navText, { color: theme.text }]}>{t('landingPage.nav.how')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection(rolesRef)} activeOpacity={0.75} style={s.navBtn}>
                  <Text style={[s.navText, { color: theme.text }]}>{t('landingPage.nav.roles')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection(facialRef)} activeOpacity={0.75} style={s.navBtn}>
                  <Text style={[s.navText, { color: theme.text }]}>{t('landingPage.nav.facial')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.headerActions}>
              <LanguageSelector />
              <ThemeToggle />
            </View>
          </View>

          {/* ── Hero ── */}
          <View style={[s.hero, isWide && s.heroWide]}>
            <View style={[s.heroCopy, !isWide && s.stackedContent]}>
              <Animated.View style={[s.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.primaryFaint, borderColor: controlColor, opacity: pillOpacity, transform: [{ scale: pillScale }] }]}>
                <View style={[s.pillDot, { backgroundColor: controlColor }]} />
                <Text style={[s.pillText, { color: controlColor }]}>{t('landingPage.hero.pill')}</Text>
              </Animated.View>

              <Text style={[s.heroTitle, { color: heading }, isWide && s.heroTitleWide]}>
                {t('landingPage.hero.title1')}{'\n'}{t('landingPage.hero.title2')}{' '}
                <Text style={{ color: theme.primary }}>{t('landingPage.hero.titleAccent')}</Text>
              </Text>

              <View style={[s.heroDivider, { backgroundColor: theme.primary }]} />
              <Text style={[s.heroText, { color: body }]}>{t('landingPage.hero.description')}</Text>

              <View style={s.ctaRow}>
                {loginButton(t('landingPage.hero.login'))}
                <TouchableOpacity onPress={() => scrollToSection(processRef)} accessibilityRole="button" activeOpacity={0.85} style={[s.primaryBtnWrap, { borderWidth: 1, borderColor: theme.primary }]}>
                  <View style={s.primaryBtn}>
                    <Text style={[s.primaryBtnText, { color: controlColor, flexShrink: 1 }]}>{t('landingPage.hero.how')}</Text>
                  </View>
                </TouchableOpacity>
              </View>

            </View>

            {/* ── Mockup con rostro animado ── */}
            <Animated.View style={[s.heroVisual, !isWide && s.stackedContent, {
              backgroundColor: isDark ? 'rgba(25,118,210,0.03)' : '#F1F5F9',
              borderColor: border,
              transform: [{ translateY: floatY }],
            }]}>
              <View style={[s.techGrid, { borderColor: isDark ? 'rgba(101,179,97,0.18)' : 'rgba(74,145,70,0.16)' }]} pointerEvents="none" />
              <Animated.View style={[s.heroSignal, { backgroundColor: theme.primary, transform: [{ translateX: signalX }] }]} pointerEvents="none" />
              {/* Teléfono mock */}
              <Animated.View style={[s.mockPhone, {
                borderColor: theme.borderStrong,
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                transform: [{ translateY: floatY }],
              }]}>
                {/* Header del teléfono */}
                {/* Área de escaneo con rostro animado */}
                <View style={[s.faceArea, { borderColor: theme.borderStrong, backgroundColor: isDark ? '#121212' : '#F8F9FA' }]}>
                  <BiometricFace color={theme.primary} isDark={isDark} />
                </View>

                {/* Footer del teléfono */}
                <View style={[s.phoneInfo, { borderTopColor: border }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
                  <Text style={[s.phoneInfoText, { color: muted }]}>{t('landingPage.hero.phoneInfo')}</Text>
                </View>
              </Animated.View>

              {/* Decoración exterior — puntos flotantes */}
              <View style={[s.floatBadge, s.floatBadgeTR, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.primaryFaint, borderColor: controlColor }]}>
                <Ionicons name="finger-print-outline" size={14} color={controlColor} />
                <Text style={[s.floatBadgeText, { color: controlColor }]}>{t('landingPage.hero.biometry')}</Text>
              </View>
              <View style={[s.floatBadge, s.floatBadgeBL, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.primaryFaint, borderColor: controlColor }]}>
                <Ionicons name="lock-closed-outline" size={14} color={controlColor} />
                <Text style={[s.floatBadgeText, { color: controlColor }]}>{t('landingPage.hero.secure')}</Text>
              </View>
            </Animated.View>
          </View>

          </View>

          {/* HTML composition: explanation in a neutral contrast band. */}
          <View style={contentStyles.aboutBand}>
            <View style={[s.editorialInner, s.aboutOnlyText]}>
              <View style={s.aboutCopy}>
                <Text style={contentStyles.eyebrow}>{t('landingPage.about.label')}</Text>
                <Text style={titleStyle}>{t('landingPage.about.title')}</Text>
                <Text style={contentStyles.editorialText}>{t('landingPage.about.text')}</Text>
                <Text style={contentStyles.editorialText}>{t('landingPage.about.roles')}</Text>
              </View>
            </View>
          </View>

          {/* Four open columns, without stacked information cards. */}
          <View ref={processRef} style={[s.contentBand, { backgroundColor: 'transparent' }]}>
            <View style={s.editorialInner}>
              <Text style={contentStyles.eyebrow}>{t('landingPage.nav.how')}</Text>
              <Text style={[...titleStyle, { maxWidth: 750 }]}>{t('landingPage.process.title')}</Text>
              <View style={s.processGrid}>
                {ITEM_INDEXES.map(index => (
                  <Animated.View key={index} style={[contentStyles.processStep, { width: isWide ? '23%' : width >= 480 ? '47%' : '100%', transform: [{ translateY: index % 2 === 0 ? cardFloatY : floatY }, { scale: cardScale }] }]}>
                    <Text style={contentStyles.stepNumber}>0{index + 1}</Text>
                    <Text style={contentStyles.editorialSubtitle}>{t(`landingPage.process.steps.${index}.title`)}</Text>
                    <Text style={contentStyles.stepText}>{t(`landingPage.process.steps.${index}.text`)}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          {/* Video slots alternate with each role's complete explanation. */}
          <View ref={rolesRef} style={[s.contentBand, { backgroundColor: 'transparent' }]}>
            <View style={s.editorialInner}>
              <Text style={contentStyles.eyebrow}>{t('landingPage.rolesLabel')}</Text>
              <Text style={titleStyle}>{t('landingPage.rolesTitle')}</Text>
              {ROLE_KEYS.map((role, index) => (
                <Animated.View key={role} style={[contentStyles.roleRow, isWide && s.editorialRowWide, isWide && index === 1 && { flexDirection: 'row-reverse' }, index === 2 && { borderBottomWidth: 0 }, { transform: [{ translateY: index % 2 === 0 ? cardFloatY : floatY }, { scale: cardScale }] }]}>
                  <View style={[columnStyle, isWide && s.roleVideoColumnWide]}>{videoTile(`landingPage.roles.${role}`)}</View>
                  <View style={[columnStyle, isWide && s.roleTextColumnCompact]}>
                    <Text style={contentStyles.eyebrow}>0{index + 1} / {t(`landingPage.roles.${role}.label`)}</Text>
                    <Text style={titleStyle}>{t(`landingPage.roles.${role}.title`)}</Text>
                    <Text style={contentStyles.editorialText}>{t(`landingPage.roles.${role}.text`)}</Text>
                    <Text style={contentStyles.editorialSubtitle}>{t('landingPage.capabilities')}</Text>
                    {checklist(`landingPage.roles.${role}`)}
                    {tutorial(`landingPage.roles.${role}`, false)}
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Facial section: a dedicated GIF slot, then two explanatory columns. */}
          <View ref={facialRef} style={[s.contentBand, { backgroundColor: 'transparent' }]}>
            <View style={s.editorialInner}>
              <View style={[s.editorialRow, isWide && s.editorialRowWide]}>
                <View style={columnStyle}>
                  <Text style={contentStyles.eyebrow}>{t('landingPage.nav.facial')}</Text>
                  <Text style={titleStyle}>{t('landingPage.facial.title')}</Text>
                  <Text style={contentStyles.editorialText}>{t('landingPage.facial.text')}</Text>
                  <View style={contentStyles.facialNote}>
                    <Text style={[contentStyles.editorialText, { marginBottom: 0 }]}>{t('landingPage.facial.distinction')}</Text>
                  </View>
                </View>
                <View style={columnStyle}>{logoMotion()}</View>
              </View>
              <View style={[s.editorialRow, isWide && s.editorialRowWide, { marginTop: 35 }]}>
                <View style={columnStyle}>
                  <Text style={contentStyles.editorialSubtitle}>{t('landingPage.facial.meshTitle')}</Text>
                  <Text style={contentStyles.editorialText}>{t('landingPage.facial.meshText')}</Text>
                </View>
                <View style={columnStyle}>
                  <Text style={contentStyles.editorialSubtitle}>{t('landingPage.facial.prepare')}</Text>
                  {checklist('landingPage.facial')}
                  {tutorial('landingPage.facial', false)}
                </View>
              </View>
            </View>
          </View>

          <View style={contentStyles.accessBand}>
            <View style={[s.editorialInner, s.centeredContent]}>
              <Text style={contentStyles.eyebrow}>{t('landingPage.accessLabel')}</Text>
              <Text style={[...titleStyle, s.centeredText]}>{t('landingPage.access.title')}</Text>
              <Text style={[contentStyles.editorialText, s.centeredText, { maxWidth: 740 }]}>{t('landingPage.access.text')}</Text>
              <Text style={[contentStyles.editorialText, s.centeredText]}>{t('landingPage.access.help')}</Text>
              {loginButton(t('landingPage.hero.login'))}
            </View>
          </View>

          {/* Closing contact details replace the repeated sign-in button. */}
          <View style={contentStyles.footerBand}>
            <View style={[s.editorialInner, s.centeredContent]}>
              <Text style={contentStyles.closingBrand}>FaceLit.</Text>
              <Text style={[...titleStyle, s.centeredText]}>{t('landingPage.closing.title')}</Text>
              <Text style={[contentStyles.editorialText, s.centeredText, { maxWidth: 730 }]}>{t('landingPage.closing.text')}</Text>
              <View style={s.closingContacts}>
                {contactItems.map(({ icon, text }) => (
                  <View key={icon} style={s.contactDetail}>
                    <Ionicons name={icon as any} size={18} color={accentColor} />
                    <Text style={contentStyles.contactDetailText}>{text}</Text>
                  </View>
                ))}
              </View>
              <Text style={contentStyles.editorialFooter}>{t('landingPage.footer')}</Text>
            </View>
          </View>

        </ScrollView>

        {/* ── Botón flotante — sube al inicio ── */}
        {showScrollTop && (
          <TouchableOpacity onPress={goToTop} accessibilityRole="button" accessibilityLabel={t('landingPage.backToTop')} activeOpacity={0.85} style={s.fabWrap}>
            <LinearGradient
              colors={['#72C96D', '#4FA14B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.fab}
            >
              <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

      </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────
const s = StyleSheet.create({
  page:      { flex: 1 },
  safe:      { flex: 1, backgroundColor: 'transparent' },
  safeInner: { flex: 1, backgroundColor: 'transparent' },
  scroll: { width: '100%', alignItems: 'center' },
  originalTop: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },

  header:        { width: '100%', maxWidth: 1120, minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, paddingVertical: 14, zIndex: 999 },
  logoBtn:       { flexShrink: 0 },
  logo:          { width: 140, height: 48 },
  nav:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  navText:       { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  hero:          { width: '100%', maxWidth: 1180, alignItems: 'center', gap: 34, paddingTop: 56, paddingBottom: 72 },
  heroWide:      { flexDirection: 'row', alignItems: 'center', gap: 52 },
  heroCopy:      { flex: 1, width: '100%' },
  stackedContent: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  pill:          { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 18 },
  pillDot:       { width: 8, height: 8, borderRadius: 4 },
  pillText:      { fontSize: FontSize.xs, fontWeight: FontWeight.black, textTransform: 'uppercase', flexShrink: 1 },
  heroTitle:     { fontSize: FontSize['5xl'], lineHeight: 46, fontWeight: FontWeight.black, maxWidth: 700 },
  heroTitleWide: { fontSize: 56, lineHeight: 66 },
  heroDivider:   { width: 56, height: 4, borderRadius: 2, marginVertical: 20 },
  heroText:      { fontSize: FontSize.lg, lineHeight: 26, maxWidth: 620 },

  ctaRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 30 },
  primaryBtnWrap: { borderRadius: 10, overflow: 'hidden', minWidth: 170, maxWidth: '100%' },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 15, justifyContent: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.black },


  // ── Mockup ──
  heroVisual:    { flex: 1, width: '100%', minHeight: 500, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden',
                   shadowColor: '#172B4D', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.16, shadowRadius: 34, elevation: 10 },
  techGrid:      { position: 'absolute', left: 26, right: 26, top: 26, bottom: 26, borderWidth: 1, borderRadius: 24, opacity: 0.72 },
  heroSignal:    { position: 'absolute', width: 210, height: 2, top: 82, opacity: 0.38, borderRadius: 2 },
  mockPhone:     { width: 290, maxWidth: '95%', borderRadius: 38, borderWidth: 2, alignItems: 'center', padding: 18, paddingTop: 26, paddingBottom: 18,
                   shadowColor: '#65B361', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12 },
  faceArea:      { width: 220, height: 240, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 14 },
  phoneInfo:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingTop: 12, width: '100%', justifyContent: 'center' },
  phoneInfoText: { fontSize: FontSize.xs, lineHeight: 16, textAlign: 'center', flex: 1 },
  // Badges flotantes
  floatBadge:     { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  floatBadgeTR:   { top: 16, right: 16 },
  floatBadgeBL:   { bottom: 16, left: 16 },
  floatBadgeText: { fontSize: 11, fontWeight: '800' },

  contentBand: { width: '100%', paddingHorizontal: '7%', paddingVertical: 65, alignItems: 'center' },
  editorialInner: { width: '100%', maxWidth: 1440 },
  editorialRow: { width: '100%', maxWidth: 1440, gap: 35 },
  editorialRowWide: { flexDirection: 'row', gap: 55, alignItems: 'center' },
  editorialColumn: { flex: 1, minWidth: 0 },
  aboutOnlyText: { alignItems: 'flex-start' },
  aboutCopy: { width: '100%', maxWidth: 930 },
  roleVideoColumnWide: { flex: 1.35 },
  roleTextColumnCompact: { flex: 0.9 },
  eyebrow: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  editorialTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -1, marginBottom: 20 },
  editorialTitleWide: { fontSize: 43, lineHeight: 50 },
  editorialText: { fontSize: 16, lineHeight: 29, fontWeight: '400', marginBottom: 20 },
  editorialSubtitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', marginBottom: 12 },
  videoTile: { width: '100%', minHeight: 310, borderRadius: 25, padding: 30, gap: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
               shadowColor: '#0B3D23', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.16, shadowRadius: 28, elevation: 9 },
  autoVideoTile: { padding: 0, minHeight: 430, backgroundColor: '#02180E' },
  autoVideoShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, backgroundColor: 'rgba(2,24,14,0.18)' },
  videoOrbit: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: 'rgba(131,228,162,0.14)' },
  videoOrbitSoft: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, opacity: 0.9 },
  playCircle: { width: 65, height: 65, borderRadius: 33, alignItems: 'center', justifyContent: 'center', },
  videoTitle: { color: Colors.white, fontSize: 18, lineHeight: 26, fontWeight: '700', textAlign: 'center' },
  videoDescription: { fontSize: 14, lineHeight: 24, maxWidth: 370, textAlign: 'center' },
  videoLink: { color: Colors.white, fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  processGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 22, marginTop: 20 },
  processStep: { borderTopWidth: 3, borderWidth: 1, borderRadius: 18, padding: 20, minHeight: 230,
                 shadowColor: '#0B3D23', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 6 },
  stepNumber: { fontSize: 13, fontWeight: '800', marginBottom: 16 },
  stepText: { fontSize: 14, lineHeight: 25 },
  roleRow: { gap: 35, padding: 28, marginTop: 24, borderBottomWidth: 1, borderWidth: 1, borderRadius: 26,
             shadowColor: '#0B3D23', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 7 },
  editorialList: { gap: 6, marginTop: 6, marginBottom: 24 },
  editorialListRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  listBullet: { fontSize: 15, lineHeight: 28 },
  editorialListText: { flex: 1, fontSize: 15, lineHeight: 28, fontWeight: '400' },
  tutorial: { marginTop: 6, alignItems: 'flex-start' },
  tutorialDescription: { fontSize: 14, lineHeight: 25, marginBottom: 14 },
  tutorialButton: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, },
  tutorialButtonText: { flexShrink: 1, color: Colors.white, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  facialNote: { borderLeftWidth: 2,  padding: 20, marginTop: 5 },
  gifSlot: { width: '100%', minHeight: 360, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 18, overflow: 'hidden',
             shadowColor: '#0B3D23', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.18, shadowRadius: 32, elevation: 9 },
  gifCaption: { fontSize: 14, lineHeight: 24, textAlign: 'center' },
  logoVisualHalo: { position: 'absolute', width: 330, height: 330, borderRadius: 165, borderWidth: 1, opacity: 0.78 },
  logoVisualFrame: { width: '100%', maxWidth: 420, minHeight: 235, borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 24,
                     shadowColor: '#0B3D23', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.24, shadowRadius: 30, elevation: 9 },
  logoVisualImage: { width: '100%', height: 190 },
  logoScanLine: { position: 'absolute', width: 170, height: 2, opacity: 0.55, borderRadius: 2, top: 36 },
  logoVideoMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(101,179,97,0.10)' },
  logoSignalDot: { width: 8, height: 8, borderRadius: 4 },
  logoSignalText: { fontSize: 12, lineHeight: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  centeredContent: { alignItems: 'center' },
  centeredText: { textAlign: 'center' },
  closingBrand: { fontSize: 27, fontWeight: '900', marginBottom: 18 },
  closingContacts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginTop: 8 },
  contactDetail: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactDetailText: { fontSize: 15, lineHeight: 24 },
  editorialFooter: { fontSize: 13, lineHeight: 22, textAlign: 'center', marginTop: 25 },

  // ── Botón flotante ──
  fabWrap: {
    position: 'absolute', bottom: 32, right: 32,
    borderRadius: 28, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  fab: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
});
