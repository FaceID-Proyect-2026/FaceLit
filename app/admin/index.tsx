// ─────────────────────────────────────────────
//  app/admin/index.tsx — Dashboard Admin
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAcademic } from '@/features/academic/useAcademic';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAttendance } from '@/features/attendance/useAttendance';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface StatCard {
  icon: string;
  value: string;
  label: string;
}

interface QuickAction {
  icon: string;
  label: string;
  route: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { allFichas, orphanLearners } = useAcademic();
  const { environments } = useEnvironments();
  const attendanceRecords = useAttendance();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // Al admin (Coordinador) le interesa esencialmente: cuántos aprendices
  // hay registrados en el sistema y qué tan puntuales han sido — el
  // detalle de asistencia por usuario lo cubre el módulo de Asistencia,
  // aquí solo se resume.
  const { totalLearners, activeFichasCount, activeEnvironmentsCount, attendanceRate } = useMemo(() => {
    const learnerIds = new Set<string>();
    allFichas.forEach(f => f.learners.forEach(l => learnerIds.add(l.id)));
    orphanLearners.forEach(l => learnerIds.add(l.id));

    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status !== 'absent').length;

    return {
      totalLearners: learnerIds.size,
      activeFichasCount: allFichas.filter(f => f.status === 'active').length,
      activeEnvironmentsCount: environments.filter(e => e.status === 'active').length,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [allFichas, orphanLearners, environments, attendanceRecords]);

  const stats: StatCard[] = [
    { icon: 'people-outline', value: String(totalLearners), label: t('dashboard.totalUsers') },
    { icon: 'school-outline', value: String(activeFichasCount), label: t('dashboard.activeFichas') },
    { icon: 'business-outline', value: String(activeEnvironmentsCount), label: t('dashboard.environments') },
    { icon: 'checkmark-circle-outline', value: `${attendanceRate}%`, label: t('dashboard.attendanceRate') },
  ];

  // Accesos rápidos del dashboard: se limitan a los módulos que
  // permanecen visibles en la barra lateral (Reconocimiento Facial,
  // Notificaciones y Perfil).
  const quickActions: QuickAction[] = [
    { icon: 'scan-outline', label: t('sidebar.facial'), route: Routes.FACIAL.MANAGEMENT },
    { icon: 'notifications-outline', label: t('sidebar.notifications'), route: Routes.NOTIFICATIONS.CENTER },
    { icon: 'person-outline', label: t('sidebar.profile'), route: Routes.PROFILE.VIEW },
  ];

  // ── Datos mock ────────────────────────────
  const recentActivity = [
    { icon: 'person-add-outline', text: 'Nuevo aprendiz registrado: Ana Martínez', time: 'Hace 5 min', color: '#27AE60' },
    { icon: 'checkmark-circle-outline', text: 'Asistencia registrada: Ficha 3145555', time: 'Hace 12 min', color: '#4A90D9' },
    { icon: 'alert-circle-outline', text: 'Ambiente 304 sin instructor asignado', time: 'Hace 1 hora', color: '#E89B2C' },
    { icon: 'time-outline', text: 'Horario modificado: ADSO - Jornada mañana', time: 'Hace 2 horas', color: '#9B59B6' },
  ];

  return (
    <View style={[ads.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ads.scroll} showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <LinearGradient
          colors={['#65B361', '#4A9146']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={ads.welcomeBanner}
        >
          <View>
            <Text style={ads.welcomeTitle}>{t('dashboard.welcome')}, {user?.name}!</Text>
            <Text style={ads.welcomeSubtitle}>{t('dashboard.role')}: {user?.role.charAt(0).toUpperCase() + (user?.role ?? '').slice(1)}</Text>
          </View>
          <Ionicons name="shield-checkmark" size={40} color="rgba(255,255,255,0.3)" />
        </LinearGradient>

        {/* Stats */}
        <View style={ads.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[ads.statCard, { backgroundColor: cardBg, borderColor: border }]}>
              <Ionicons name={stat.icon as any} size={22} color={theme.primary} />
              <Text style={[ads.statValue, { color: text }]}>{stat.value}</Text>
              <Text style={[ads.statLabel, { color: muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Accesos rápidos */}
        <Text style={[ads.sectionTitle, { color: text }]}>{t('dashboard.quickActions')}</Text>
        <View style={ads.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              activeOpacity={0.75}
              style={[ads.quickCard, { backgroundColor: cardBg, borderColor: border }]}
            >
              <View style={[ads.quickIconWrap, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name={action.icon as any} size={24} color={theme.primary} />
              </View>
              <Text style={[ads.quickLabel, { color: text }]}>{action.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const ads = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  welcomeBanner: {
    borderRadius: 16,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  welcomeTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.md, marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 8 },
  statLabel: { fontSize: FontSize.sm, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 12 },
  quickGrid: { gap: 12, marginBottom: 24 },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  quickIconWrap: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  activityCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  activityIcon: {
    width: 32, height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: FontSize.md, lineHeight: 20 },
  activityTime: { fontSize: FontSize.xs, marginTop: 2 },
});
