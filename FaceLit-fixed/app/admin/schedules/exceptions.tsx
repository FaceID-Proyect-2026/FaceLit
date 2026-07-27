// ─────────────────────────────────────────────
//  app/admin/schedules/exceptions.tsx — Excepciones de Horario
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_INSTRUCTORS } from '@/features/schedules/types';
import { useSchedules } from '@/features/schedules/useSchedules';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const EXCEPTION_TYPES = ['instructorChange', 'envChange', 'cancel', 'reschedule', 'other'] as const;

export default function ScheduleExceptionsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { allSchedules, exceptions, registerException, removeException } = useSchedules();
  const { environments } = useEnvironments();
  const { alert, DialogUI } = useAppDialog();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<typeof EXCEPTION_TYPES[number]>('instructorChange');
  const [scheduleId, setScheduleId] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [replacementInstructor, setReplacementInstructor] = useState('');
  const [newEnvironment, setNewEnvironment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeEnvs = environments.filter(e => e.status === 'active');

  const resetForm = () => {
    setType('instructorChange'); setScheduleId(''); setDate(''); setReason('');
    setReplacementInstructor(''); setNewEnvironment(''); setErrors({});
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!scheduleId) e.schedule = t('schedules.conflicts.noFicha');
    if (!date.trim()) e.date = t('common.required');
    if (!reason.trim()) e.reason = t('common.required');
    if (type === 'instructorChange' && !replacementInstructor) e.replacement = t('common.required');
    if (type === 'envChange' && !newEnvironment) e.newEnv = t('common.required');
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const replacement = MOCK_INSTRUCTORS.find(i => i.id === replacementInstructor);
    const env = activeEnvs.find(en => en.id === newEnvironment);
    registerException({
      scheduleId, type, date: date.trim(), reason: reason.trim(),
      replacementInstructor: replacement?.name,
      newEnvironment: env?.code,
    });
    resetForm();
    setShowForm(false);
    alert('✓', t('schedules.exceptionRegisterSuccess'));
  };

  const handleDelete = (id: string) => {
    alert(t('schedules.delete'), t('schedules.exceptionDeleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.delete'), style: 'destructive', onPress: () => {
        removeException(id);
        alert('✓', t('schedules.exceptionDeleteSuccess'));
      }},
    ]);
  };

  const Chip = ({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[ses.chip, { backgroundColor: selected ? theme.primary + '20' : inputBg, borderColor: selected ? theme.primary : border }]}>
      <Text style={{ color: selected ? theme.primary : muted, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[ses.safe, { backgroundColor: bg }]}>
      <View style={ses.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity>
        <Text style={[ses.title, { color: text }]}>{t('schedules.exceptions')}</Text>
        <TouchableOpacity onPress={() => setShowForm(v => !v)} style={[ses.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name={showForm ? 'close' : 'add'} size={18} color={Colors.white} /><Text style={ses.addBtnText}>{t('schedules.exceptionRegister')}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <ScrollView style={[ses.form, { backgroundColor: cardBg, borderColor: border }]} contentContainerStyle={{ padding: 14 }}>
          <Text style={[ses.formLabel, { color: text }]}>{t('schedules.exceptionFields.type')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {EXCEPTION_TYPES.map(tp => (
              <Chip key={tp} selected={type === tp} label={t(`schedules.exceptionTypes.${tp}`)} onPress={() => setType(tp)} />
            ))}
          </View>

          <Text style={[ses.formLabel, { color: text }]}>{t('schedules.selectSchedule')}</Text>
          {allSchedules.length === 0 ? (
            <Text style={{ color: muted, fontSize: FontSize.sm, marginBottom: 12 }}>{t('schedules.noSchedulesForException')}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {allSchedules.map(s => (
                  <Chip key={s.id} selected={scheduleId === s.id} label={`Ficha ${s.fichaNumber} · ${t(`schedules.days.${s.day}`)}`} onPress={() => setScheduleId(s.id)} />
                ))}
              </View>
            </ScrollView>
          )}
          {errors.schedule ? <Text style={ses.error}>{errors.schedule}</Text> : null}

          <Text style={[ses.formLabel, { color: text, marginTop: 12 }]}>{t('schedules.exceptionFields.date')}</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor={muted}
            style={[ses.input, { color: text, borderColor: border, backgroundColor: inputBg }]} />
          {errors.date ? <Text style={ses.error}>{errors.date}</Text> : null}

          <Text style={[ses.formLabel, { color: text, marginTop: 12 }]}>{t('schedules.exceptionFields.reason')}</Text>
          <TextInput value={reason} onChangeText={setReason} placeholder={t('schedules.exceptionFields.reason')} placeholderTextColor={muted}
            style={[ses.input, { color: text, borderColor: border, backgroundColor: inputBg }]} />
          {errors.reason ? <Text style={ses.error}>{errors.reason}</Text> : null}

          {type === 'instructorChange' && (
            <>
              <Text style={[ses.formLabel, { color: text, marginTop: 12 }]}>{t('schedules.exceptionFields.replacement')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {MOCK_INSTRUCTORS.map(i => (
                  <Chip key={i.id} selected={replacementInstructor === i.id} label={i.name} onPress={() => setReplacementInstructor(i.id)} />
                ))}
              </View>
              {errors.replacement ? <Text style={ses.error}>{errors.replacement}</Text> : null}
            </>
          )}

          {type === 'envChange' && (
            <>
              <Text style={[ses.formLabel, { color: text, marginTop: 12 }]}>{t('schedules.exceptionFields.newEnv')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {activeEnvs.map(e => (
                  <Chip key={e.id} selected={newEnvironment === e.id} label={e.code} onPress={() => setNewEnvironment(e.id)} />
                ))}
              </View>
              {errors.newEnv ? <Text style={ses.error}>{errors.newEnv}</Text> : null}
            </>
          )}

          <TouchableOpacity onPress={handleSave} style={[ses.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={ses.saveBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <FlatList data={exceptions} keyExtractor={e => e.id}
        contentContainerStyle={ses.list}
        renderItem={({ item }) => (
          <View style={[ses.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="alert-circle" size={18} color={Colors.warning} />
              <Text style={[ses.cardTitle, { color: text, flex: 1 }]}>{t(`schedules.exceptionTypes.${item.type}`)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={[ses.iconBtn, { backgroundColor: Colors.error + '15' }]}>
                <Ionicons name="trash-outline" size={15} color={Colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={[ses.cardText, { color: muted }]}>{t('schedules.exceptionFields.date')}: {item.date} · {item.reason}</Text>
            {item.replacementInstructor && <Text style={[ses.cardText, { color: muted }]}>{t('schedules.exceptionFields.replacement')}: {item.replacementInstructor}</Text>}
            {item.newEnvironment && <Text style={[ses.cardText, { color: muted }]}>{t('schedules.exceptionFields.newEnv')}: {item.newEnvironment}</Text>}
          </View>
        )}
        ListEmptyComponent={<View style={ses.empty}><Text style={{ color: muted }}>{t('schedules.noExceptions')}</Text></View>}
      />
      {DialogUI}
    </View>
  );
}

const ses = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold },
  form: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, maxHeight: 420 },
  formLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 42, borderWidth: 1.2, borderRadius: 10, paddingHorizontal: 12, fontSize: FontSize.sm } as any,
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.2 },
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  saveBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardText: { fontSize: FontSize.sm, marginTop: 2 },
  iconBtn: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
