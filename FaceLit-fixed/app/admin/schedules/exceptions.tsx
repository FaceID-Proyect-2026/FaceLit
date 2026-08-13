// ─────────────────────────────────────────────
//  app/admin/schedules/exceptions.tsx — Excepciones de un Horario
//  Ruta: /admin/schedules/exceptions?scheduleId=<id>
//
//  Corrección HU-06: las excepciones dejaron de ser una sección global
//  e independiente — ahora SIEMPRE están ligadas a un horario padre
//  (scheduleId por query param). Esta pantalla solo lista/gestiona las
//  excepciones del horario indicado; si no llega un scheduleId válido,
//  se muestra un estado vacío que guía de vuelta al listado de horarios.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import {
  EXCEPTION_TYPES, EXCEPTION_DURATION_UNITS, MOCK_INSTRUCTORS,
  ExceptionType, ExceptionDurationUnit, ScheduleException,
  computeExceptionEndTimestamp, getExceptionStatus,
} from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { SelectField, DateField, InputField } from '@/shared/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
  const {
    getById, getExceptionsBySchedule, registerException, removeException, checkExceptionAvail,
  } = useSchedules();
  const { environments, getById: getEnvironment } = useEnvironments();
  const { getFicha } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const schedule = scheduleId ? getById(scheduleId) : undefined;
  const exceptions = scheduleId ? getExceptionsBySchedule(scheduleId) : [];
  const activeEnvs = environments.filter(e => e.status === 'active');

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ExceptionType>('instructorChange');
  const [startDate, setStartDate] = useState('');
  const [durationAmount, setDurationAmount] = useState('');
  const [durationUnit, setDurationUnit] = useState<ExceptionDurationUnit>('days');
  const [reason, setReason] = useState('');
  const [alternateEnvironment, setAlternateEnvironment] = useState('');
  const [replacementInstructor, setReplacementInstructor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setType('instructorChange'); setStartDate(''); setDurationAmount(''); setDurationUnit('days');
    setReason(''); setAlternateEnvironment(''); setReplacementInstructor(''); setErrors({});
  };

  const typeOptions = EXCEPTION_TYPES.map(tp => ({ value: tp, label: t(`schedules.exceptionTypes.${tp}`) }));
  const unitOptions = EXCEPTION_DURATION_UNITS.map(u => ({ value: u, label: t(`schedules.exceptionFields.durationUnits.${u}`) }));
  const envOptions = activeEnvs.map(e => ({ value: e.id, label: e.code }));
  const instructorOptions = MOCK_INSTRUCTORS.map(i => ({ value: i.id, label: i.name }));

  const amountNumber = Number(durationAmount);
  const previewEndTimestamp =
    startDate && durationAmount && amountNumber > 0
      ? computeExceptionEndTimestamp(startDate, amountNumber, durationUnit)
      : null;

  const handleSave = () => {
    if (!schedule) return;
    const e: Record<string, string> = {};
    if (!startDate.trim()) e.startDate = t('common.required');
    if (!durationAmount.trim() || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      e.durationAmount = t('common.required');
    }
    if (!reason.trim()) e.reason = t('common.required');
    if (type === 'envChange' && !alternateEnvironment) e.alternateEnv = t('common.required');
    if (type === 'instructorChange' && !replacementInstructor) e.replacement = t('common.required');

    if (Object.keys(e).length === 0) {
      const availability = checkExceptionAvail({
        scheduleId: schedule.id,
        environmentId: alternateEnvironment || undefined,
        instructorId: type === 'instructorChange' ? replacementInstructor : undefined,
      });
      if (availability.envBusy) e.alternateEnv = t('schedules.conflicts.envOccupied');
      if (availability.instructorBusy) e.replacement = t('schedules.conflicts.instructorBusy');
    }

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const env = activeEnvs.find(en => en.id === alternateEnvironment);
    const instructor = MOCK_INSTRUCTORS.find(i => i.id === replacementInstructor);

    registerException({
      scheduleId: schedule.id,
      type,
      startDate: startDate.trim(),
      durationAmount: amountNumber,
      durationUnit,
      endTimestamp: computeExceptionEndTimestamp(startDate.trim(), amountNumber, durationUnit),
      reason: reason.trim(),
      alternateEnvironmentId: env?.id,
      alternateEnvironmentCode: env?.code,
      replacementInstructorId: type === 'instructorChange' ? instructor?.id : undefined,
      replacementInstructorName: type === 'instructorChange' ? instructor?.name : undefined,
    });
    resetForm();
    setShowForm(false);
    alert('✓', t('schedules.exceptionRegisterSuccess'));
  };

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
  const environmentName = getEnvironment(schedule.environmentId)?.code ?? schedule.environmentName;

  return (
    <View style={[ses.safe, { backgroundColor: bg }]}>
      <View style={[ses.header, isMobile && ses.headerMobile]}>
        <View style={ses.headerTop}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={[ses.title, { color: text }]}>{t('schedules.exceptions')}</Text>
            <Text style={{ color: muted, fontSize: FontSize.xs }} numberOfLines={1}>
              Ficha {fichaNumber} · {t(`schedules.days.${schedule.day}`)} · {schedule.startTime}-{schedule.endTime} · {environmentName}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowForm(v => !v)} style={[ses.addBtn, isMobile && ses.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name={showForm ? 'close' : 'add'} size={18} color={Colors.white} /><Text style={ses.addBtnText}>{t('schedules.exceptionRegister')}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <ScrollView style={[ses.form, { backgroundColor: cardBg, borderColor: border }]} contentContainerStyle={{ padding: 14 }} showsVerticalScrollIndicator={false}>
          <SelectField
            label={t('schedules.exceptionFields.type')}
            value={type}
            options={typeOptions}
            onSelect={(v: string) => { setType(v as ExceptionType); setErrors(p => ({ ...p, replacement: '', alternateEnv: '' })); }}
          />

          <DateField
            label={t('schedules.exceptionFields.startDate')}
            value={startDate}
            onChange={(v: string) => { setStartDate(v); setErrors(p => ({ ...p, startDate: '' })); }}
            minDate={todayIso()}
            error={errors.startDate}
          />

          <Text style={[ses.formLabel, { color: text }]}>{t('schedules.exceptionFields.duration')}</Text>
          <View style={ses.durationRow}>
            <InputField
              value={durationAmount}
              onChangeText={(v: string) => { setDurationAmount(v.replace(/[^0-9]/g, '')); setErrors(p => ({ ...p, durationAmount: '' })); }}
              placeholder={t('schedules.exceptionFields.durationAmount')}
              keyboardType="number-pad"
              error={errors.durationAmount}
              containerStyle={{ flex: 1 }}
            />
            <SelectField
              label=""
              value={durationUnit}
              options={unitOptions}
              onSelect={(v: string) => setDurationUnit(v as ExceptionDurationUnit)}
              containerStyle={{ flex: 1.3 }}
            />
          </View>

          <InputField
            label={t('schedules.exceptionFields.reason')}
            value={reason}
            onChangeText={(v: string) => { setReason(v); setErrors(p => ({ ...p, reason: '' })); }}
            placeholder={t('schedules.exceptionFields.reason')}
            error={errors.reason}
          />

          <View style={[ses.statusPreview, { borderColor: border }]}>
            <Ionicons name="time-outline" size={15} color={theme.primary} />
            <Text style={{ color: muted, fontSize: FontSize.xs, flex: 1 }}>
              {previewEndTimestamp
                ? t('schedules.exceptionFields.activeUntil', { date: formatDateTime(previewEndTimestamp) })
                : t('schedules.exceptionFields.statusHint')}
            </Text>
          </View>

          <SelectField
            label={t('schedules.exceptionFields.alternateEnv')}
            value={alternateEnvironment}
            options={envOptions}
            onSelect={(v: string) => { setAlternateEnvironment(v); setErrors(p => ({ ...p, alternateEnv: '' })); }}
            error={errors.alternateEnv}
            placeholder={t('schedules.placeholders.alternateEnv')}
          />

          {type === 'instructorChange' && (
            <SelectField
              label={t('schedules.exceptionFields.replacement')}
              value={replacementInstructor}
              options={instructorOptions}
              onSelect={(v: string) => { setReplacementInstructor(v); setErrors(p => ({ ...p, replacement: '' })); }}
              error={errors.replacement}
              placeholder={t('schedules.placeholders.instructor')}
            />
          )}

          <TouchableOpacity onPress={handleSave} style={[ses.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={ses.saveBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

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
  addBtnMobile: { justifyContent: 'center', paddingVertical: 12, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold },
  backToListBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  form: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, maxHeight: 480 },
  formLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 6 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statusPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4, marginBottom: 6 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardText: { fontSize: FontSize.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  iconBtn: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
