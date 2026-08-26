// ─────────────────────────────────────────────
//  app/admin/schedules/[id].tsx — Detalle de Horario
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useSchedules } from '@/features/schedules/useSchedules';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ScheduleDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, remove } = useSchedules();
  const { getById: getEnvironment } = useEnvironments();
  const { getFicha } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const schedule = getById(id);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  if (!schedule) {
    return (
      <View style={[sds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: muted }}>{t('schedules.notFound')}</Text>
      </View>
    );
  }

  // Nombre actual del ambiente/ficha (resuelto en vivo contra los módulos
  // de Ambientes y Académico); si la entidad ya no existe, se usa el
  // nombre guardado al momento de crear el horario como respaldo.
  const environmentName = getEnvironment(schedule.environmentId)?.code ?? schedule.environmentName;
  const fichaNumber = getFicha(schedule.fichaId)?.number ?? schedule.fichaNumber;

  const handleDelete = () => {
    alert(t('schedules.delete'), t('schedules.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.delete'), style: 'destructive', onPress: () => {
        remove(schedule.id);
        router.back();
      }},
    ]);
  };

  return (
    <View style={[sds.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={sds.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={sds.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[sds.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[sds.title, { color: text }]}>{t('schedules.detail')}</Text>

        <View style={[sds.card, { backgroundColor: cardBg, borderColor: border }]}>
          {[
            { icon: 'document-text-outline', label: t('schedules.fields.ficha'), value: `Ficha ${fichaNumber} — ${schedule.programName}` },
            { icon: 'calendar-outline', label: t('schedules.fields.day'), value: t(`schedules.days.${schedule.day}`) },
            { icon: 'time-outline', label: t('schedules.fields.startTime'), value: schedule.startTime },
            { icon: 'time-outline', label: t('schedules.fields.endTime'), value: schedule.endTime },
            { icon: 'business-outline', label: t('schedules.fields.environment'), value: environmentName },
            { icon: 'person-outline', label: t('schedules.fields.instructor'), value: schedule.instructorName },
          ].map((row, i, arr) => (
            <View key={i} style={[sds.infoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name={row.icon as any} size={16} color={theme.primary} />
                <Text style={{ color: muted, fontSize: 14 }}>{row.label}</Text>
              </View>
              <Text style={{ color: text, fontWeight: '600', fontSize: 14, flex: 1, textAlign: 'right' }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push(`/admin/schedules/exceptions?scheduleId=${schedule.id}` as any)}
          style={[sds.exceptionsBtn, { borderColor: Colors.warning }]} activeOpacity={0.7}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} />
          <Text style={{ color: Colors.warning, fontWeight: '700' }}>{t('schedules.exceptions')}</Text>
        </TouchableOpacity>

        <View style={sds.actions}>
          <TouchableOpacity onPress={() => router.push(`/admin/schedules/register?id=${schedule.id}` as any)}
            style={[sds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('schedules.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}
            style={[sds.actionBtn, { borderColor: Colors.error }]} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={{ color: Colors.error, fontWeight: '700' }}>{t('schedules.delete')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {DialogUI}
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
  exceptionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
});
