// ─────────────────────────────────────────────
//  features/schedules/components/ScheduleFormModal.tsx
//  Formulario de Horario (crear / editar) dentro de un modal — RF-4.1.
//
//  Antes, las horas se ingresaban con texto libre + AM/PM (TimeInput),
//  lo que producía estados inválidos/atascados al escribir (el "falla lo
//  de las horas" reportado). Ahora se seleccionan de una lista fija de
//  franjas de 30 min (TIME_SLOTS, ya definida en types.ts), lo que hace
//  imposible ingresar una hora mal formada.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { MOCK_INSTRUCTORS, SCHEDULE_DAYS, TIME_SLOTS } from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { SelectField } from '@/shared/components/ui';
import { useEffect, useState } from 'react';
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
  const { environments } = useEnvironments();
  const { allFichas, getProgram } = useAcademic();
  const existing = editId ? getById(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [fichaId, setFichaId] = useState('');
  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
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
  const activeEnvironments = environments.filter(e => e.status === 'active');

  const fichaOptions = activeFichas.map(f => ({ value: f.id, label: `Ficha ${f.number} - ${f.code}` }));
  const dayOptions = SCHEDULE_DAYS.map(d => ({ value: d, label: t(`schedules.days.${d}`) }));
  // El selector de hora de fin solo ofrece franjas posteriores a la de
  // inicio, para no depender de una validación de texto libre.
  const startOptions = TIME_SLOTS.map(v => ({ value: v, label: v }));
  const endOptions = TIME_SLOTS.filter(v => !startTime || v > startTime).map(v => ({ value: v, label: v }));
  const environmentOptions = activeEnvironments.map(e => ({ value: e.id, label: e.code }));
  const instructorOptions = MOCK_INSTRUCTORS.map(i => ({ value: i.id, label: i.name }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!fichaId) e.ficha = t('schedules.conflicts.noFicha');
    if (!day) e.day = t('common.required');
    if (!startTime) e.startTime = t('common.required');
    if (!endTime) e.endTime = t('common.required');
    if (startTime && endTime && startTime >= endTime) e.endTime = t('schedules.conflicts.invalidTime');
    if (!environmentId) e.env = t('schedules.conflicts.noEnv');
    if (!instructorId) e.inst = t('schedules.conflicts.noInstructor');
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const ficha = activeFichas.find(f => f.id === fichaId);
    const environment = activeEnvironments.find(env => env.id === environmentId);
    const instructor = MOCK_INSTRUCTORS.find(i => i.id === instructorId);
    if (!ficha || !environment || !instructor) return;
    const program = getProgram(ficha.programId);

    const data = {
      fichaId: ficha.id,
      fichaNumber: ficha.number,
      programName: program ? getProgramDisplayName(program, t) : '',
      day,
      startTime,
      endTime,
      environmentId: environment.id,
      environmentName: environment.code,
      instructorId: instructor.id,
      instructorName: instructor.name,
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
      <SelectField label={t('schedules.fields.ficha')} value={fichaId} options={fichaOptions}
        onSelect={v => { setFichaId(v); setErrors(p => ({ ...p, ficha: '' })); }}
        error={errors.ficha} placeholder={t('schedules.placeholders.ficha')} />

      <SelectField label={t('schedules.fields.day')} value={day} options={dayOptions}
        onSelect={v => { setDay(v); setErrors(p => ({ ...p, day: '' })); }}
        error={errors.day} placeholder={t('schedules.placeholders.day')} />

      <SelectField label={t('schedules.fields.startTime')} value={startTime} options={startOptions}
        onSelect={v => { setStartTime(v); if (endTime && endTime <= v) setEndTime(''); setErrors(p => ({ ...p, startTime: '', endTime: '' })); }}
        error={errors.startTime} placeholder={t('schedules.placeholders.time', 'Seleccionar hora')} />

      <SelectField label={t('schedules.fields.endTime')} value={endTime} options={endOptions}
        onSelect={v => { setEndTime(v); setErrors(p => ({ ...p, endTime: '' })); }}
        error={errors.endTime} placeholder={t('schedules.placeholders.time', 'Seleccionar hora')} />

      <SelectField label={t('schedules.fields.environment')} value={environmentId} options={environmentOptions}
        onSelect={v => { setEnvironmentId(v); setErrors(p => ({ ...p, env: '' })); }}
        error={errors.env} placeholder={t('schedules.placeholders.environment', 'Seleccionar ambiente')} />

      <SelectField label={t('schedules.fields.instructor')} value={instructorId} options={instructorOptions}
        onSelect={v => { setInstructorId(v); setErrors(p => ({ ...p, inst: '' })); }}
        error={errors.inst} placeholder={t('schedules.placeholders.instructor')} />
    </FormModal>
  );
}

const sfm = StyleSheet.create({
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
