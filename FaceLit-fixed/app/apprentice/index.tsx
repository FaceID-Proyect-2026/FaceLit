import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ApprenticeDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[ads.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ads.scroll}>
        <View style={[ads.welcome, { backgroundColor: theme.primary }]}>
          <Text style={ads.welcomeTitle}>{t('dashboard.welcome')}, {user?.name}!</Text>
          <Text style={ads.welcomeSub}>Aprendiz</Text>
        </View>
        <View style={ads.grid}>
          {[
            { icon: 'school-outline', label: 'Mi Ficha', desc: 'Consulta tu ficha de formación' },
            { icon: 'time-outline', label: 'Mi Horario', desc: 'Tu horario académico' },
            { icon: 'checkmark-circle-outline', label: 'Mi Asistencia', desc: 'Tu historial de asistencia' },
            { icon: 'scan-outline', label: 'Registro Facial', desc: 'Completa tu registro biométrico' },
          ].map((item, i) => (
            <View key={i} style={[ads.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Ionicons name={item.icon as any} size={28} color={theme.primary} />
              <Text style={[ads.cardTitle, { color: text }]}>{item.label}</Text>
              <Text style={[ads.cardDesc, { color: muted }]}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const ads = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  welcome: { borderRadius: 16, padding: 22, marginBottom: 20 },
  welcomeTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: FontWeight.black },
  welcomeSub: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.md, marginTop: 4 },
  grid: { gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 8 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  cardDesc: { fontSize: FontSize.md, lineHeight: 20 },
});
