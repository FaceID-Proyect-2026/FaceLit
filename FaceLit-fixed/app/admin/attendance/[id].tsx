// ─────────────────────────────────────────────
//  app/admin/attendance/[id].tsx — Detalle de Asistencia
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_ATTENDANCE } from '@/features/attendance/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function AttendanceDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = MOCK_ATTENDANCE.find(a => a.id === id);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!record) return <View style={[ads.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Registro no encontrado</Text></View>;

  const statusConfig: Record<string,{color:string;label:string;icon:string}> = {
    punctual: { color: Colors.success, label: t('attendance.statuses.punctual'), icon: 'checkmark-circle' },
    late: { color: Colors.warning, label: t('attendance.statuses.late'), icon: 'time' },
    absent: { color: Colors.error, label: t('attendance.statuses.absent'), icon: 'close-circle' },
    invalidEnv: { color: Colors.info, label: t('attendance.statuses.invalidEnv'), icon: 'alert-circle' },
  };
  const sc = statusConfig[record.status] || statusConfig.absent;

  return (
    <View style={[ads.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ads.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={ads.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ads.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* Status Banner */}
        <View style={[ads.statusBanner, { backgroundColor: sc.color + '15', borderColor: sc.color + '40' }]}>
          <Ionicons name={sc.icon as any} size={48} color={sc.color} />
          <Text style={[ads.statusText, { color: sc.color }]}>{sc.label}</Text>
          {record.delayMinutes > 0 && (
            <Text style={[ads.delayText, { color: Colors.warning }]}>⏰ {record.delayMinutes} min de retraso</Text>
          )}
        </View>

        {/* Info */}
        <View style={[ads.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[ads.sectionTitle, { color: text }]}>{t('attendance.detail')}</Text>
          {[
            { icon: 'person-outline', label: t('attendance.fields.user'), value: record.userName },
            { icon: 'document-text-outline', label: t('attendance.fields.ficha'), value: record.fichaNumber },
            { icon: 'business-outline', label: t('attendance.fields.environment'), value: record.environmentName },
            { icon: 'calendar-outline', label: t('attendance.fields.date'), value: record.date },
            { icon: 'log-in-outline', label: t('attendance.fields.entryTime'), value: record.entryTime || '—' },
            { icon: 'log-out-outline', label: t('attendance.fields.exitTime'), value: record.exitTime || '—' },
            { icon: 'flag-outline', label: t('attendance.fields.status'), value: sc.label, valueColor: sc.color },
            record.delayMinutes > 0 ? { icon: 'timer-outline', label: t('attendance.fields.delay'), value: `${record.delayMinutes} minutos`, valueColor: Colors.warning } : null,
          ].filter(Boolean).map((row: any, i: number) => (
            <View key={i} style={[ads.infoRow, i < 7 && { borderBottomWidth: 1, borderBottomColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name={row.icon as any} size={16} color={muted} />
                <Text style={{ color: muted, fontSize: 13 }}>{row.label}</Text>
              </View>
              <Text style={{ color: row.valueColor || text, fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'right' }}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const ads = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBanner: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 20 },
  statusText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 8 },
  delayText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginTop: 4 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
});
