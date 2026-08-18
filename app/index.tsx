// ─────────────────────────────────────────────
//  app/index.tsx — Landing Page FaceLit
// ─────────────────────────────────────────────
import { useRef, useState } from 'react';
import {
  Image, Platform, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Routes } from '@/shared/constants/routes';
import { ThemeToggle, LanguageSelector } from '@/shared/components/ui';

// ─── Tipos ────────────────────────────────────
interface FeatureItem  { icon: string; number: string; title: string; text: string; }
interface TechItem     { icon: string; label: string; }
interface PillItem     { icon: string; label: string; }
interface ContactItem  { icon: string; text: string;  }

// ─── Iconos estáticos ─────────────────────────
const PROBLEM_ICONS = ['time-outline', 'alert-circle-outline', 'person-remove-outline'] as const;
const OFFER_ICONS   = ['scan-outline', 'finger-print-outline', 'speedometer-outline', 'bar-chart-outline', 'phone-portrait-outline'] as const;
const CLOSING_ICONS = ['trending-up-outline', 'shield-outline', 'book-outline'] as const;

const TECHNOLOGIES: TechItem[] = [
  { icon: 'scan-outline',           label: 'tech.label1' },
  { icon: 'color-palette-outline',  label: 'tech.label2' },
  { icon: 'phone-portrait-outline', label: 'tech.label3' },
  { icon: 'layers-outline',         label: 'tech.label4' },
  { icon: 'server-outline',         label: 'tech.label5' },
  { icon: 'document-text-outline',  label: 'tech.label6' },
  { icon: 'lock-closed-outline',    label: 'tech.label7' },
];

const OBJECTIVE_KEYS = [
  'objective.char1', 'objective.char2', 'objective.char3',
  'objective.char4', 'objective.char5', 'objective.char6',
  'objective.char7', 'objective.char8', 'objective.char9',
] as const;

// ─── Sub-components ───────────────────────────
function MetricCard({ icon, value, label, color, muted }: {
  icon: string; value: string; label: string; color: string; muted: string;
}) {
  return (
    <View style={mc.wrap}>
      <Ionicons name={icon as any} size={18} color={color} style={{ marginBottom: 4 }} />
      <Text style={[mc.value, { color }]}>{value}</Text>
      <Text style={[mc.label, { color: muted }]}>{label}</Text>
    </View>
  );
}
const mc = StyleSheet.create({
  wrap:  { minWidth: 90, alignItems: 'center' },
  value: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  label: { fontSize: FontSize.xs, marginTop: 2, fontWeight: FontWeight.bold, textAlign: 'center' },
});

function FeatureCard({ icon, number, title, text, bg, border, heading, body, accent }: {
  icon: string; number: string; title: string; text: string;
  bg: string; border: string; heading: string; body: string; accent: string;
}) {
  return (
    <View style={[fc.wrap, { backgroundColor: bg, borderColor: border }]}>
      <View style={[fc.iconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon as any} size={22} color={accent} />
      </View>
      <Text style={[fc.number, { color: accent  }]}>{number}</Text>
      <Text style={[fc.title,  { color: heading }]}>{title}</Text>
      <Text style={[fc.text,   { color: body    }]}>{text}</Text>
    </View>
  );
}
const fc = StyleSheet.create({
  wrap:     { flex: 1, minWidth: 220, borderRadius: 12, borderWidth: 1, padding: 22 },
  iconWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  number:   { fontSize: FontSize.sm, fontWeight: FontWeight.black, marginBottom: 6 },
  title:    { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 8 },
  text:     { fontSize: FontSize.md, lineHeight: 21 },
});

// ─── Screen ───────────────────────────────────
export default function LandingScreen() {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();
  const { width }         = useWindowDimensions();
  const isWide            = width >= 820;

  // ── Refs ──────────────────────────────────────
  const scrollRef    = useRef<ScrollView>(null);
  const offersRef    = useRef<View>(null);
  const objectiveRef = useRef<View>(null);
  const contactRef   = useRef<View>(null);

  // ── Estado botón flotante ─────────────────────
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ── Navegación al login desde el logo ─────────
  const goToLogin = () => {
    router.push(Routes.AUTH.LOGIN as any);
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
  const cardBg     = isDark ? '#111827'                 : Colors.white;
  const softCardBg = isDark ? '#1A1F2E'                 : '#F4FAF2';
  const heading    = isDark ? Colors.dark.text          : '#0D1F0A';
  const body       = isDark ? Colors.dark.textSecondary : '#3D5C3A';
  const muted      = isDark ? Colors.dark.textMuted     : Colors.light.textMuted;
  const border     = isDark ? 'rgba(101,179,97,0.18)'   : 'rgba(101,179,97,0.25)';

  // ── Arrays con t() ────────────────────────────
  const PROBLEMS: FeatureItem[] = [
    { icon: PROBLEM_ICONS[0], number: '01', title: t('problems.item1Title'), text: t('problems.item1Text') },
    { icon: PROBLEM_ICONS[1], number: '02', title: t('problems.item2Title'), text: t('problems.item2Text') },
    { icon: PROBLEM_ICONS[2], number: '03', title: t('problems.item3Title'), text: t('problems.item3Text') },
  ];

  const OFFERS: FeatureItem[] = [
    { icon: OFFER_ICONS[0], number: '01', title: t('offers.item1Title'), text: t('offers.item1Text') },
    { icon: OFFER_ICONS[1], number: '02', title: t('offers.item2Title'), text: t('offers.item2Text') },
    { icon: OFFER_ICONS[2], number: '03', title: t('offers.item3Title'), text: t('offers.item3Text') },
    { icon: OFFER_ICONS[3], number: '04', title: t('offers.item4Title'), text: t('offers.item4Text') },
    { icon: OFFER_ICONS[4], number: '05', title: t('offers.item5Title'), text: t('offers.item5Text') },
  ];

  const CLOSING_PILLS: PillItem[] = [
    { icon: CLOSING_ICONS[0], label: t('innovation.pill1') },
    { icon: CLOSING_ICONS[1], label: t('innovation.pill2') },
    { icon: CLOSING_ICONS[2], label: t('innovation.pill3') },
  ];

  const CONTACT_ITEMS: ContactItem[] = [
    { icon: 'mail-outline',     text: t('landing.contactEmail')    },
    { icon: 'call-outline',     text: t('landing.contactPhone')    },
    { icon: 'location-outline', text: t('landing.contactLocation') },
  ];

  const logoSource = isDark
    ? require('@/assets/images/logo.png')
    : require('@/assets/images/logo2.png');

  // ── Render ────────────────────────────────────
  return (
    <View style={s.page}>
      <LinearGradient
        colors={isDark
          ? ['#050505', '#071810', '#0D2B1A']
          : ['#FFFFFF', '#F2FFF0', '#E8F8E4']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={e => setShowScrollTop(e.nativeEvent.contentOffset.y > 300)}
          scrollEventThrottle={16}
        >

          {/* ── Header ── */}
          <View style={[s.header, { borderBottomColor: border }]}>

            {/* Logo → navega al login */}
            <TouchableOpacity onPress={goToLogin} activeOpacity={0.8} style={s.logoBtn}>
              <Image source={logoSource} style={s.logo} resizeMode="contain" />
            </TouchableOpacity>

            {/* Nav links */}
            {isWide && (
              <View style={s.nav}>
                <TouchableOpacity onPress={() => scrollToSection(offersRef)} activeOpacity={0.75} style={s.navBtn}>
                  <Text style={[s.navText, { color: theme.primary }]}>{t('nav.app')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection(objectiveRef)} activeOpacity={0.75} style={s.navBtn}>
                  <Text style={[s.navText, { color: theme.primary }]}>{t('nav.security')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection(contactRef)} activeOpacity={0.75} style={s.navBtn}>
                  <Text style={[s.navText, { color: theme.primary }]}>{t('nav.contact')}</Text>
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
            <View style={s.heroCopy}>
              <View style={[s.pill, { backgroundColor: theme.primaryFaint, borderColor: border }]}>
                <View style={[s.pillDot, { backgroundColor: theme.primary }]} />
                <Text style={[s.pillText, { color: theme.primary }]}>{t('hero.pill')}</Text>
              </View>

              <Text style={[s.heroTitle, { color: heading }, isWide && s.heroTitleWide]}>
                {t('hero.title1')}{'\n'}{t('hero.title2')}{' '}
                <Text style={{ color: theme.primary }}>{t('hero.titleAccent')}</Text>
              </Text>

              <View style={[s.heroDivider, { backgroundColor: theme.primary }]} />
              <Text style={[s.heroText, { color: body }]}>{t('hero.description')}</Text>

              <View style={s.ctaRow}>
                <TouchableOpacity
                  onPress={() => router.push(Routes.AUTH.REGISTER as any)}
                  activeOpacity={0.85}
                  style={s.primaryBtnWrap}
                >
                  <LinearGradient
                    colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.primaryBtn}
                  >
                    <Ionicons name="person-add-outline" size={18} color={Colors.white} />
                    <Text style={s.primaryBtnText}>{t('hero.createAccount')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(Routes.AUTH.LOGIN as any)}
                  activeOpacity={0.85}
                  style={[s.secondaryBtn, {
                    borderColor:     theme.primary,
                    backgroundColor: isDark ? 'rgba(101,179,97,0.06)' : 'rgba(101,179,97,0.04)',
                  }]}
                >
                  <Ionicons name="person-outline" size={18} color={theme.primary} />
                  <Text style={[s.secondaryBtnText, { color: theme.primary }]}>{t('hero.login')}</Text>
                </TouchableOpacity>
              </View>

              <View style={s.metrics}>
                <MetricCard icon="time-outline"             value="24/7" label={t('hero.metric1')} color={theme.primary} muted={muted} />
                <MetricCard icon="scan-outline"             value="IA"   label={t('hero.metric2')} color={theme.primary} muted={muted} />
                <MetricCard icon="checkmark-circle-outline" value="100%" label={t('hero.metric3')} color={theme.primary} muted={muted} />
                <MetricCard icon="shield-checkmark-outline" value="0"    label={t('hero.metric4')} color={theme.primary} muted={muted} />
              </View>
            </View>

            {/* Mockup */}
            <View style={[s.heroVisual, {
              backgroundColor: isDark ? 'rgba(101,179,97,0.04)' : 'rgba(101,179,97,0.06)',
              borderColor: border,
            }]}>
              <View style={[s.mockPhone, {
                borderColor: theme.primary,
                backgroundColor: isDark ? '#080F0B' : Colors.white,
              }]}>
                <View style={s.phoneBrand}>
                  <Image source={logoSource} style={s.phoneLogo} resizeMode="contain" />
                </View>
                <View style={[s.faceArea, { borderColor: theme.primary }]}>
                  <View style={[s.cornerTL, { borderColor: theme.primary }]} />
                  <View style={[s.cornerTR, { borderColor: theme.primary }]} />
                  <View style={[s.cornerBL, { borderColor: theme.primary }]} />
                  <View style={[s.cornerBR, { borderColor: theme.primary }]} />
                  <Ionicons name="scan-circle-outline" size={90} color={theme.primary} style={{ opacity: 0.85 }} />
                  <View style={[s.scanLine, { backgroundColor: theme.primary }]} />
                </View>
                <View style={[s.phoneInfo, { borderTopColor: border }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                  <Text style={[s.phoneInfoText, { color: muted }]}>{t('hero.phoneInfo')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── ¿Por qué nace FaceLit? ── */}
          <View style={[s.section, { borderTopColor: border, borderTopWidth: 1 }]}>
            <Text style={[s.sectionTitle, { color: heading }]}>{t('problems.sectionTitle')}</Text>
            <Text style={[s.sectionText,  { color: body    }]}>{t('problems.sectionText')}</Text>
            <View style={[s.features, isWide && s.featuresWide]}>
              {PROBLEMS.map(item => (
                <FeatureCard key={item.number} {...item} bg={softCardBg} border={border} heading={heading} body={body} accent={theme.primary} />
              ))}
            </View>
          </View>

          {/* ── ¿Qué ofrece FaceLit? ── */}
          <View ref={offersRef} style={s.section}>
            <Text style={[s.sectionTitle, { color: heading }]}>{t('offers.sectionTitle')}</Text>
            <View style={[s.features, isWide && s.featuresWide]}>
              {OFFERS.map(item => (
                <FeatureCard key={item.number} {...item} bg={softCardBg} border={border} heading={heading} body={body} accent={theme.primary} />
              ))}
            </View>
          </View>

          {/* ── Objetivo + Tecnologías ── */}
          <View ref={objectiveRef} style={[s.split, isWide && s.splitWide]}>
            <View style={s.splitCopy}>
              <Text style={[s.sectionTitle, { color: heading }]}>{t('objective.title')}</Text>
              <Text style={[s.sectionText,  { color: body    }]}>{t('objective.description')}</Text>
              <View style={s.checkList}>
                {OBJECTIVE_KEYS.map(key => (
                  <View key={key} style={s.checkRow}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[s.checkItem, { color: heading }]}>{t(key)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[s.techPanel, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.techTitle,    { color: heading }]}>{t('tech.title')}</Text>
              <Text style={[s.techSubtitle, { color: muted   }]}>{t('tech.subtitle')}</Text>
              <View style={s.techGrid}>
                {TECHNOLOGIES.map(({ icon, label }) => (
                  <View key={label} style={[s.techBadge, {
                    backgroundColor: isDark ? 'rgba(101,179,97,0.10)' : 'rgba(101,179,97,0.08)',
                    borderColor: border,
                  }]}>
                    <Ionicons name={icon as any} size={16} color={theme.primary} />
                    <Text style={[s.techBadgeText, { color: heading }]}>{t(label)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Innovación ── */}
          <View style={[s.innovationBanner, { backgroundColor: softCardBg, borderColor: border }]}>
            <Text style={[s.innovationTitle, { color: heading }]}>{t('innovation.title')}</Text>
            <Text style={[s.innovationText,  { color: body    }]}>{t('innovation.text')}</Text>
            <View style={s.innovationPills}>
              {CLOSING_PILLS.map(({ icon, label }) => (
                <View key={label} style={[s.innovationPill, { backgroundColor: theme.primaryFaint, borderColor: border }]}>
                  <Ionicons name={icon as any} size={16} color={theme.primary} />
                  <Text style={[s.innovationPillText, { color: theme.primary }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Contacto ── */}
          <View ref={contactRef} style={[s.contact, { backgroundColor: softCardBg, borderColor: border }]}>
            <View style={s.contactCopy}>
              <Text style={[s.contactTitle, { color: heading }]}>{t('landing.contactTitle')}</Text>
              <Text style={[s.contactText,  { color: body    }]}>{t('landing.contactText')}</Text>
            </View>
            <View style={s.contactList}>
              {CONTACT_ITEMS.map(({ icon, text }) => (
                <View key={text} style={s.contactRow}>
                  <Ionicons name={icon as any} size={15} color={theme.primary} />
                  <Text style={[s.contactItem, { color: heading }]}>{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <Text style={[s.footerText, { color: muted }]}>FaceLit © 2026</Text>
            <View style={s.footerLinks}>
              <TouchableOpacity onPress={() => router.push(Routes.AUTH.PRIVACY_NOTICE as any)}>
                <Text style={[s.footerLink, { color: theme.primary }]}>{t('landing.footerPrivacy')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(Routes.AUTH.RIGHTS as any)}>
                <Text style={[s.footerLink, { color: theme.primary }]}>{t('landing.footerRights')}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>

        {/* ── Botón flotante — sube al inicio ── */}
        {showScrollTop && (
          <TouchableOpacity onPress={goToTop} activeOpacity={0.85} style={s.fabWrap}>
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
    </View>
  );
}

// ─── Styles ───────────────────────────────────
const s = StyleSheet.create({
  page:   { flex: 1 },
  safe:   { flex: 1, backgroundColor: 'transparent' },
  scroll: { width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 34 },

  header:        { width: '100%', maxWidth: 1120, minHeight: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, paddingVertical: 14, zIndex: 999 },
  logoBtn:       { flexShrink: 0 },
  logo:          { width: 140, height: 48 },
  nav:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  navText:       { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  hero:          { width: '100%', maxWidth: 1120, alignItems: 'center', gap: 34, paddingTop: 46, paddingBottom: 56 },
  heroWide:      { flexDirection: 'row', alignItems: 'center', gap: 52 },
  heroCopy:      { flex: 1, width: '100%' },
  pill:          { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 18 },
  pillDot:       { width: 8, height: 8, borderRadius: 4 },
  pillText:      { fontSize: FontSize.xs, fontWeight: FontWeight.black, textTransform: 'uppercase' },
  heroTitle:     { fontSize: FontSize['5xl'], lineHeight: 46, fontWeight: FontWeight.black, maxWidth: 700 },
  heroTitleWide: { fontSize: 56, lineHeight: 66 },
  heroDivider:   { width: 56, height: 4, borderRadius: 2, marginVertical: 20 },
  heroText:      { fontSize: FontSize.lg, lineHeight: 26, maxWidth: 620 },

  ctaRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 30 },
  primaryBtnWrap:   { borderRadius: 10, overflow: 'hidden', minWidth: 170 },
  primaryBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 15, justifyContent: 'center' },
  primaryBtnText:   { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.black },
  secondaryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 22, paddingVertical: 14, minWidth: 170, justifyContent: 'center' },
  secondaryBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.black },

  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 28, marginTop: 36 },

  heroVisual:    { flex: 1, width: '100%', minHeight: 460, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mockPhone:     { width: 280, maxWidth: '100%', borderRadius: 36, borderWidth: 2, alignItems: 'center', padding: 20, paddingTop: 24, paddingBottom: 20 },
  phoneBrand:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  phoneLogo:     { width: 120, height: 44 },
  faceArea:      { width: 190, height: 190, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },
  cornerTL:      { position: 'absolute', top: -2,    left: -2,  width: 22, height: 22, borderTopWidth: 3,    borderLeftWidth: 3,  borderRadius: 4 },
  cornerTR:      { position: 'absolute', top: -2,    right: -2, width: 22, height: 22, borderTopWidth: 3,    borderRightWidth: 3, borderRadius: 4 },
  cornerBL:      { position: 'absolute', bottom: -2, left: -2,  width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3,  borderRadius: 4 },
  cornerBR:      { position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderRadius: 4 },
  scanLine:      { position: 'absolute', height: 2, width: '80%', borderRadius: 1, opacity: 0.8 },
  phoneInfo:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderTopWidth: 1, paddingTop: 14, width: '100%' },
  phoneInfoText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16, textAlign: 'center' },

  section:      { width: '100%', maxWidth: 1120, paddingVertical: 46 },
  sectionTitle: { fontSize: FontSize['3xl'], lineHeight: 38, fontWeight: FontWeight.black, maxWidth: 720, marginBottom: 10 },
  sectionText:  { fontSize: FontSize.lg, lineHeight: 25, maxWidth: 760 },
  features:     { gap: 16, marginTop: 28 },
  featuresWide: { flexDirection: 'row', flexWrap: 'wrap' },

  split:     { width: '100%', maxWidth: 1120, gap: 28, paddingVertical: 46 },
  splitWide: { flexDirection: 'row', alignItems: 'stretch' },
  splitCopy: { flex: 1, justifyContent: 'center' },
  checkList: { gap: 10, marginTop: 20 },
  checkRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkItem: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, lineHeight: 22 },

  techPanel:     { flex: 1, minHeight: 285, borderRadius: 12, borderWidth: 1, padding: 24 },
  techTitle:     { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 8 },
  techSubtitle:  { fontSize: FontSize.md, lineHeight: 20, marginBottom: 18 },
  techGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  techBadge:     { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, width: '48%' },
  techBadgeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  innovationBanner:   { width: '100%', maxWidth: 1120, borderRadius: 12, borderWidth: 1, padding: 36, marginBottom: 12, alignItems: 'center' },
  innovationTitle:    { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 12 },
  innovationText:     { fontSize: FontSize.base, lineHeight: 24, textAlign: 'center', maxWidth: 720, marginBottom: 28 },
  innovationPills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  innovationPill:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10 },
  innovationPillText: { fontSize: FontSize.base, fontWeight: FontWeight.black },

  contact:      { width: '100%', maxWidth: 1120, borderRadius: 12, borderWidth: 1, padding: 24, gap: 22, marginVertical: 40, flexDirection: Platform.OS === 'web' ? 'row' : 'column', justifyContent: 'space-between' },
  contactCopy:  { flex: 1 },
  contactTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  contactText:  { fontSize: FontSize.base, lineHeight: 21, marginTop: 6 },
  contactList:  { gap: 10, justifyContent: 'center' },
  contactRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactItem:  { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  footer:      { width: '100%', maxWidth: 1120, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 18 },
  footerText:  { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  footerLinks: { flexDirection: 'row', gap: 16 },
  footerLink:  { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },

  // ── Botón flotante ──
  fabWrap: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fab: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});