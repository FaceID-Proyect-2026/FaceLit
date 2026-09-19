import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReportsDashboardScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const isAdminOrInstructor = user?.role === 'COORDINATOR' || user?.role === 'INSTRUCTOR';

  const options = [
    { icon: 'person-outline', label: t('reports.byUser'), route: Routes.REPORTS.BY_USER, color: theme.info },
    { icon: 'people-outline', label: t('reports.byFicha'), route: Routes.REPORTS.BY_FICHA, color: theme.success },
    { icon: 'calendar-outline', label: t('reports.calendar'), route: Routes.REPORTS.CALENDAR, color: theme.warning },
    { icon: 'trending-up-outline', label: t('reports.myPerformance'), route: Routes.REPORTS.MY_PERFORMANCE, color: theme.secondary },
    ...(isAdminOrInstructor ? [{
      icon: 'clipboard-outline',
      label: t('reports.excuses.title'),
      route: Routes.REPORTS.EXCUSES_REVIEW,
      color: theme.danger,
    }] : []),
  ];

  return (
    <View style={[rds.safe, { backgroundColor: bg }]}>
      <Text style={[rds.title, { color: text, paddingHorizontal: 16, paddingTop: 16 }]}>{t('reports.title')}</Text>
      <View style={rds.grid}>
        {options.map(opt => (
          <TouchableOpacity key={opt.route} onPress={() => router.push(opt.route as any)}
            style={[rds.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={[rds.iconCircle, { backgroundColor: opt.color+'20' }]}><Ionicons name={opt.icon as any} size={32} color={opt.color} /></View>
            <Text style={[rds.cardLabel, { color: text }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const rds = StyleSheet.create({
  safe: { flex: 1 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, marginBottom: 20 },
  card: { flex: 1, minWidth: 100, borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', gap: 12 },
  iconCircle: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'center' },
});
