// ─────────────────────────────────────────────
//  features/schedules/components/ExceptionFormModal.tsx
//  Formulario para registrar una excepción sobre un horario — RF-4.4.
//  Antes vivía como sección plegable dentro de exceptions.tsx; ahora es
//  un modal, y valida en el mismo store las reglas de: fecha duplicada,
//  ambiente alterno igual al original, y disponibilidad de instructor/
//  ambiente contra los horarios oficiales.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { useEnvironments } from '@/features/environments/useEnvironments';
import {
  EXCEPTION_DURATION_UNITS, EXCEPTION_TYPES, ExceptionDurationUnit, ExceptionType,
  MOCK_INSTRUCTORS, Schedule, computeExceptionEndTimestamp,
} from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { DateField, InputField, SelectField } from '@/shared/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

interface ExceptionFormModalProps {
  visible: boolean;
  onClose: () => void;
  schedule: Schedule;
}

export default function ExceptionFormModal({ visible, onClose, schedule }: ExceptionFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { registerException, checkExceptionAvail } = useSchedules();
  const { environments } = useEnvironments();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;

  const activeEnvs = environments.filter(e => e.status === 'active');

  const [type, setType] = useState<ExceptionType>('instructorChange');
  const [startDate, setStartDate] = useState('');
  const [durationAmount, setDurationAmount] = useState('');
  const [durationUnit, setDurationUnit] = useState<ExceptionDurationUnit>('days');
  const [reason, setReason] = useState('');
  const [alternateEnvironment, setAlternateEnvironment] = useState('');
  const [replacementInstructor, setReplacementInstructor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setType('instructorChange'); setStartDate(''); setDurationAmount(''); setDurationUnit('days');
    setReason(''); setAlternateEnvironment(''); setReplacementInstructor(''); setErrors({});
  }, [visible]);

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

    const result = registerException({
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

    if (!result.success && result.error) {
      if (result.error.includes('Environment') || result.error === 'schedules.exceptionSameEnvironment') {
        setErrors(p => ({ ...p, alternateEnv: t(result.error!) }));
      } else {
        setErrors(p => ({ ...p, startDate: t(result.error!) }));
      }
      return;
    }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={t('schedules.exceptionRegister')}
      subtitle={`Ficha ${schedule.fichaNumber} · ${t(`schedules.days.${schedule.day}`)} · ${schedule.startTime}-${schedule.endTime}`}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[efm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[efm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
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

      <Text style={[efm.formLabel, { color: text }]}>{t('schedules.exceptionFields.duration')}</Text>
      <View style={efm.durationRow}>
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

      <View style={[efm.statusPreview, { borderColor: border }]}>
        <Ionicons name="time-outline" size={15} color={theme.primary} />
        <Text style={{ color: muted, fontSize: FontSize.xs, flex: 1 }}>
          {previewEndTimestamp
            ? t('schedules.exceptionFields.activeUntil', { date: formatDateTime(previewEndTimestamp) })
            : t('schedules.exceptionFields.statusHint')}
        </Text>
      </View>

      {type === 'envChange' && (
        <SelectField
          label={t('schedules.exceptionFields.alternateEnv')}
          value={alternateEnvironment}
          options={envOptions}
          onSelect={(v: string) => { setAlternateEnvironment(v); setErrors(p => ({ ...p, alternateEnv: '' })); }}
          error={errors.alternateEnv}
          placeholder={t('schedules.placeholders.alternateEnv')}
        />
      )}

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
    </FormModal>
  );
}

const efm = StyleSheet.create({
  formLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 6 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statusPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
