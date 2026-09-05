import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CoordinatorHome() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = isDark ? Colors.dark.surface : Colors.white;
  const cards = [
    { icon: 'swap-horizontal-outline', title: t('academic.transferRequestsTitle'), description: t('academic.transferRequestsDescription'), route: Routes.COORDINATOR.TRANSFER_REQUESTS },
  ];
  return <View style={[styles.safe, { backgroundColor: bg }]}><View style={styles.content}><Text style={[styles.title, { color: text }]}>{t('academic.coordinatorDashboardTitle')}</Text><Text style={[styles.subtitle, { color: muted }]}>{t('academic.coordinatorDashboardSubtitle')}</Text><View style={styles.grid}>{cards.map(item => <TouchableOpacity key={item.route} onPress={() => router.push(item.route as any)} style={[styles.card, { backgroundColor: card, borderColor: theme.primary + '35' }]}><View style={[styles.icon, { backgroundColor: theme.primary + '18' }]}><Ionicons name={item.icon as any} size={26} color={theme.primary} /></View><Text style={[styles.cardTitle, { color: text }]}>{item.title}</Text><Text style={[styles.cardText, { color: muted }]}>{item.description}</Text></TouchableOpacity>)}</View></View></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 24 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black }, subtitle: { fontSize: FontSize.md, marginTop: 6 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 24 }, card: { width: 280, minHeight: 170, borderRadius: 14, borderWidth: 1, padding: 18 }, icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold }, cardText: { fontSize: FontSize.sm, lineHeight: 19, marginTop: 6 } });
