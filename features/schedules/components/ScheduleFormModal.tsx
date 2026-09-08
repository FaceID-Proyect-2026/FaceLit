// ─────────────────────────────────────────────
//  features/schedules/components/ScheduleFormModal.tsx
//  Formulario de Horario (crear / editar) dentro de un modal — RF-4.1.
//
//  Antes, las horas se ingresaban con texto libre + AM/PM (TimeInput),
//  lo que producía estados inválidos/atascados al escribir (el "falla lo
//  de las horas" reportado). Ahora se seleccionan de una lista fija de
//  franjas de 30 min (TIME_SLOTS, ya definida en types.ts), lo que hace
//  imposible ingresar una hora mal formada.
//
//  Gestión Académica y Gestión de Horarios (Prompt maestro, sección 8):
//  se agrega el Período académico al flujo y, una vez seleccionados
//  período + ficha + día + hora inicio/fin, se consulta dinámicamente
//  qué instructores son ELEGIBLES y están DISPONIBLES, y qué ambientes
//  están DISPONIBLES — ANTES de poder elegirlos (secciones 9, 12, 13,
//  21). También se permite guardar el horario sin instructor y/o sin
//  ambiente (sección 14): ambos campos dejan de ser obligatorios.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAcademicPeriods } from '@/features/academic/periods/useAcademicPeriods';
import { getEnvironmentsAvailability, getInstructorsAvailability } from '@/features/schedules/availability';
import { SCHEDULE_DAYS, TIME_SLOTS } from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { SelectField } from '@/shared/components/ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ScheduleFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
  defaultFichaId?: string;
}

export default function ScheduleFormModal({ visible, onClose, editId, defaultFichaId }: ScheduleFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { getById, register, update } = useSchedules();
  const { allFichas, getProgram } = useAcademic();
  const { activePeriods } = useAcademicPeriods();
  const existing = editId ? getById(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [academicPeriodId, setAcademicPeriodId] = useState('');
  const [fichaId, setFichaId] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setAcademicPeriodId(existing?.academicPeriodId ?? activePeriods[0]?.id ?? '');
    setFichaId(existing?.fichaId ?? defaultFichaId ?? '');
    setDay(existing?.day ?? '');
    setStartTime(existing?.startTime ?? '');
    setEndTime(existing?.endTime ?? '');
    setEnvironmentId(existing?.environmentId ?? '');
    setInstructorId(existing?.instructorId ?? '');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const activeFichas = allFichas.filter(f => f.status === 'active' && !!f.programId);
  const selectedFicha = activeFichas.find(f => f.id === fichaId);
  const selectedProgram = selectedFicha ? getProgram(selectedFicha.programId) : undefined;

  const periodOptions = activePeriods.map(p => ({ value: p.id, label: p.name }));
  const fichaOptions = activeFichas.map(f => ({ value: f.id, label: `Ficha ${f.number} - ${f.code}` }));
  const dayOptions = SCHEDULE_DAYS.map(d => ({ value: d, label: t(`schedules.days.${d}`) }));
  // El selector de hora de fin solo ofrece franjas posteriores a la de
  // inicio, para no depender de una validación de texto libre.
  const startOptions = TIME_SLOTS.map(v => ({ value: v, label: v }));
  const endOptions = TIME_SLOTS.filter(v => !startTime || v > startTime).map(v => ({ value: v, label: v }));

  // Consulta de disponibilidad (sección 8): solo se calcula cuando ya
  // están seleccionados período, ficha/programa, día y ambas horas.
  const readyForAvailability = !!academicPeriodId && !!selectedProgram && !!day && !!startTime && !!endTime;

  const instructorsAvailability = useMemo(() => {
    if (!readyForAvailability || !selectedProgram) return [];
    return getInstructorsAvailability({
      academicPeriodId, programId: selectedProgram.id, day, startTime, endTime, excludeScheduleId: existing?.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyForAvailability, academicPeriodId, selectedProgram?.id, day, startTime, endTime, existing?.id]);

  const environmentsAvailability = useMemo(() => {
    if (!readyForAvailability) return [];
    return getEnvironmentsAvailability({ academicPeriodId, day, startTime, endTime, excludeScheduleId: existing?.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyForAvailability, academicPeriodId, day, startTime, endTime, existing?.id]);

  // Solo se puede seleccionar instructores elegibles Y disponibles — los
  // ocupados no se ofrecen para no permitir una asignación inválida
  // desde la propia interfaz (aunque igual queda validado en el store).
  const availableInstructors = instructorsAvailability.filter(i => i.available);
  const busyEligibleCount = instructorsAvailability.length - availableInstructors.length;
  const instructorOptions = [
    { value: '', label: t('schedules.unassigned') },
    ...availableInstructors.map(i => ({ value: i.instructorId, label: `${i.name} (${t(`academic.instructors.types.${i.type}`)})` })),
  ];

  const availableEnvironments = environmentsAvailability.filter(e => e.available);
  const busyEnvironmentCount = environmentsAvailability.length - availableEnvironments.length;
  const environmentOptions = [
    { value: '', label: t('schedules.unassigned') },
    ...availableEnvironments.map(e => ({ value: e.environmentId, label: e.code })),
  ];

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!academicPeriodId) e.period = t('common.required');
    if (!fichaId) e.ficha = t('schedules.conflicts.noFicha');
    if (!day) e.day = t('common.required');
    if (!startTime) e.startTime = t('common.required');
    if (!endTime) e.endTime = t('common.required');
    if (startTime && endTime && startTime >= endTime) e.endTime = t('schedules.conflicts.invalidTime');
    // Instructor y ambiente son OPCIONALES al crear/editar (sección 14):
    // un horario puede guardarse temporalmente sin alguno de los dos.
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const ficha = activeFichas.find(f => f.id === fichaId);
    if (!ficha) return;
    const program = getProgram(ficha.programId);
    const environment = availableEnvironments.find(env => env.environmentId === environmentId);
    const instructor = availableInstructors.find(i => i.instructorId === instructorId);

    const data = {
      fichaId: ficha.id,
      fichaNumber: ficha.number,
      programName: program ? getProgramDisplayName(program, t) : '',
      academicPeriodId,
      day,
      startTime,
      endTime,
      environmentId: environment?.environmentId ?? '',
      environmentName: environment?.code ?? '',
      instructorId: instructor?.instructorId ?? '',
      instructorName: instructor?.name ?? '',
    };

    const result = existing ? update(existing.id, data) : register(data);
    if (result.success) {
      onClose();
    } else if (result.error) {
      const message = t(result.error);
      if (result.error.includes('env')) setErrors(p => ({ ...p, env: message }));
      else if (result.error.includes('instructor')) setErrors(p => ({ ...p, inst: message }));
      else setErrors(p => ({ ...p, ficha: message }));
    }
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={existing ? t('schedules.edit') : t('schedules.register')}
      subtitle={t(existing ? 'schedules.editSubtitle' : 'schedules.registerSubtitle')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[sfm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[sfm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <SelectField label={t('schedules.fields.academicPeriod')} value={academicPeriodId} options={periodOptions}
        onSelect={v => { setAcademicPeriodId(v); setInstructorId(''); setEnvironmentId(''); setErrors(p => ({ ...p, period: '' })); }}
        error={errors.period} placeholder={t('schedules.placeholders.academicPeriod')} />

      <SelectField label={t('schedules.fields.ficha')} value={fichaId} options={fichaOptions}
        onSelect={v => { setFichaId(v); setInstructorId(''); setEnvironmentId(''); setErrors(p => ({ ...p, ficha: '' })); }}
        error={errors.ficha} placeholder={t('schedules.placeholders.ficha')} />

      <SelectField label={t('schedules.fields.day')} value={day} options={dayOptions}
        onSelect={v => { setDay(v); setInstructorId(''); setEnvironmentId(''); setErrors(p => ({ ...p, day: '' })); }}
        error={errors.day} placeholder={t('schedules.placeholders.day')} />

      <SelectField label={t('schedules.fields.startTime')} value={startTime} options={startOptions}
        onSelect={v => { setStartTime(v); if (endTime && endTime <= v) setEndTime(''); setInstructorId(''); setEnvironmentId(''); setErrors(p => ({ ...p, startTime: '', endTime: '' })); }}
        error={errors.startTime} placeholder={t('schedules.placeholders.time', 'Seleccionar hora')} />

      <SelectField label={t('schedules.fields.endTime')} value={endTime} options={endOptions}
        onSelect={v => { setEndTime(v); setInstructorId(''); setEnvironmentId(''); setErrors(p => ({ ...p, endTime: '' })); }}
        error={errors.endTime} placeholder={t('schedules.placeholders.time', 'Seleccionar hora')} />

      {!readyForAvailability ? (
        <Text style={[sfm.hint, { color: muted }]}>{t('schedules.availability.completeAbove')}</Text>
      ) : (
        <>
          <SelectField label={t('schedules.fields.instructor')} value={instructorId} options={instructorOptions}
            onSelect={v => { setInstructorId(v); setErrors(p => ({ ...p, inst: '' })); }}
            error={errors.inst} placeholder={t('schedules.placeholders.instructor')} />
          <Text style={[sfm.hint, { color: muted }]}>
            {availableInstructors.length === 0
              ? t('schedules.availability.noEligibleInstructors')
              : t('schedules.availability.instructorsSummary', { available: availableInstructors.length, busy: busyEligibleCount })}
          </Text>

          <SelectField label={t('schedules.fields.environment')} value={environmentId} options={environmentOptions}
            onSelect={v => { setEnvironmentId(v); setErrors(p => ({ ...p, env: '' })); }}
            error={errors.env} placeholder={t('schedules.placeholders.environment', 'Seleccionar ambiente')} />
          <Text style={[sfm.hint, { color: muted }]}>
            {availableEnvironments.length === 0
              ? t('schedules.availability.noAvailableEnvironments')
              : t('schedules.availability.environmentsSummary', { available: availableEnvironments.length, busy: busyEnvironmentCount })}
          </Text>
        </>
      )}
    </FormModal>
  );
}

const sfm = StyleSheet.create({
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
  hint: { fontSize: FontSize.xs, marginTop: -8, marginBottom: 14 },
});
