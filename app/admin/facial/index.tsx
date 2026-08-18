import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_FACIAL_RECORDS } from '@/features/facial/types';
import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function FacialManagementScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const records = MOCK_FACIAL_RECORDS;
  const stats = { registered: records.filter(r=>r.status==='registered').length, pending: records.filter(r=>r.status==='pending').length, verified: 12 };

  return (
    <View style={[fms.safe, { backgroundColor: bg }]}>
      <Text style={[fms.title, { color: text, paddingHorizontal: 16, paddingTop: 16 }]}>{t('facial.management')}</Text>
      <View style={fms.statsRow}>
        {[{ label: t('facial.stats.registered'), value: stats.registered, color: Colors.success },
          { label: t('facial.stats.pending'), value: stats.pending, color: Colors.warning },
          { label: t('facial.stats.verified'), value: stats.verified, color: Colors.info }].map(s => (
          <View key={s.label} style={[fms.statCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[fms.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[fms.statLabel, { color: muted }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={[fms.sectionTitle, { color: text, paddingHorizontal: 16 }]}>{t('facial.instructions.title')}</Text>
      <View style={[fms.instrCard, { backgroundColor: cardBg, borderColor: border, marginHorizontal: 16 }]}>
        {[t('facial.instructions.step1'),t('facial.instructions.step2'),t('facial.instructions.step3'),t('facial.instructions.step4')].map((step,i) => (
          <View key={i} style={{ flexDirection:'row',alignItems:'center',gap:8,paddingVertical:4 }}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} /><Text style={{ color: text, fontSize: 14 }}>{step}</Text>
          </View>
        ))}
      </View>
      <FlatList data={records} keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={<Text style={[fms.sectionTitle, { color: text }]}>Usuarios</Text>}
        renderItem={({ item }) => (
          <View style={[fms.recordCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection:'row',alignItems:'center',gap:12 }}>
              <View style={[fms.avatar, { backgroundColor: theme.primary+'20' }]}><Ionicons name="person" size={20} color={theme.primary} /></View>
              <View style={{ flex:1 }}><Text style={[fms.userName, { color: text }]}>{item.userName}</Text><Text style={{ color: muted, fontSize: 12 }}>{item.date || 'Sin fecha'}</Text></View>
              <View style={[fms.statusBadge, { backgroundColor: item.status==='registered'?Colors.success+'20':item.status==='pending'?Colors.warning+'20':Colors.error+'20' }]}>
                <Text style={{ color: item.status==='registered'?Colors.success:item.status==='pending'?Colors.warning:Colors.error, fontWeight:'700', fontSize:12 }}>{item.status==='registered'?'Registrado':item.status==='pending'?'Pendiente':'Fallido'}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const fms = StyleSheet.create({
  safe: { flex: 1 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  statValue: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.xs, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 10 },
  instrCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  recordCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
