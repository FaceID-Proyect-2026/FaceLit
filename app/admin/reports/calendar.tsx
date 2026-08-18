import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_ATTENDANCE } from '@/features/attendance/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CalendarReportScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const days = Array.from({ length: 30 }, (_, i) => {
    const date = `2026-06-${String(i+1).padStart(2,'0')}`;
    const records = MOCK_ATTENDANCE.filter(a => a.date === date);
    return { day: i+1, date, records };
  });

  return (
    <View style={[crs.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:16,paddingTop:12 }}><Ionicons name="arrow-back" size={20} color={text} /><Text style={{ color: text, fontWeight:'700' }}>{t('common.back')}</Text></TouchableOpacity>
      <Text style={[crs.title, { color: text, paddingHorizontal: 16, marginTop: 8 }]}>{t('reports.calendar')} — Junio 2026</Text>
      <View style={[crs.legend, { paddingHorizontal: 16, marginBottom: 8 }]}>
        {[{ c: Colors.success, l: t('reports.calendarLegend.present') },{ c: Colors.warning, l: t('reports.calendarLegend.late') },{ c: Colors.error, l: t('reports.calendarLegend.absent') }].map(x => (
          <View key={x.l} style={{ flexDirection:'row',alignItems:'center',gap:4 }}><View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: x.c }} /><Text style={{ color: muted, fontSize: 12 }}>{x.l}</Text></View>
        ))}
      </View>
      <ScrollView contentContainerStyle={crs.grid}>
        {days.map(({ day, records }) => {
          const color = records.length === 0 ? 'transparent' : records.some(r=>r.status==='absent') ? Colors.error : records.some(r=>r.status==='late') ? Colors.warning : Colors.success;
          return (
            <View key={day} style={[crs.dayCell, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[crs.dayNum, { color: text }]}>{day}</Text>
              {color !== 'transparent' && <View style={[crs.dot, { backgroundColor: color }]} />}
              {records.map(r => <Text key={r.id} style={{ color: muted, fontSize: 9 }}>{r.userName.split(' ')[0]}</Text>)}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const crs = StyleSheet.create({
  safe: { flex: 1 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
  legend: { flexDirection: 'row', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16 },
  dayCell: { width: '13%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  dayNum: { fontSize: 14, fontWeight: FontWeight.bold },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
});
