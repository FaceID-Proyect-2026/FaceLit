import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { JornadaType } from '@/features/academic/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const JORNADAS: { value: JornadaType; icon: string }[] = [
  { value: 'morning', icon: 'sunny-outline' },
  { value: 'afternoon', icon: 'partly-sunny-outline' },
  { value: 'night', icon: 'moon-outline' },
  { value: 'full', icon: 'time-outline' },
];

export default function FichaRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id: editId, programId: pid } = useLocalSearchParams<{ id?: string; programId?: string }>();
  const { programs, getFicha, addFicha, updateFicha } = useAcademic();
  const existing = editId ? getFicha(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const activePrograms = useMemo(() => programs.filter(p => p.status === 'active'), [programs]);

  const [number, setNumber] = useState(existing?.number ?? '');
  const [jornada, setJornada] = useState<JornadaType>(existing?.jornada ?? 'morning');
  const [selectedProgram, setSelectedProgram] = useState(existing?.programId ?? pid ?? '');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const validate = () => {
    const e: Record<string,string> = {};
    if (!number.trim()) e.number = 'Requerido';
    if (!selectedProgram) e.program = 'Selecciona un programa';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (existing) {
      updateFicha(existing.id, { number, jornada, programId: selectedProgram });
    } else {
      addFicha(number, jornada, selectedProgram);
    }
    Alert.alert('✓', existing ? 'Ficha actualizada' : 'Ficha registrada', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <View style={[frs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={frs.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={frs.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} /><Text style={[frs.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[frs.title, { color: text }]}>{existing ? t('academic.fichaEdit') : t('academic.fichaRegister')}</Text>

        <Text style={[frs.label, { color: text }]}>{t('academic.fields.fichaNumber')}</Text>
        <TextInput style={[frs.input, { backgroundColor: inputBg, borderColor: errors.number ? Colors.error : inputBorder, color: text }] as any}
          value={number} onChangeText={v => { setNumber(v.replace(/\D/g,'')); setErrors(p=>({...p,number:''})); }}
          placeholder="3145555" placeholderTextColor={isDark?'#5A7258':'#AAAAAA'} keyboardType="numeric" maxLength={10} />
        {errors.number?<Text style={frs.error}>{errors.number}</Text>:null}

        <Text style={[frs.label, { color: text, marginTop: 12 }]}>{t('academic.fields.jornada')}</Text>
        <View style={frs.jornadaGrid}>
          {JORNADAS.map(({ value, icon }) => (
            <TouchableOpacity key={value} onPress={() => setJornada(value)}
              style={[frs.jornadaCard, { backgroundColor: jornada===value ? theme.primary+'20' : inputBg, borderColor: jornada===value ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Ionicons name={icon as any} size={22} color={jornada===value ? theme.primary : muted} />
              <Text style={[frs.jornadaLabel, { color: jornada===value ? theme.primary : text }]}>{t(`academic.jornadas.${value}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[frs.label, { color: text, marginTop: 12 }]}>{t('academic.fields.programName')}</Text>
        <View style={frs.programList}>
          {activePrograms.map(p => (
            <TouchableOpacity key={p.id} onPress={() => { setSelectedProgram(p.id); setErrors(p=>({...p,program:''})); }}
              style={[frs.programCard, { backgroundColor: selectedProgram===p.id ? theme.primary+'15' : inputBg, borderColor: selectedProgram===p.id ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Ionicons name={selectedProgram===p.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedProgram===p.id ? theme.primary : muted} />
              <Text style={[frs.programName, { color: text }]}>{p.name}</Text>
            </TouchableOpacity>
          ))}
          {activePrograms.length===0 && <Text style={{ color: muted, textAlign: 'center', padding: 12 }}>No hay programas activos</Text>}
        </View>
        {errors.program?<Text style={frs.error}>{errors.program}</Text>:null}

        <TouchableOpacity onPress={handleSave} style={[frs.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={frs.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const frs = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  jornadaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  jornadaCard: { flex: 1, minWidth: 80, borderRadius: 12, borderWidth: 1.2, padding: 12, alignItems: 'center', gap: 6 },
  jornadaLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  programList: { gap: 8 },
  programCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1.2, padding: 12 },
  programName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
