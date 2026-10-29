import { LanguageSelector, ThemeToggle } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { ROLE_VIDEO_SOURCES } from '@/shared/constants/roleVideoSources';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BiometricFace } from '@/features/landing/components/BiometricFace';
import { s } from '@/features/landing/components/landingStyles';

const ROLE_KEYS = ['coordinator', 'instructor', 'apprentice'] as const;
const ITEM_INDEXES = [0, 1, 2, 3] as const;

export default function LandingScreen() {
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
  const resolveVideoUri = (source: unknown) =>
    typeof source === 'string'
      ? source
      : (source as any)?.uri ?? (source as any)?.default ?? '';

  // Replace this reserved tile with the tutorial player when its asset is ready.
  const videoTile = (key: string, general = false) => {
    const roleVideoUri = resolveVideoUri(ROLE_VIDEO_SOURCES[key]);
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
      <View style={[s.logoVisualFrame, { borderColor: isDark ? '#3E8A55' : '#91CFA1', backgroundColor: isDark ? '#02180E' : Colors.light.surface }]}>
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
          : Colors.light.gradient}
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
                backgroundColor: isDark ? '#1A1A1A' : Colors.light.surface,
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
