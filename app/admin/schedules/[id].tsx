// ─────────────────────────────────────────────
//  app/admin/schedules/[id].tsx — Detalle de Horario
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useSchedules } from '@/features/schedules/useSchedules';
import ScheduleFormModal from '@/features/schedules/components/ScheduleFormModal';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ScheduleDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, deactivate, reactivate, removePermanently, unassignInstructor, unassignEnvironment } = useSchedules();
  const { getById: getEnvironment } = useEnvironments();
  const { getFicha } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const [editModalOpen, setEditModalOpen] = useState(false);
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
  const environmentName = schedule.environmentId ? (getEnvironment(schedule.environmentId)?.code ?? schedule.environmentName) : t('schedules.unassigned');
  const instructorName = schedule.instructorId ? schedule.instructorName : t('schedules.unassigned');
  const fichaNumber = getFicha(schedule.fichaId)?.number ?? schedule.fichaNumber;

  const handleDeactivate = () => {
    alert(t('schedules.deactivate'), t('schedules.deactivateConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.deactivate'), style: 'destructive', onPress: () => { deactivate(schedule.id); } },
    ]);
  };

  const handleReactivate = () => {
    const r = reactivate(schedule.id);
    if (!r.success && r.error) alert(t('common.error'), t(r.error));
  };

  const handleDeletePermanently = () => {
    alert(t('schedules.deletePermanently'), t('schedules.deletePermanentlyConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.deletePermanently'), style: 'destructive', onPress: () => {
        const r = removePermanently(schedule.id);
        if (r.success) router.back();
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  const handleUnassignInstructor = () => {
    alert(t('schedules.unassignInstructor'), t('schedules.unassignInstructorConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.unassignInstructor'), style: 'destructive', onPress: () => {
        const r = unassignInstructor(schedule.id);
        if (r.success) alert('✓', t('schedules.unassignInstructorSuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  const handleUnassignEnvironment = () => {
    alert(t('schedules.unassignEnvironment'), t('schedules.unassignEnvironmentConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.unassignEnvironment'), style: 'destructive', onPress: () => {
        const r = unassignEnvironment(schedule.id);
        if (r.success) alert('✓', t('schedules.unassignEnvironmentSuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
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

        <View style={sds.titleRow}>
          <Text style={[sds.title, { color: text }]}>{t('schedules.detail')}</Text>
          <View style={[sds.statusBadge, { backgroundColor: schedule.status === 'active' ? Colors.success + '20' : Colors.error + '20' }]}>
            <View style={[sds.statusDot, { backgroundColor: schedule.status === 'active' ? Colors.success : Colors.error }]} />
            <Text style={{ color: schedule.status === 'active' ? Colors.success : Colors.error, fontWeight: '700', fontSize: 12 }}>{t(`environments.statuses.${schedule.status}`)}</Text>
          </View>
        </View>

        <View style={[sds.card, { backgroundColor: cardBg, borderColor: border }]}>
          {[
            { icon: 'document-text-outline', label: t('schedules.fields.ficha'), value: `Ficha ${fichaNumber} — ${schedule.programName}` },
            { icon: 'calendar-outline', label: t('schedules.fields.day'), value: t(`schedules.days.${schedule.day}`) },
            { icon: 'time-outline', label: t('schedules.fields.startTime'), value: schedule.startTime },
            { icon: 'time-outline', label: t('schedules.fields.endTime'), value: schedule.endTime },
            { icon: 'business-outline', label: t('schedules.fields.environment'), value: environmentName },
            { icon: 'person-outline', label: t('schedules.fields.instructor'), value: instructorName },
            { icon: 'add-circle-outline', label: t('environments.detail.createdAt'), value: new Date(schedule.createdAt).toLocaleString() },
            { icon: 'sync-outline', label: t('environments.detail.updatedAt'), value: new Date(schedule.updatedAt).toLocaleString() },
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

        {/* RF-4.5 / RF-4.6 — Desvincular instructor / ambiente sin eliminar
            ni el horario ni la entidad del sistema. Colores distintos entre
            sí (y de las demás acciones) para que no se confundan. */}
        {schedule.status === 'active' && (schedule.instructorId || schedule.environmentId) && (
          <View style={sds.unassignRow}>
            {!!schedule.instructorId && (
              <TouchableOpacity onPress={handleUnassignInstructor} style={[sds.actionBtn, { borderColor: Colors.info }]} activeOpacity={0.7}>
                <Ionicons name="person-remove-outline" size={16} color={Colors.info} />
                <Text style={{ color: Colors.info, fontWeight: '700' }}>{t('schedules.unassignInstructor')}</Text>
              </TouchableOpacity>
            )}
            {!!schedule.environmentId && (
              <TouchableOpacity onPress={handleUnassignEnvironment} style={[sds.actionBtn, { borderColor: Colors.accentPurple }]} activeOpacity={0.7}>
                <Ionicons name="business-outline" size={16} color={Colors.accentPurple} />
                <Text style={{ color: Colors.accentPurple, fontWeight: '700' }}>{t('schedules.unassignEnvironment')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={sds.actions}>
          {schedule.status === 'active' ? (
            <>
              <TouchableOpacity onPress={() => setEditModalOpen(true)} style={[sds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('schedules.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeactivate} style={[sds.actionBtn, { borderColor: Colors.error }]} activeOpacity={0.7}>
                <Ionicons name="pause-outline" size={16} color={Colors.error} />
                <Text style={{ color: Colors.error, fontWeight: '700' }}>{t('schedules.deactivate')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleReactivate} style={[sds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('schedules.reactivate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeletePermanently} style={[sds.actionBtn, { borderColor: Colors.error }]} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={{ color: Colors.error, fontWeight: '700' }}>{t('schedules.deletePermanently')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      {DialogUI}
      <ScheduleFormModal visible={editModalOpen} editId={schedule.id} onClose={() => setEditModalOpen(false)} />
    </View>
  );
}

const sds = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  exceptionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginBottom: 14 },
  unassignRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12 },
});
