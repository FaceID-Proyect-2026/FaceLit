// ─────────────────────────────────────────────
//  app/admin/schedules/[id].tsx — Detalle de Horario
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_SCHEDULES } from '@/features/schedules/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const DAYS: Record<string,string> = { monday:'Lunes', tuesday:'Martes', wednesday:'Miércoles', thursday:'Jueves', friday:'Viernes', saturday:'Sábado' };

export default function ScheduleDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const schedule = MOCK_SCHEDULES.find(s => s.id === id);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!schedule) return <View style={[sds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Horario no encontrado</Text></View>;

  return (
    <View style={[sds.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={sds.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={sds.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[sds.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[sds.title, { color: text }]}>{t('schedules.detail')}</Text>

        {/* Info Card */}
        <View style={[sds.card, { backgroundColor: cardBg, borderColor: border }]}>
          {[
            { icon: 'document-text-outline', label: t('schedules.fields.ficha'), value: `Ficha ${schedule.fichaNumber} — ${schedule.programName}` },
            { icon: 'calendar-outline', label: t('schedules.fields.day'), value: DAYS[schedule.day] },
            { icon: 'time-outline', label: 'Horario', value: `${schedule.startTime} → ${schedule.endTime}` },
            { icon: 'business-outline', label: t('schedules.fields.environment'), value: schedule.environmentName },
            { icon: 'person-outline', label: t('schedules.fields.instructor'), value: schedule.instructorName },
          ].map((row, i) => (
            <View key={i} style={[sds.infoRow, i < 4 && { borderBottomWidth: 1, borderBottomColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name={row.icon as any} size={16} color={theme.primary} />
                <Text style={{ color: muted, fontSize: 14 }}>{row.label}</Text>
              </View>
              <Text style={{ color: text, fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'right' }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={sds.actions}>
          <TouchableOpacity onPress={() => router.push(`/admin/schedules/register?id=${schedule.id}` as any)}
            style={[sds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('schedules.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('Eliminar', '¿Eliminar este horario?', [{ text: t('common.cancel'), style: 'cancel' }, { text: t('schedules.delete'), style: 'destructive', onPress: () => router.back() }])}
            style={[sds.actionBtn, { borderColor: Colors.error }]} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={{ color: Colors.error, fontWeight: '700' }}>{t('schedules.delete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const sds = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
});
