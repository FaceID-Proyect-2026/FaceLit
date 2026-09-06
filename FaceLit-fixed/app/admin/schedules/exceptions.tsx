// ─────────────────────────────────────────────
//  app/admin/schedules/exceptions.tsx — Excepciones de un Horario
//  Ruta: /admin/schedules/exceptions?scheduleId=<id>
//
//  Las excepciones siempre están ligadas a un horario padre
//  (scheduleId por query param). El registro ahora se hace en un
//  modal (ExceptionFormModal); esta pantalla se encarga de listar y
//  mostrar el detalle de cada excepción ya registrada.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { ScheduleException, getExceptionStatus } from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import ExceptionFormModal from '@/features/schedules/components/ExceptionFormModal';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} ${time}`;
}

export default function ScheduleExceptionsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { scheduleId } = useLocalSearchParams<{ scheduleId?: string }>();
  const { getById, getExceptionsBySchedule, removeException } = useSchedules();
  const { getById: getEnvironment } = useEnvironments();
  const { getFicha } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [formOpen, setFormOpen] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const schedule = scheduleId ? getById(scheduleId) : undefined;
  const exceptions = scheduleId ? getExceptionsBySchedule(scheduleId) : [];

  const handleDelete = (item: ScheduleException) => {
    if (getExceptionStatus(item.endTimestamp) === 'active') {
      alert(t('common.error'), t('schedules.exceptionDeleteBlocked'));
      return;
    }
    alert(t('schedules.delete'), t('schedules.exceptionDeleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.delete'), style: 'destructive', onPress: () => {
        const r = removeException(item.id);
        if (r.success) alert('✓', t('schedules.exceptionDeleteSuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  // ── Estado sin horario padre válido ──────────
  if (!schedule) {
    return (
      <View style={[ses.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={40} color={muted} style={{ marginBottom: 12 }} />
        <Text style={{ color: muted, textAlign: 'center', marginBottom: 20 }}>
          {scheduleId ? t('schedules.notFound') : t('schedules.exceptionsNoSchedule')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/admin/schedules' as any)}
          style={[ses.backToListBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={ses.addBtnText}>{t('schedules.title')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fichaNumber = getFicha(schedule.fichaId)?.number ?? schedule.fichaNumber;
  const environmentName = getEnvironment(schedule.environmentId)?.code ?? schedule.environmentName ?? t('schedules.unassigned');

  return (
    <View style={[ses.safe, { backgroundColor: bg }]}>
      <View style={[ses.header, isMobile && ses.headerMobile]}>
        <View style={ses.headerTop}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[ses.title, { color: text }]}>{t('schedules.exceptions')}</Text>
            <Text style={{ color: muted, fontSize: FontSize.xs, marginTop: 2 }} numberOfLines={1}>
              Ficha {fichaNumber} · {t(`schedules.days.${schedule.day}`)} · {schedule.startTime}-{schedule.endTime} · {environmentName}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setFormOpen(true)} style={[ses.addBtn, isMobile && ses.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={Colors.white} /><Text style={ses.addBtnText}>{t('schedules.exceptionRegister')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={exceptions} keyExtractor={e => e.id}
        contentContainerStyle={ses.list}
        renderItem={({ item }) => {
          const status = getExceptionStatus(item.endTimestamp);
          const statusColor = status === 'active' ? Colors.success : muted;
          return (
            <View style={[ses.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="alert-circle" size={18} color={Colors.warning} />
                <Text style={[ses.cardTitle, { color: text, flex: 1 }]}>{t(`schedules.exceptionTypes.${item.type}`)}</Text>
                <View style={[ses.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={{ color: statusColor, fontWeight: '700', fontSize: 11 }}>{t(`schedules.exceptionStatus.${status}`)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item)} style={[ses.iconBtn, { backgroundColor: Colors.error + '15', opacity: status === 'active' ? 0.4 : 1 }]}>
                  <Ionicons name="trash-outline" size={15} color={Colors.error} />
                </TouchableOpacity>
              </View>
              <Text style={[ses.cardText, { color: muted }]}>
                {t('schedules.exceptionFields.startDate')}: {item.startDate} · {t('schedules.exceptionFields.activeUntil', { date: formatDateTime(item.endTimestamp) })}
              </Text>
              <Text style={[ses.cardText, { color: muted }]}>{item.reason}</Text>
              {item.replacementInstructorName && <Text style={[ses.cardText, { color: muted }]}>{t('schedules.exceptionFields.replacement')}: {item.replacementInstructorName}</Text>}
              {item.alternateEnvironmentCode && <Text style={[ses.cardText, { color: muted }]}>{t('schedules.exceptionFields.alternateEnv')}: {item.alternateEnvironmentCode}</Text>}
            </View>
          );
        }}
        ListEmptyComponent={<View style={ses.empty}><Text style={{ color: muted }}>{t('schedules.noExceptions')}</Text></View>}
      />
      {DialogUI}
      <ExceptionFormModal visible={formOpen} onClose={() => setFormOpen(false)} schedule={schedule} />
    </View>
  );
}

const ses = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch' },
  headerTop: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 12, alignSelf: 'stretch', marginTop: 10 },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold },
  backToListBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardText: { fontSize: FontSize.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  iconBtn: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
