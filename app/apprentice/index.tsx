// ─────────────────────────────────────────────
//  app/apprentice/index.tsx — Dashboard Aprendiz
//  Pantallas disponibles: Mi Asistencia,
//  Reconocimiento Facial, Notificaciones, Perfil
// ─────────────────────────────────────────────
import { useAcademic } from '@/features/academic/useAcademic';
import { findCurrentLearner, getProgramForFicha } from '@/features/academic/currentAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useRemoteUnreadCount } from '@/features/notifications/useNotifications';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ApprenticeDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { allFichas, allPrograms } = useAcademic();
  const remoteUnreadCount = useRemoteUnreadCount(user?.id);

  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const cardShadow = isDark
    ? '0px 10px 24px rgba(0, 0, 0, 0.58)'
    : '0px 10px 24px rgba(24, 54, 32, 0.30)';

  // ── Ficha del aprendiz ─────────────────────
  const learnerAcademic = useMemo(() => findCurrentLearner(allFichas, user), [allFichas, user]);
  const myFicha = learnerAcademic?.ficha ?? null;
  const myLearner = learnerAcademic?.learner ?? null;
  const myProgram = useMemo(() => getProgramForFicha(allPrograms, myFicha), [allPrograms, myFicha]);

  // ── Accesos directos ───────────────────────
  interface QuickAction {
    icon: string;
    label: string;
    route: string;
    color: string;
    badge?: number;
  }

  const quickActions: QuickAction[] = [
    {
      icon:  'checkmark-circle-outline',
      label: t('sidebar.myAttendance'),
      route: Routes.ATTENDANCE.APPRENTICE,
      color: theme.success,
    },
    {
      icon:  'scan-outline',
      label: t('sidebar.facialRecognition'),
      route: Routes.APPRENTICE.FACIAL,
      color: theme.primary,
    },
    {
      icon:  'notifications-outline',
      label: t('sidebar.notifications'),
      route: Routes.NOTIFICATIONS.CENTER,
      color: theme.warning,
      badge: remoteUnreadCount > 0 ? remoteUnreadCount : undefined,
    },
    {
      icon:  'person-outline',
      label: t('sidebar.profile'),
      route: Routes.PROFILE.VIEW,
      color: theme.info,
    },
  ];

  // ── Nombre para el saludo ──────────────────
  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(' ')
    || (myLearner?.name ?? '')
    || (user?.email?.split('@')[0] ?? '');

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Banner de bienvenida ─────────────── */}
        <LinearGradient
          colors={['#174A2A', '#26713A', '#4A9B4A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.banner, { boxShadow: '0px 12px 28px rgba(18, 48, 27, 0.34)' }]}
        >
          <View style={s.bannerGlow} />
          <View style={s.bannerLeft}>
            <View style={s.bannerEyebrow}>
              <View style={s.bannerEyebrowDot} />
              <Text style={s.bannerGreeting}>{t('dashboard.welcome')}</Text>
            </View>
            <Text style={s.bannerName}>{displayName}!</Text>
            <View style={s.rolePill}>
              <Ionicons name="school-outline" size={12} color={Colors.white} />
              <Text style={s.rolePillText}>{t('users.roles.APPRENTICE')}</Text>
            </View>
            <View style={s.fichaPill}>
              <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={s.fichaTag} numberOfLines={1}>
                {myFicha ? `${t('dashboard.apprenticeFicha')} ${myFicha.number}  ·  ${myProgram ? getProgramDisplayName(myProgram, t) : t('dashboard.apprenticeNoProgram')}` : t('dashboard.apprenticeNoFichaAssigned')}
              </Text>
            </View>
          </View>
          <View style={s.avatarWrap}>
            <View style={s.avatarRing}>
              <Ionicons name="person" size={42} color="rgba(255,255,255,0.88)" />
            </View>
            <View style={s.avatarBadge}>
              <Ionicons name="sparkles" size={14} color="#174A2A" />
            </View>
          </View>
        </LinearGradient>

        <View style={[s.academicCard, { backgroundColor: cardBg, borderColor: border, boxShadow: cardShadow }]}>
          <View style={s.academicHeader}>
            <View style={[s.academicIcon, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="school-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.academicTitle, { color: text }]}>{t('dashboard.apprenticeTraining')}</Text>
              <Text style={[s.academicSubtitle, { color: muted }]}>{t('dashboard.apprenticeTrainingSubtitle')}</Text>
            </View>
          </View>
          <View style={s.academicGrid}>
            <View style={s.academicItem}>
              <Text style={[s.academicLabel, { color: muted }]}>{t('dashboard.apprenticeFicha')}</Text>
              <Text style={[s.academicValue, { color: text }]}>{myFicha?.number ?? t('dashboard.apprenticeNoFicha')}</Text>
            </View>
            <View style={s.academicItem}>
              <Text style={[s.academicLabel, { color: muted }]}>{t('dashboard.apprenticeProgram')}</Text>
              <Text style={[s.academicValue, { color: text }]} numberOfLines={2}>{myProgram ? getProgramDisplayName(myProgram, t) : t('dashboard.apprenticeNoProgram')}</Text>
            </View>
            <View style={s.academicItem}>
              <Text style={[s.academicLabel, { color: muted }]}>{t('dashboard.apprenticeStatus')}</Text>
              <Text style={[s.academicValue, { color: myLearner?.status === 'inactive' ? Colors.error : Colors.success }]}>
                {myLearner?.status === 'inactive' ? t('dashboard.apprenticeInactive') : myLearner ? t('dashboard.apprenticeActive') : t('dashboard.apprenticeUnassigned')}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Accesos directos ─────────────────── */}
        <Text style={[s.sectionTitle, { color: text }]}>{t('dashboard.quickActions')}</Text>
        <View style={s.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              style={[s.actionCard, { backgroundColor: cardBg, borderColor: border, boxShadow: cardShadow }]}
              activeOpacity={0.8}
            >
              {/* Badge de notificaciones no leídas */}
              {action.badge !== undefined && (
                <View style={[s.badge, { backgroundColor: Colors.error }]}>
                  <Text style={s.badgeText}>{action.badge}</Text>
                </View>
              )}
              <View style={[s.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={26} color={action.color} />
              </View>
              <Text style={[s.actionLabel, { color: text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Estado del registro facial ────────── */}
        <Text style={[s.sectionTitle, { color: text }]}>{t('sidebar.facialRecognition')}</Text>
        <TouchableOpacity
          onPress={() => router.push(Routes.APPRENTICE.FACIAL as any)}
          style={[s.facialBanner, { backgroundColor: cardBg, borderColor: border, boxShadow: cardShadow }]}
          activeOpacity={0.85}
        >
          <View style={[s.facialIconWrap, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="scan-outline" size={32} color={theme.primary} />
          </View>
          <View style={s.facialInfo}>
            <Text style={[s.facialTitle, { color: text }]}>
              {t('facialReg.registerFace')}
            </Text>
            <Text style={[s.facialDesc, { color: muted }]}>
              {t('facialReg.registerFaceDesc')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={muted} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },

  // Banner
  banner: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    padding: 24,
    minHeight: 176,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  bannerGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    right: -54,
    top: -112,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bannerLeft: { flex: 1, minWidth: 0, zIndex: 1 },
  bannerEyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  bannerEyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#A7F3A0' },
  bannerGreeting: { color: 'rgba(255,255,255,0.78)', fontSize: FontSize.sm, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  bannerName: { color: Colors.white, fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  rolePillText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  fichaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    maxWidth: '100%',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  fichaTag: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: FontSize.xs,
    flexShrink: 1,
  },
  avatarWrap: {
    width: 92,
    height: 92,
    marginLeft: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
  },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A7F3A0',
    borderWidth: 2,
    borderColor: '#26713A',
  },
  academicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
    elevation: 8,
  },
  academicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  academicIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  academicTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  academicSubtitle: { fontSize: FontSize.xs, marginTop: 2 },
  academicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  academicItem: { flex: 1, minWidth: 140 },
  academicLabel: { fontSize: FontSize.xs, marginBottom: 3 },
  academicValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  // Section title
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.black,
    marginBottom: 12,
  },

  // Actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
    elevation: 7,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: FontWeight.black,
  },

  // Facial banner
  facialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 8,
    elevation: 7,
  },
  facialIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facialInfo:  { flex: 1 },
  facialTitle: { fontSize: FontSize.base, fontWeight: FontWeight.black },
  facialDesc:  { fontSize: FontSize.sm, marginTop: 3, lineHeight: 18 },
});
