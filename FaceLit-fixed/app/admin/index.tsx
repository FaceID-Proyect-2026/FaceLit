// ─────────────────────────────────────────────
//  app/admin/index.tsx — Dashboard Admin
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Routes } from '@/shared/constants/routes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  color: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const stats: StatCard[] = [
    { icon: 'people-outline', value: '1,248', label: t('dashboard.totalUsers') },
    { icon: 'school-outline', value: '48', label: t('dashboard.activeFichas') },
    { icon: 'business-outline', value: '32', label: t('dashboard.environments') },
    { icon: 'book-outline', value: '12', label: t('dashboard.trainingPrograms') },
  ];

  const quickActions: QuickAction[] = [
    { icon: 'business-outline', label: t('sidebar.environments'), route: Routes.ENVIRONMENTS.LIST, color: '#4A90D9' },
    { icon: 'school-outline', label: t('sidebar.academic'), route: Routes.ACADEMIC.PROGRAMS, color: '#27AE60' },
    { icon: 'time-outline', label: t('sidebar.schedules'), route: Routes.SCHEDULES.LIST, color: '#E89B2C' },
    { icon: 'scan-outline', label: t('sidebar.facial'), route: Routes.FACIAL.MANAGEMENT, color: '#9B59B6' },
    { icon: 'checkmark-circle-outline', label: t('sidebar.attendance'), route: Routes.ATTENDANCE.LIST, color: '#1ABC9C' },
    { icon: 'bar-chart-outline', label: t('sidebar.reports'), route: Routes.REPORTS.DASHBOARD, color: '#E74C3C' },
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
              <Ionicons name={stat.icon as any} size={26} color={theme.primary} />
              <Text style={[ads.statValue, { color: text }]}>{stat.value}</Text>
              <Text style={[ads.statLabel, { color: muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={[ads.sectionTitle, { color: text }]}>{t('dashboard.quickActions')}</Text>
        <View style={ads.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.route}
              onPress={() => router.push(action.route as any)}
              style={[ads.actionCard, { backgroundColor: cardBg, borderColor: border }]}
              activeOpacity={0.8}
            >
              <View style={[ads.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text style={[ads.actionLabel, { color: text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const ads = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
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
    gap: 14,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, marginTop: 10 },
  statLabel: { fontSize: FontSize.md, marginTop: 6, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 16 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  actionCard: {
    width: '30%',
    minWidth: 100,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 56, height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'center' },
});
