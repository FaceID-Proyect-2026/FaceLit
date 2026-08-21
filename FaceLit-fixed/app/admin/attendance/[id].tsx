import { useAttendance } from '@/features/attendance/useAttendance';
import { getProgramDisplayName } from '@/features/academic/types';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function AttendanceDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const record = useAttendance().find(item => item.id === id);
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!record) return <View style={[ads.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>{t('attendance.notFound')}</Text></View>;

  const statusConfig = { punctual: { color: Colors.success, label: t('attendance.statuses.punctual'), icon: 'checkmark-circle' }, late: { color: Colors.warning, label: t('attendance.statuses.late'), icon: 'time' }, absent: { color: Colors.error, label: t('attendance.statuses.absent'), icon: 'close-circle' }, invalidEnv: { color: Colors.info, label: t('attendance.statuses.invalidEnv'), icon: 'alert-circle' } } as const;
  const status = statusConfig[record.status];
  const formatDate = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(new Date(`${record.date}T12:00:00`));
  const formatTime = (value: string) => value ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(`1970-01-01T${value}:00`)) : '—';
  const sections: { title: string; rows: [string, string, string, string?][] }[] = [
    {
      title: t('attendance.sections.learner'),
      rows: [
        ['person-outline', t('attendance.fields.user'), record.userName],
        ['card-outline', t('attendance.fields.document'), record.userDocument],
        ['mail-outline', t('attendance.fields.email'), record.userEmail],
      ],
    },
    {
      title: t('attendance.sections.record'),
      rows: [
        ['flag-outline', t('attendance.fields.status'), status.label, status.color],
        ['calendar-outline', t('attendance.fields.date'), formatDate],
        ['log-in-outline', t('attendance.fields.entryTime'), formatTime(record.entryTime)],
        ['time-outline', t('attendance.fields.scheduledTime'), `${formatTime(record.scheduleStartTime)} – ${formatTime(record.scheduleEndTime)}`],
        ...(record.delayMinutes > 0 ? [['timer-outline', t('attendance.fields.delay'), `${record.delayMinutes} min`, Colors.warning] as [string, string, string, string]] : []),
      ],
    },
    {
      title: t('attendance.sections.academic'),
      rows: [
        ['document-text-outline', t('attendance.fields.ficha'), record.fichaNumber],
        ['school-outline', t('attendance.fields.program'), getProgramDisplayName({ id: record.programId, name: record.programName }, t)],
        ['business-outline', t('attendance.fields.environment'), record.environmentName],
        ['person-circle-outline', t('attendance.fields.instructor'), record.instructorName],
      ],
    },
  ];
  return <View style={[ads.safe, { backgroundColor: bg }]}><ScrollView contentContainerStyle={ads.scroll}>
    <TouchableOpacity onPress={() => router.back()} style={ads.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[ads.backText, { color: text }]}>{t('common.back')}</Text></TouchableOpacity>
    <View style={[ads.statusBanner, { backgroundColor: status.color + '15', borderColor: status.color + '40' }]}><Ionicons name={status.icon as any} size={48} color={status.color} /><Text style={[ads.statusText, { color: status.color }]}>{status.label}</Text></View>
    {sections.map(section => (
      <View key={section.title} style={[ads.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[ads.sectionTitle, { color: text }]}>{section.title}</Text>
        {section.rows.map(([icon, label, value, valueColor], index) => (
          <View key={String(label)} style={[ads.infoRow, index < section.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
            <View style={ads.label}><Ionicons name={icon as any} size={16} color={muted} /><Text style={{ color: muted, fontSize: 13, flexShrink: 1 }}>{label}</Text></View>
            <Text selectable style={{ color: valueColor || text, fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'right' }}>{value}</Text>
          </View>
        ))}
      </View>
    ))}
  </ScrollView></View>;
}
const ads = StyleSheet.create({ safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 }, backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }, backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold }, statusBanner: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center', marginBottom: 20 }, statusText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 8 }, card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 }, sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 14 }, infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 }, label: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, });
