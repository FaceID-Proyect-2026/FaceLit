import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

interface StatCard {
  icon: string;
  value: string;
  label: string;
  detail: string;
  color: string;
}

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  route: string;
  color: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { allFichas, orphanLearners, programs } = useAcademic();
  const heroFloat = useRef(new Animated.Value(0)).current;
  const heroPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(heroFloat, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heroPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(heroPulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    floatingAnimation.start();
    pulseAnimation.start();
    return () => {
      floatingAnimation.stop();
      pulseAnimation.stop();
    };
  }, [heroFloat, heroPulse]);

  const isMobile = width < 680;
  const isCompact = width < 1040;
  const palette = isDark ? Colors.dark : Colors.light;
  const text = palette.text;
  const muted = palette.textMuted;
  const secondaryText = palette.textSecondary;
  const cardBg = palette.surface;
  const subtleBg = palette.surfaceSecondary;
  const border = palette.border;
  const bg = palette.background;

  const { totalLearners, activeFichasCount, programsCount } = useMemo(() => {
    const learnerIds = new Set<string>();
    allFichas.forEach(ficha => ficha.learners.forEach(learner => learnerIds.add(learner.id)));
    orphanLearners.forEach(learner => learnerIds.add(learner.id));

    return {
      totalLearners: learnerIds.size,
      activeFichasCount: allFichas.filter(ficha => ficha.status === 'active').length,
      programsCount: programs.length,
    };
  }, [allFichas, orphanLearners, programs]);

  const stats: StatCard[] = [
    {
      icon: 'people-outline',
      value: String(totalLearners),
      label: t('dashboard.totalUsers'),
      detail: t('dashboard.totalLearnersDetail'),
      color: theme.info,
    },
    {
      icon: 'school-outline',
      value: String(activeFichasCount),
      label: t('dashboard.activeFichas'),
      detail: t('dashboard.activeFichasDetail'),
      color: theme.primary,
    },
    {
      icon: 'layers-outline',
      value: String(programsCount),
      label: t('dashboard.registeredPrograms'),
      detail: t('dashboard.programsDetail'),
      color: theme.secondary,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: 'people-outline',
      label: t('sidebar.users'),
      description: t('dashboard.actionUsersDesc'),
      route: Routes.ADMIN.USERS,
      color: theme.info,
    },
    {
      icon: 'school-outline',
      label: t('sidebar.academic'),
      description: t('dashboard.actionAcademicDesc'),
      route: Routes.ACADEMIC.PROGRAMS,
      color: theme.success,
    },
    {
      icon: 'checkmark-circle-outline',
      label: t('sidebar.attendance'),
      description: t('dashboard.actionAttendanceDesc'),
      route: Routes.ATTENDANCE.LIST,
      color: theme.primary,
    },
    {
      icon: 'notifications-outline',
      label: t('sidebar.notifications'),
      description: t('dashboard.actionNotificationsDesc'),
      route: Routes.NOTIFICATIONS.CENTER,
      color: theme.secondary,
    },
    {
      icon: 'person-outline',
      label: t('sidebar.profile'),
      description: t('dashboard.actionProfileDesc'),
      route: Routes.PROFILE.VIEW,
      color: theme.warning,
    },
  ];

  const displayName = user?.firstName?.trim() || t('dashboard.coordinator');
  const role = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
    : t('dashboard.coordinator');

  return (
    <View style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isMobile && styles.scrollMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('dashboard.controlCenter')}</Text>
            <Text style={[styles.pageTitle, { color: text }]}>{t('dashboard.coordinatorDashboard')}</Text>
            <Text style={[styles.pageSubtitle, { color: secondaryText }]}>{t('dashboard.academicOverview')}</Text>
          </View>
          {!isMobile && (
            <View style={[styles.livePill, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.liveText, { color: secondaryText }]}>{t('dashboard.systemUpdated')}</Text>
            </View>
          )}
        </View>

        <LinearGradient
          colors={isDark ? ['#1F6D42', '#358F52', '#65B361'] : ['#287547', '#4A9B56', '#72C96D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, isMobile && styles.heroMobile]}
        >
          <Animated.View
            style={[
              styles.heroGlowOne,
              { transform: [{ translateY: heroFloat.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }] },
            ]}
          />
          <Animated.View
            style={[
              styles.heroGlowTwo,
              { transform: [{ translateX: heroFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -22] }) }] },
            ]}
          />
          <View style={styles.heroContent}>
            <View style={styles.rolePill}>
              <Ionicons name={'shield-checkmark-outline'} size={15} color={Colors.white} />
              <Text style={styles.rolePillText}>{role}</Text>
            </View>
            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
              {t('dashboard.welcome')}, {displayName}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t('dashboard.heroSubtitle')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push(Routes.ACADEMIC.PROGRAMS as any)}
              style={styles.heroButton}
              activeOpacity={0.86}
            >
              <Text style={styles.heroButtonText}>{t('dashboard.goToAcademic')}</Text>
              <Ionicons name={'arrow-forward'} size={17} color={'#24613A'} />
            </TouchableOpacity>
          </View>
          {!isMobile && (
            <Animated.View
              style={[
                styles.heroIllustration,
                { transform: [{ translateY: heroFloat.interpolate({ inputRange: [0, 1], outputRange: [7, -7] }) }] },
              ]}
            >
              <Animated.View
                style={[
                  styles.heroIconRing,
                  { transform: [{ scale: heroPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.055] }) }] },
                ]}
              >
                <View style={styles.heroIconCore}>
                  <Ionicons name={'analytics-outline'} size={48} color={Colors.white} />
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </LinearGradient>

        <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
          {stats.map(stat => (
            <View
              key={stat.label}
              style={[
                styles.statCard,
                isMobile && styles.statCardMobile,
                { backgroundColor: cardBg, borderColor: border },
              ]}
            >
              <View style={styles.statTop}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}18` }]}>
                  <Ionicons name={stat.icon as any} size={22} color={stat.color} />
                </View>
                <View style={[styles.statAccent, { backgroundColor: stat.color }]} />
              </View>
              <Text style={[styles.statValue, { color: text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: text }]}>{stat.label}</Text>
              <Text style={[styles.statDetail, { color: muted }]}>{stat.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: text }]}>{t('dashboard.quickActions')}</Text>
            <Text style={[styles.sectionSubtitle, { color: muted }]}>{t('dashboard.quickActionsSubtitle')}</Text>
          </View>
        </View>

        <View style={[styles.actionsGrid, isCompact && styles.actionsGridCompact]}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              style={[
                styles.actionCard,
                isCompact && styles.actionCardCompact,
                isMobile && styles.actionCardMobile,
                { backgroundColor: cardBg, borderColor: border },
              ]}
              activeOpacity={0.82}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${action.color}16` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionLabel, { color: text }]}>{action.label}</Text>
                <Text style={[styles.actionDescription, { color: muted }]} numberOfLines={2}>
                  {action.description}
                </Text>
              </View>
              <View style={[styles.actionArrow, { backgroundColor: subtleBg }]}>
                <Ionicons name={'arrow-forward'} size={16} color={secondaryText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: `${theme.primary}0D`, borderColor: `${theme.primary}30` }]}>
          <View style={[styles.tipIcon, { backgroundColor: `${theme.primary}1C` }]}>
            <Ionicons name={'bulb-outline'} size={21} color={theme.primary} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: text }]}>{t('dashboard.tipTitle')}</Text>
            <Text style={[styles.tipText, { color: secondaryText }]}>{t('dashboard.tipText')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { width: '100%', maxWidth: 1440, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 28, paddingBottom: 48 },
  scrollMobile: { paddingHorizontal: 16, paddingTop: 20 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: FontWeight.black, letterSpacing: 1.5, marginBottom: 6 },
  pageTitle: { fontSize: 28, lineHeight: 34, fontWeight: FontWeight.black },
  pageSubtitle: { fontSize: FontSize.sm, marginTop: 5 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  hero: { minHeight: 250, borderRadius: 28, padding: 32, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 22 },
  heroMobile: { minHeight: 280, borderRadius: 22, padding: 24 },
  heroGlowOne: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.10)', right: -70, top: -130 },
  heroGlowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)', right: 190, bottom: -130 },
  heroContent: { flex: 1, maxWidth: 720, zIndex: 2 },
  rolePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', marginBottom: 16 },
  rolePillText: { color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  heroTitle: { color: Colors.white, fontSize: 32, lineHeight: 39, fontWeight: FontWeight.black },
  heroTitleMobile: { fontSize: 27, lineHeight: 33 },
  heroSubtitle: { color: 'rgba(255,255,255,0.88)', fontSize: FontSize.md, lineHeight: 23, marginTop: 8, maxWidth: 620 },
  heroButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 11, marginTop: 22 },
  heroButtonText: { color: '#24613A', fontSize: FontSize.sm, fontWeight: FontWeight.black },
  heroIllustration: { width: 250, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  heroIconRing: { width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.07)' },
  heroIconCore: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 32 },
  statsGridMobile: { flexDirection: 'column' },
  statCard: { flex: 1, minWidth: 0, minHeight: 168, borderRadius: 20, borderWidth: 1, padding: 20 },
  statCardMobile: { minHeight: 150 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statAccent: { width: 28, height: 4, borderRadius: 4 },
  statValue: { fontSize: 30, lineHeight: 35, fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: 3 },
  statDetail: { fontSize: FontSize.xs, marginTop: 5 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  sectionSubtitle: { fontSize: FontSize.sm, marginTop: 4 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  actionsGridCompact: { gap: 12 },
  actionCard: { width: '31%', minWidth: 260, flexGrow: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 17, gap: 13 },
  actionCardCompact: { width: '47%' },
  actionCardMobile: { width: '100%', minWidth: 0 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionContent: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.black },
  actionDescription: { fontSize: FontSize.xs, lineHeight: 17, marginTop: 3 },
  actionArrow: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 22 },
  tipIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.black },
  tipText: { fontSize: FontSize.xs, lineHeight: 18, marginTop: 3 },
});
