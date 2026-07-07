import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_ATTENDANCE } from '@/features/attendance/types';
import { MOCK_REPORT_USERS } from '@/features/reports/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ReportByUserScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [selectedUser, setUser] = useState('');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const filtered = selectedUser ? MOCK_ATTENDANCE.filter(a => a.userId === selectedUser) : MOCK_ATTENDANCE;

  return (
    <View style={[rus.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:16,paddingTop:12 }}><Ionicons name="arrow-back" size={20} color={text} /><Text style={{ color: text, fontWeight:'700' }}>{t('common.back')}</Text></TouchableOpacity>
      <Text style={[rus.title, { color: text, paddingHorizontal: 16, marginTop: 8 }]}>{t('reports.byUser')}</Text>
      <View style={{ flexDirection:'row',gap:8,paddingHorizontal:16,marginBottom:12,flexWrap:'wrap' }}>
        <TouchableOpacity onPress={() => setUser('')} style={[rus.chip, { backgroundColor: selectedUser===''?theme.primary+'20':cardBg, borderColor: selectedUser===''?theme.primary:border }]}><Text style={{ color: selectedUser===''?theme.primary:muted,fontWeight:'700',fontSize:13 }}>{t('reports.filters.all')}</Text></TouchableOpacity>
        {MOCK_REPORT_USERS.map(u => (
          <TouchableOpacity key={u.id} onPress={() => setUser(u.id)} style={[rus.chip, { backgroundColor: selectedUser===u.id?theme.primary+'20':cardBg, borderColor: selectedUser===u.id?theme.primary:border }]}><Text style={{ color: selectedUser===u.id?theme.primary:muted,fontWeight:'700',fontSize:13 }}>{u.name}</Text></TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <View style={[rus.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection:'row',justifyContent:'space-between' }}><Text style={[rus.cardTitle, { color: text }]}>{item.userName}</Text><Text style={{ color: item.status==='punctual'?Colors.success:Colors.warning,fontWeight:'700',fontSize:12 }}>{t(`attendance.statuses.${item.status}`)}</Text></View>
            <Text style={{ color: muted, fontSize: 12 }}>{item.date} · {item.entryTime||'--'} → {item.exitTime||'--'} · {item.environmentName} · Ficha {item.fichaNumber}</Text>
          </View>
        )}
        ListEmptyComponent={<View style={{ alignItems:'center',paddingVertical:60 }}><Text style={{ color: muted }}>{t('reports.noData')}</Text></View>}
      />
    </View>
  );
};

const rus = StyleSheet.create({
  safe: { flex: 1 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
  chip: { borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 6 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
