import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_INSTRUCTORS, SCHEDULE_DAYS } from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { SelectField, TimeInput } from '@/shared/components/ui';
import InputField from '@/shared/components/ui/InputField';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const TIME_24_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function ScheduleRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { getById, register, update, checkConflict } = useSchedules();
  const { environments } = useEnvironments();
  const { allFichas, getProgram } = useAcademic();
  const { alert, DialogUI } = useAppDialog();

  const textCol = isDark ? Colors.dark.text : Colors.light.text;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [selectedFicha, setFicha] = useState('');
  const [day, setDay] = useState<string>('');
  const [startTime, setStart] = useState('');
  const [endTime, setEnd] = useState('');
  const [envCode, setEnvCode] = useState('');
  const [selectedInstructor, setInst] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const existing = getById(id);
    if (!existing) return;
    setFicha(existing.fichaId);
    setDay(existing.day);
    setStart(existing.startTime);
    setEnd(existing.endTime);
    setEnvCode(existing.environmentName);
    setInst(existing.instructorId);
  }, [id]);

  const activeFichas = allFichas.filter(f => f.status === 'active' && !!f.programId);

  const dayOptions = SCHEDULE_DAYS.map(d => ({
    value: d,
    label: t(`schedules.days.${d}`),
  }));

  const fichaOptions = activeFichas.map(f => ({
    value: f.id,
    label: `Ficha ${f.number} - ${f.code}`,
  }));

  const instructorOptions = MOCK_INSTRUCTORS.map(i => ({
    value: i.id,
    label: i.name,
  }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    if (!selectedFicha) e.ficha = t('schedules.conflicts.noFicha');
    if (!day) e.day = t('schedules.conflicts.invalidTime');
    if (!selectedInstructor) e.inst = t('schedules.conflicts.noInstructor');

    if (!startTime) {
      e.startTime = t('schedules.conflicts.invalidTime');
    } else if (!TIME_24_REGEX.test(startTime)) {
      e.startTime = t('schedules.conflicts.invalidFormat');
    }

    if (!endTime) {
      e.endTime = t('schedules.conflicts.invalidTime');
    } else if (!TIME_24_REGEX.test(endTime)) {
      e.endTime = t('schedules.conflicts.invalidFormat');
    }

    if (startTime && endTime && TIME_24_REGEX.test(startTime) && TIME_24_REGEX.test(endTime)) {
      if (startTime >= endTime) e.time = t('schedules.conflicts.invalidTime');
    }

    if (!envCode.trim()) {
      e.env = t('schedules.conflicts.noEnv');
    }

    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const environment = environments.find(env => env.code.toLowerCase() === envCode.trim().toLowerCase());
    if (!environment) {
      setErrors(p => ({ ...p, env: t('schedules.conflicts.envNotFound') }));
      return;
    }

    const conflict = checkConflict({
      day,
      startTime,
      endTime,
      environmentId: environment.id,
      instructorId: selectedInstructor,
      excludeId: isEditing ? id : undefined,
    });

    if (conflict.envOccupied) {
      setErrors(p => ({ ...p, env: t('schedules.conflicts.envOccupied') }));
      return;
    }
    if (conflict.instructorBusy) {
      setErrors(p => ({ ...p, inst: t('schedules.conflicts.instructorBusy') }));
      return;
    }

    const ficha = activeFichas.find(f => f.id === selectedFicha);
    const instructor = MOCK_INSTRUCTORS.find(i => i.id === selectedInstructor);
    if (!ficha || !instructor) return;

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

    const result = isEditing ? update(id as string, data) : register(data);
    if (result.success) {
      alert('✓', t(isEditing ? 'schedules.updateSuccess' : 'schedules.registerSuccess'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } else if (result.error) {
      alert(t('common.error'), t(result.error));
    }
  };

  return (
    <View style={[srs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={srs.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={srs.backBtn}>
          <Ionicons name="arrow-back" size={20} color={textCol} />
          <Text style={[srs.backText, { color: textCol }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[srs.title, { color: textCol }]}>
          {t(isEditing ? 'schedules.edit' : 'schedules.register')}
        </Text>

        <SelectField
          label={t('schedules.fields.ficha')}
          value={selectedFicha}
          options={fichaOptions}
          onSelect={v => { setFicha(v); setErrors(p => ({ ...p, ficha: '' })); }}
          error={errors.ficha}
          placeholder="Seleccionar ficha"
        />

        <SelectField
          label={t('schedules.fields.day')}
          value={day}
          options={dayOptions}
          onSelect={v => { setDay(v); setErrors(p => ({ ...p, day: '' })); }}
          error={errors.day}
          placeholder="Seleccionar día"
        />

        <View style={srs.row}>
          <TimeInput
            label={t('schedules.fields.startTime')}
            value={startTime}
            onChange={v => { setStart(v); setErrors(p => ({ ...p, startTime: '', time: '' })); }}
            error={errors.startTime || errors.time}
            containerStyle={srs.halfField}
          />
          <TimeInput
            label={t('schedules.fields.endTime')}
            value={endTime}
            onChange={v => { setEnd(v); setErrors(p => ({ ...p, endTime: '', time: '' })); }}
            error={errors.endTime}
            containerStyle={srs.halfField}
          />
        </View>

        <InputField
          label={t('schedules.fields.environment')}
          value={envCode}
          onChangeText={v => { setEnvCode(v); setErrors(p => ({ ...p, env: '' })); }}
          placeholder="Ej: 101-1"
          error={errors.env}
          autoCapitalize="none"
        />

        <SelectField
          label={t('schedules.fields.instructor')}
          value={selectedInstructor}
          options={instructorOptions}
          onSelect={v => { setInst(v); setErrors(p => ({ ...p, inst: '' })); }}
          error={errors.inst}
          placeholder="Seleccionar instructor"
        />

        <TouchableOpacity onPress={handleSave} style={[srs.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={srs.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
      {DialogUI}
    </View>
  );
}

const srs = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
