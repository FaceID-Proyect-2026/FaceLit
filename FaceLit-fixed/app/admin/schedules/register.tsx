// ─────────────────────────────────────────────
//  app/admin/schedules/register.tsx — Registrar/Editar Horario
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_INSTRUCTORS, SCHEDULE_DAYS, TIME_SLOTS } from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ScheduleRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { getById, register, update, checkConflict } = useSchedules();
  const { environments } = useEnvironments();
  const { allFichas, getProgram } = useAcademic();
  const { alert, DialogUI } = useAppDialog();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [selectedFicha, setFicha] = useState('');
  const [day, setDay] = useState<string>(SCHEDULE_DAYS[0]);
  const [startTime, setStart] = useState('07:00');
  const [endTime, setEnd] = useState('12:00');
  const [selectedEnv, setEnv] = useState('');
  const [selectedInstructor, setInst] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Precarga los datos del horario cuando se abre en modo edición.
  useEffect(() => {
    if (!id) return;
    const existing = getById(id);
    if (!existing) return;
    setFicha(existing.fichaId);
    setDay(existing.day);
    setStart(existing.startTime);
    setEnd(existing.endTime);
    setEnv(existing.environmentId);
    setInst(existing.instructorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Solo fichas activas y actualmente vinculadas a un programa pueden
  // usarse en un horario (una ficha desvinculada no debe estar disponible
  // hasta que vuelva a vincularse — RF-2/RF-3).
  const activeFichas = allFichas.filter(f => f.status === 'active' && !!f.programId);
  const activeEnvs = environments.filter(e => e.status === 'active');

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!selectedFicha) e.ficha = t('schedules.conflicts.noFicha');
    if (!selectedEnv) e.env = t('schedules.conflicts.noEnv');
    if (!selectedInstructor) e.inst = t('schedules.conflicts.noInstructor');
    if (startTime >= endTime) e.time = t('schedules.conflicts.invalidTime');
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const conflict = checkConflict({ day, startTime, endTime, environmentId: selectedEnv, instructorId: selectedInstructor, excludeId: isEditing ? id : undefined });
    if (conflict.envOccupied) { setErrors(p => ({ ...p, env: t('schedules.conflicts.envOccupied') })); return; }
    if (conflict.instructorBusy) { setErrors(p => ({ ...p, inst: t('schedules.conflicts.instructorBusy') })); return; }

    const ficha = activeFichas.find(f => f.id === selectedFicha);
    const environment = activeEnvs.find(env => env.id === selectedEnv);
    const instructor = MOCK_INSTRUCTORS.find(i => i.id === selectedInstructor);
    if (!ficha || !environment || !instructor) return;
    const program = getProgram(ficha.programId);

    const data = {
      fichaId: ficha.id,
      fichaNumber: ficha.number,
      programName: program ? getProgramDisplayName(program, t) : '',
      day, startTime, endTime,
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

  const DropSelect = ({ label, value, options, onSelect, error }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={[srs.label, { color: text }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options.map((opt: any) => (
            <TouchableOpacity key={opt.value} onPress={() => onSelect(opt.value)}
              style={[srs.optCard, { backgroundColor: value === opt.value ? theme.primary + '20' : inputBg, borderColor: value === opt.value ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Text style={{ color: value === opt.value ? theme.primary : muted, fontWeight: '700', fontSize: 13 }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {error ? <Text style={srs.error}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={[srs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={srs.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={srs.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[srs.backText, { color: text }]}>{t('common.back')}</Text></TouchableOpacity>
        <Text style={[srs.title, { color: text }]}>{t(isEditing ? 'schedules.edit' : 'schedules.register')}</Text>

        <DropSelect label={t('schedules.fields.ficha')} value={selectedFicha} error={errors.ficha}
          options={activeFichas.map(f => ({ value: f.id, label: `Ficha ${f.number} - ${f.code}` }))} onSelect={setFicha} />

        <Text style={[srs.label, { color: text }]}>{t('schedules.fields.day')}</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {SCHEDULE_DAYS.map(d => (
            <TouchableOpacity key={d} onPress={() => setDay(d)}
              style={[srs.dayBtn, { backgroundColor: day === d ? theme.primary + '20' : inputBg, borderColor: day === d ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Text style={{ color: day === d ? theme.primary : muted, fontWeight: '700', fontSize: 13 }}>{t(`schedules.days.${d}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <DropSelect label={t('schedules.fields.startTime')} value={startTime}
          options={TIME_SLOTS.map(time => ({ value: time, label: time }))} onSelect={setStart} />
        <DropSelect label={t('schedules.fields.endTime')} value={endTime} error={errors.time}
          options={TIME_SLOTS.map(time => ({ value: time, label: time }))} onSelect={setEnd} />

        <DropSelect label={t('schedules.fields.environment')} value={selectedEnv} error={errors.env}
          options={activeEnvs.map(e => ({ value: e.id, label: `${e.code} (cap: ${e.quantity})` }))} onSelect={setEnv} />
        <DropSelect label={t('schedules.fields.instructor')} value={selectedInstructor} error={errors.inst}
          options={MOCK_INSTRUCTORS.map(i => ({ value: i.id, label: i.name }))} onSelect={setInst} />

        <TouchableOpacity onPress={handleSave} style={[srs.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={srs.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
      {DialogUI}
    </View>
  );
}

const srs = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 4 },
  optCard: { borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 10 },
  dayBtn: { borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 8 },
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
