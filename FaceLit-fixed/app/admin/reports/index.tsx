import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ReportsDashboardScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const options = [
    { icon: 'person-outline', label: t('reports.byUser'), route: '/admin/reports/by-user', color: '#4A90D9' },
    { icon: 'people-outline', label: t('reports.byFicha'), route: '/admin/reports/by-ficha', color: '#27AE60' },
    { icon: 'calendar-outline', label: t('reports.calendar'), route: '/admin/reports/calendar', color: '#E89B2C' },
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
