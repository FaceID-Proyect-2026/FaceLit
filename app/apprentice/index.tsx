// ─────────────────────────────────────────────
//  app/apprentice/index.tsx — Dashboard Aprendiz
//  Pantallas disponibles: Mi Asistencia,
//  Reconocimiento Facial, Notificaciones, Perfil
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ATTENDANCE_EVENTS } from '@/features/attendance/types';
import { MOCK_NOTIFICATIONS } from '@/features/notifications/types';
import { getFichasSnapshot } from '@/features/academic/academicStore';

export default function ApprenticeDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'              : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background : Colors.light.background;

  // ── Estadísticas propias del aprendiz ──────
  const myEvents   = ATTENDANCE_EVENTS.filter(e => e.userId === user?.id);
  const totalSessions  = myEvents.length;
  const punctualCount  = myEvents.filter(e => e.status === 'punctual').length;
  const lateCount      = myEvents.filter(e => e.status === 'late').length;
  const absentCount    = myEvents.filter(e => e.status === 'absent').length;
  const attendancePct  = totalSessions > 0
    ? Math.round(((punctualCount + lateCount) / totalSessions) * 100)
    : 0;

  // ── Ficha del aprendiz ─────────────────────
  const fichas  = getFichasSnapshot();
  const myFicha = fichas.find(f => f.learners?.some((l: any) => l.id === user?.id));

  // ── Notificaciones no leídas ───────────────
  const unreadNotifications = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

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
      color: '#27AE60',
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
      color: '#E89B2C',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      icon:  'person-outline',
      label: t('sidebar.profile'),
      route: Routes.PROFILE.VIEW,
      color: '#4A90D9',
    },
  ];

  // ── Nombre para el saludo ──────────────────
  const displayName = user?.firstName
    ? user.firstName
    : (user?.email?.split('@')[0] ?? '');

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Banner de bienvenida ─────────────── */}
        <LinearGradient
          colors={['#65B361', '#4A9146']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.banner}
        >
          <View style={s.bannerLeft}>
            <Text style={s.bannerGreeting}>{t('dashboard.welcome')},</Text>
            <Text style={s.bannerName}>{displayName}!</Text>
            <View style={s.rolePill}>
              <Ionicons name="school-outline" size={12} color={Colors.white} />
              <Text style={s.rolePillText}>{t('users.roles.APPRENTICE')}</Text>
            </View>
            {myFicha && (
              <Text style={s.fichaTag}>
                {t('academic.ficha', 'Ficha')} {myFicha.number ?? myFicha.name}
              </Text>
            )}
          </View>
          <Ionicons name="person-circle-outline" size={64} color="rgba(255,255,255,0.25)" />
        </LinearGradient>

        {/* ── Tarjetas de estadísticas ─────────── */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            <Text style={[s.statValue, { color: text }]}>{punctualCount}</Text>
            <Text style={[s.statLabel, { color: muted }]}>{t('attendance.punctual', 'Puntual')}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="time" size={22} color={Colors.warning} />
            <Text style={[s.statValue, { color: text }]}>{lateCount}</Text>
            <Text style={[s.statLabel, { color: muted }]}>{t('attendance.late', 'Tarde')}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="close-circle" size={22} color={Colors.error} />
            <Text style={[s.statValue, { color: text }]}>{absentCount}</Text>
            <Text style={[s.statLabel, { color: muted }]}>{t('attendance.absent', 'Ausente')}</Text>
          </View>
          <View style={[s.statCard, s.statCardWide, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="bar-chart-outline" size={22} color={theme.primary} />
            <Text style={[s.statValue, { color: text }]}>{attendancePct}%</Text>
            <Text style={[s.statLabel, { color: muted }]}>{t('dashboard.attendanceRate')}</Text>
          </View>
        </View>

        {/* ── Accesos directos ─────────────────── */}
        <Text style={[s.sectionTitle, { color: text }]}>{t('dashboard.quickActions')}</Text>
        <View style={s.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              style={[s.actionCard, { backgroundColor: cardBg, borderColor: border }]}
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
          style={[s.facialBanner, { backgroundColor: cardBg, borderColor: border }]}
          activeOpacity={0.85}
        >
          <View style={[s.facialIconWrap, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="scan-outline" size={32} color={theme.primary} />
          </View>
          <View style={s.facialInfo}>
            <Text style={[s.facialTitle, { color: text }]}>
              {t('facialReg.registerFace', 'Registro biométrico')}
            </Text>
            <Text style={[s.facialDesc, { color: muted }]}>
              {t('facialReg.registerFaceDesc', 'Completa tu registro facial para que el sistema pueda registrar tu asistencia automáticamente.')}
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
    borderRadius: 18,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bannerLeft:     { flex: 1 },
  bannerGreeting: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.base },
  bannerName:     { color: Colors.white, fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 2 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  rolePillText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  fichaTag: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.sm,
    marginTop: 6,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 80,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statCardWide: { minWidth: 120 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 14 },

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
