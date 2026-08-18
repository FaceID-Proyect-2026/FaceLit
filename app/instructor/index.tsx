import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[ids.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ids.scroll}>
        <View style={[ids.welcome, { backgroundColor: theme.primary }]}>
          <Text style={ids.welcomeTitle}>{t('dashboard.welcome')}, {user?.name}!</Text>
          <Text style={ids.welcomeSub}>Instructor</Text>
        </View>
        <View style={ids.grid}>
          {[
            { icon: 'time-outline', label: 'Mis Horarios', desc: 'Consulta tus horarios asignados' },
            { icon: 'checkmark-circle-outline', label: 'Asistencia', desc: 'Registros de tus fichas' },
            { icon: 'bar-chart-outline', label: 'Reportes', desc: 'Reportes de asistencia' },
          ].map((item, i) => (
            <View key={i} style={[ids.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Ionicons name={item.icon as any} size={28} color={theme.primary} />
              <Text style={[ids.cardTitle, { color: text }]}>{item.label}</Text>
              <Text style={[ids.cardDesc, { color: muted }]}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const ids = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  welcome: { borderRadius: 16, padding: 22, marginBottom: 20 },
  welcomeTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md, marginTop: 4 },
  grid: { gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 8 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  cardDesc: { fontSize: FontSize.md, lineHeight: 20 },
});
