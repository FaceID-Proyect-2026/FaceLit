import { useAcademic } from '@/features/academic/useAcademic';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ApprenticeDashboard() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { orphanLearners } = useAcademic();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // Si el Coordinador lo desvinculó por traslado, queda sin ficha y debe
  // usar el código que le compartieron para unirse a la nueva.
  const isOrphan = orphanLearners.some(l => l.id === user?.id);

  return (
    <View style={[ads.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ads.scroll}>
        <View style={[ads.welcome, { backgroundColor: theme.primary }]}>
          <Text style={ads.welcomeTitle}>{t('dashboard.welcome')}, {user?.name}!</Text>
          <Text style={ads.welcomeSub}>Aprendiz</Text>
        </View>

        {isOrphan && (
          <TouchableOpacity onPress={() => router.push('/apprentice/join-ficha' as any)} activeOpacity={0.85}
            style={[ads.joinBanner, { backgroundColor: Colors.warning + '20', borderColor: Colors.warning }]}>
            <Ionicons name="link-outline" size={24} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[ads.joinTitle, { color: text }]}>{t('academic.joinFichaTitle', 'Unirse a Ficha')}</Text>
              <Text style={[ads.joinDesc, { color: muted }]}>{t('academic.joinBannerDesc', 'Ingresa el código que te compartió tu Coordinador para vincularte a tu nueva ficha.')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={muted} />
          </TouchableOpacity>
        )}

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
  joinBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 20 },
  joinTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  joinDesc: { fontSize: FontSize.sm, marginTop: 2 },
  grid: { gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 8 },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  cardDesc: { fontSize: FontSize.md, lineHeight: 20 },
});
