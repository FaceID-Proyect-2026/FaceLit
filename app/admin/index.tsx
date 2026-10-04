import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { getManagedUsersCount } from '@/shared/services/userManagementService';
import { subscribeRealtime } from '@/shared/services/realtime';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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

interface QuickAction {
  icon: string;
  label: string;
  description: string;
  route: string;
  color: string;
}

interface StatCard {
  icon: string;
  value: string;
  label: string;
  detail: string;
  color: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { allFichas, allPrograms, loading } = useAcademic();
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const heroFloat = useRef(new Animated.Value(0)).current;
  const heroPulse = useRef(new Animated.Value(0)).current;

  const loadUsersCount = useCallback(async () => {
    try {
      setUsersCount(await getManagedUsersCount());
    } catch (error) {
      console.warn('[Dashboard] No se pudo cargar el total de usuarios:', error);
      setUsersCount(null);
    }
  }, []);

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

  useEffect(() => {
    void loadUsersCount();
    return subscribeRealtime(message => {
      if (message.type === 'data.changed' && message.resource === 'users') {
        void loadUsersCount();
      }
    });
  }, [loadUsersCount]);

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

  const stats: StatCard[] = [
    {
      icon: 'people-outline',
      value: usersCount === null ? '—' : String(usersCount),
      label: t('dashboard.totalUsers'),
      detail: t('dashboard.allSystemRoles'),
      color: theme.info,
    },
    {
      icon: 'school-outline',
      value: loading ? '...' : String(allFichas.length),
      label: t('dashboard.registeredFichas'),
      detail: t('dashboard.allRegisteredFichas'),
      color: theme.primary,
    },
    {
      icon: 'layers-outline',
      value: loading ? '...' : String(allPrograms.length),
      label: t('dashboard.programs'),
      detail: t('dashboard.allRegisteredPrograms'),
      color: theme.secondary,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: 'people-outline',
      label: t('sidebar.users'),
      description: t('dashboard.manageAccountsPermissions'),
      route: Routes.ADMIN.USERS,
      color: theme.info,
    },
    {
      icon: 'school-outline',
      label: t('sidebar.academic'),
      description: t('dashboard.programsFichasLearners'),
      route: Routes.ACADEMIC.PROGRAMS,
      color: theme.success,
    },
    {
      icon: 'checkmark-circle-outline',
      label: t('sidebar.attendance'),
      description: t('dashboard.reviewValidateAttendance'),
      route: Routes.ATTENDANCE.LIST,
      color: theme.primary,
    },
    {
      icon: 'notifications-outline',
      label: t('sidebar.notifications'),
      description: t('dashboard.reviewRecentAlerts'),
      route: Routes.NOTIFICATIONS.CENTER,
      color: theme.secondary,
    },
    {
      icon: 'person-outline',
      label: t('sidebar.profile'),
      description: t('dashboard.personalDataSecurity'),
      route: Routes.PROFILE.VIEW,
      color: theme.warning,
    },
  ];

  const displayName = user?.firstName?.trim() || t('dashboard.coordinator');
  const role = t('dashboard.coordinator');

  return (
    <View style={[styles.safe, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, isMobile && styles.scrollMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeading}>
          <View>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>{t('dashboard.controlCenter')}</Text>
            <Text style={[styles.pageTitle, { color: text }]}>{t('dashboard.coordinatorPanel')}</Text>
          </View>
          {!isMobile && (
            <View style={[styles.livePill, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.liveText, { color: secondaryText }]}>
                {loading ? t('dashboard.syncingData') : t('dashboard.systemUpdated')}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.heroShadow, isMobile && styles.heroShadowMobile]}>
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
                {t('dashboard.coordinatorHeroSubtitle')}
              </Text>
              <TouchableOpacity
                onPress={() => router.push(Routes.ACADEMIC.PROGRAMS as any)}
                style={styles.heroButton}
                activeOpacity={0.86}
              >
                <Text style={styles.heroButtonText}>{t('dashboard.goToAcademicManagement')}</Text>
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
        </View>

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
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  heroShadow: { borderRadius: 28, marginBottom: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 6 },
  heroShadowMobile: { borderRadius: 22 },
  hero: { minHeight: 250, borderRadius: 28, padding: 32, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
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
  statCard: { flex: 1, minWidth: 0, minHeight: 168, borderRadius: 20, borderWidth: 1, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
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
  actionCard: { width: '31%', minWidth: 260, flexGrow: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 17, gap: 13, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  actionCardCompact: { width: '47%' },
  actionCardMobile: { width: '100%', minWidth: 0 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionContent: { flex: 1, minWidth: 0 },
  actionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.black },
  actionDescription: { fontSize: FontSize.xs, lineHeight: 17, marginTop: 3 },
  actionArrow: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
