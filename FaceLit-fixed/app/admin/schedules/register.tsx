import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_INSTRUCTORS } from '@/features/schedules/types';
import { MOCK_FICHAS as fichas } from '@/features/academic/types';
import { MOCK_ENVIRONMENTS as envs } from '@/features/environments/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday'];

export default function ScheduleRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [selectedFicha, setFicha] = useState('');
  const [day, setDay] = useState('monday');
  const [startTime, setStart] = useState('07:00');
  const [endTime, setEnd] = useState('12:00');
  const [selectedEnv, setEnv] = useState('');
  const [selectedInstructor, setInst] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const activeFichas = fichas.filter(f => f.status === 'active');
  const activeEnvs = envs.filter(e => e.status === 'active');

  const handleSave = () => {
    const e: Record<string,string> = {};
    if (!selectedFicha) e.ficha = t('schedules.conflicts.noFicha');
    if (!selectedEnv) e.env = t('schedules.conflicts.noEnv');
    if (!selectedInstructor) e.inst = t('schedules.conflicts.noInstructor');
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    Alert.alert('✓', 'Horario registrado correctamente', [{ text: 'OK', onPress: () => router.back() }]);
  };

  const DropSelect = ({ label, value, options, onSelect, error, icon }: any) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={[srs.label, { color: text }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {options.map((opt: any) => (
            <TouchableOpacity key={opt.value} onPress={() => { onSelect(opt.value); setErrors(p=>({...p,[icon]:''})); }}
              style={[srs.optCard, { backgroundColor: value===opt.value ? theme.primary+'20' : inputBg, borderColor: value===opt.value ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Text style={{ color: value===opt.value ? theme.primary : muted, fontWeight:'700', fontSize:13 }}>{opt.label}</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={srs.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[srs.backText,{color:text}]}>{t('common.back')}</Text></TouchableOpacity>
        <Text style={[srs.title, { color: text }]}>{t('schedules.register')}</Text>
        <DropSelect label={t('schedules.fields.ficha')} value={selectedFicha} error={errors.ficha} icon="ficha"
          options={activeFichas.map(f => ({ value: f.id, label: `Ficha ${f.number} - ${f.code}` }))} onSelect={setFicha} />
        <Text style={[srs.label, { color: text }]}>{t('schedules.fields.day')}</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {DAYS.map(d => (
            <TouchableOpacity key={d} onPress={() => setDay(d)}
              style={[srs.dayBtn, { backgroundColor: day===d ? theme.primary+'20' : inputBg, borderColor: day===d ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Text style={{ color: day===d ? theme.primary : muted, fontWeight:'700', fontSize:13 }}>{t(`schedules.days.${d}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
          <View style={{ flex: 1 }}><Text style={[srs.label, { color: text }]}>{t('schedules.fields.startTime')}</Text>
            <View style={[srs.timeInput, { backgroundColor: inputBg, borderColor: inputBorder }]}><Text style={{ color: text, fontSize: 16 }}>{startTime}</Text></View></View>
          <View style={{ flex: 1 }}><Text style={[srs.label, { color: text }]}>{t('schedules.fields.endTime')}</Text>
            <View style={[srs.timeInput, { backgroundColor: inputBg, borderColor: inputBorder }]}><Text style={{ color: text, fontSize: 16 }}>{endTime}</Text></View></View>
        </View>
        <DropSelect label={t('schedules.fields.environment')} value={selectedEnv} error={errors.env} icon="env"
          options={activeEnvs.map(e => ({ value: e.id, label: `${e.name} (cap: ${e.capacity})` }))} onSelect={setEnv} />
        <DropSelect label={t('schedules.fields.instructor')} value={selectedInstructor} error={errors.inst} icon="inst"
          options={MOCK_INSTRUCTORS.map(i => ({ value: i.id, label: i.name }))} onSelect={setInst} />
        <TouchableOpacity onPress={handleSave} style={[srs.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={srs.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const srs = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection:'row',alignItems:'center',gap:4,marginBottom:12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 4 },
  optCard: { borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 10 },
  dayBtn: { borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 8 },
  timeInput: { height: 44, borderWidth: 1.2, borderRadius: 10, paddingHorizontal: 14, alignItems:'center',justifyContent:'center' },
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
