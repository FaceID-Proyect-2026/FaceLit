import { AttendanceRecord, MOCK_ATTENDANCE } from '@/features/attendance/types';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AttendanceListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [records] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const statusConfig: Record<string,{color:string;label:string}> = {
    punctual: { color: Colors.success, label: t('attendance.statuses.punctual') },
    late: { color: Colors.warning, label: t('attendance.statuses.late') },
    absent: { color: Colors.error, label: t('attendance.statuses.absent') },
    invalidEnv: { color: Colors.info, label: t('attendance.statuses.invalidEnv') },
  };

  const stats = { total: records.length, punctual: records.filter(r=>r.status==='punctual').length, late: records.filter(r=>r.status==='late').length, absent: records.filter(r=>r.status==='absent').length };

  return (
    <View style={[als.safe, { backgroundColor: bg }]}>
      <Text style={[als.title, { color: text, paddingHorizontal: 16, paddingTop: 16 }]}>{t('attendance.title')}</Text>
      <View style={als.statsRow}>
        {[{ v: stats.total, l: t('attendance.stats.total'), c: theme.primary },
          { v: stats.punctual, l: t('attendance.stats.punctual'), c: Colors.success },
          { v: stats.late, l: t('attendance.stats.late'), c: Colors.warning },
          { v: stats.absent, l: t('attendance.stats.absent'), c: Colors.error }].map(s => (
          <View key={s.l} style={[als.stat, {  borderColor: border }]}><Text style={[als.statV, { color: s.c }]}>{s.v}</Text><Text style={[als.statL, { color: muted }]}>{s.l}</Text></View>
        ))}
      </View>
      <FlatList data={records} keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const sc = statusConfig[item.status] || statusConfig.absent;
          return (
            <TouchableOpacity style={[als.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
              <View style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6 }}>
                <Text style={[als.cardUser, { color: text }]}>{item.userName}</Text>
                <View style={[als.statusBadge, { backgroundColor: sc.color+'20' }]}><Text style={{ color: sc.color, fontWeight:'700', fontSize:12 }}>{sc.label}</Text></View>
              </View>
              <View style={als.cardInfo}>
                <View style={{ flexDirection:'row',alignItems:'center',gap:4 }}><Ionicons name="calendar-outline" size={12} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{item.date}</Text></View>
                <View style={{ flexDirection:'row',alignItems:'center',gap:4 }}><Ionicons name="time-outline" size={12} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{item.entryTime || '--'} → {item.exitTime || '--'}</Text></View>
                <View style={{ flexDirection:'row',alignItems:'center',gap:4 }}><Ionicons name="business-outline" size={12} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{item.environmentName} · Ficha {item.fichaNumber}</Text></View>
              </View>
              {item.delayMinutes > 0 && <Text style={{ color: Colors.warning, fontSize: 12, fontWeight:'700', marginTop: 4 }}>Retraso: {item.delayMinutes} min</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={{ alignItems:'center',paddingVertical:60 }}><Text style={{ color: muted }}>{t('attendance.empty')}</Text></View>}
      />
    </View>
  );
};

const als = StyleSheet.create({
  safe: { flex: 1 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  stat: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' },
  statV: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statL: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardUser: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cardInfo: { gap: 3 },
});
