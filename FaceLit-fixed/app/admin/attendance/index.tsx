import { AttendanceStatus } from '@/features/attendance/types';
import { useAttendance } from '@/features/attendance/useAttendance';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FILTERS: AttendanceStatus[] = ['punctual', 'late', 'absent'];

export default function AttendanceListScreen() {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const records = useAttendance();
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null);
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const statusConfig: Record<AttendanceStatus, { color: string; label: string }> = {
    punctual: { color: Colors.success, label: t('attendance.statuses.punctual') },
    late: { color: Colors.warning, label: t('attendance.statuses.late') },
    absent: { color: Colors.error, label: t('attendance.statuses.absent') },
    invalidEnv: { color: Colors.info, label: t('attendance.statuses.invalidEnv') },
  };
  const visibleRecords = useMemo(
    () => statusFilter ? records.filter(record => record.status === statusFilter) : records,
    [records, statusFilter]
  );
  const stats = {
    total: records.length,
    punctual: records.filter(record => record.status === 'punctual').length,
    late: records.filter(record => record.status === 'late').length,
    absent: records.filter(record => record.status === 'absent').length,
  };
  const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  const formatTime = (value: string) => value ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(`1970-01-01T${value}:00`)) : '—';

  return (
    <View style={[als.safe, { backgroundColor: bg }]}>
      <Text style={[als.title, { color: text }]}>{t('attendance.title')}</Text>
      <View style={als.statsRow}>
        {[{ v: stats.total, l: t('attendance.stats.total'), c: theme.primary }, { v: stats.punctual, l: t('attendance.stats.punctual'), c: Colors.success }, { v: stats.late, l: t('attendance.stats.late'), c: Colors.warning }, { v: stats.absent, l: t('attendance.stats.absent'), c: Colors.error }].map(stat => (
          <View key={stat.l} style={[als.stat, { borderColor: border }]}><Text style={[als.statV, { color: stat.c }]}>{stat.v}</Text><Text style={[als.statL, { color: muted }]}>{stat.l}</Text></View>
        ))}
      </View>
      <View style={als.filterRow} accessibilityRole="tablist">
        {FILTERS.map(status => {
          const config = statusConfig[status];
          const selected = statusFilter === status;
          return <TouchableOpacity key={status} accessibilityRole="tab" accessibilityState={{ selected }} activeOpacity={0.7} onPress={() => setStatusFilter(selected ? null : status)} style={[als.filter, { borderColor: selected ? config.color : border, backgroundColor: selected ? config.color + '20' : inputBg }]}>
            <Text style={[als.filterText, { color: selected ? config.color : muted }]}>{config.label}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <FlatList
        data={visibleRecords}
        keyExtractor={record => record.id}
        contentContainerStyle={als.list}
        renderItem={({ item }) => {
          const config = statusConfig[item.status];
          return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${t('attendance.detail')}: ${item.userName}`} onPress={() => router.push(`/admin/attendance/${item.id}`)} style={[als.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={als.cardHeader}><Text style={[als.cardUser, { color: text }]}>{item.userName}</Text><View style={[als.statusBadge, { backgroundColor: config.color + '20' }]}><Text style={{ color: config.color, fontWeight: '700', fontSize: 12 }}>{config.label}</Text></View></View>
            <View style={als.cardInfo}>
              <Text style={{ color: muted, fontSize: 12 }}><Ionicons name="calendar-outline" size={12} color={muted} /> {formatDate(item.date)} · {formatTime(item.entryTime)}</Text>
              <Text style={{ color: muted, fontSize: 12 }}><Ionicons name="business-outline" size={12} color={muted} /> {t('attendance.fields.environment')}: {item.environmentName} · {t('attendance.fields.ficha')} {item.fichaNumber}</Text>
            </View>
            {item.delayMinutes > 0 && <Text style={{ color: Colors.warning, fontSize: 12, fontWeight: '700', marginTop: 4 }}>{t('attendance.fields.delay')}: {item.delayMinutes} min</Text>}
          </TouchableOpacity>;
        }}
        ListEmptyComponent={<View style={als.empty}><Text style={{ color: muted }}>{t('attendance.empty')}</Text></View>}
      />
    </View>
  );
}

const als = StyleSheet.create({
  safe: { flex: 1 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12, paddingHorizontal: 16, paddingTop: 16 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 }, stat: { flex: 1, minWidth: 0, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: 'center' }, statV: { fontSize: FontSize.xl, fontWeight: FontWeight.black }, statL: { fontSize: 10, marginTop: 2, textAlign: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 10 }, filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 }, filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 8, paddingBottom: 32 }, card: { borderRadius: 12, borderWidth: 1, padding: 14 }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }, cardUser: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold }, statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }, cardInfo: { gap: 3 }, empty: { alignItems: 'center', paddingVertical: 60 },
});
