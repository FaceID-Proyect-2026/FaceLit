import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProgramRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProgram, addProgram, updateProgram } = useAcademic();
  const existing = id ? getProgram(id) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [name, setName] = useState(existing?.name ?? '');
  const [status, setStatus] = useState<'active'|'inactive'>(existing?.status ?? 'active');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Requerido'); return; }
    if (existing) {
      updateProgram(existing.id, name, status);
    } else {
      addProgram(name);
    }
    Alert.alert('✓', existing ? 'Programa actualizado' : 'Programa registrado', [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <View style={[prs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={prs.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={prs.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[prs.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[prs.title, { color: text }]}>{existing ? t('academic.programEdit') : t('academic.programRegister')}</Text>
        <Text style={[prs.label, { color: text }]}>{t('academic.fields.programName')}</Text>
        <TextInput style={[prs.input, { backgroundColor: inputBg, borderColor: error ? Colors.error : inputBorder, color: text }] as any}
          value={name} onChangeText={v => { setName(v); setError(''); }} placeholder="Nombre del programa" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
        {error ? <Text style={prs.error}>{error}</Text> : null}
        <Text style={[prs.label, { color: text, marginTop: 16 }]}>Estado</Text>
        <View style={prs.statusRow}>
          {(['active','inactive'] as const).map(s => (
            <TouchableOpacity key={s} onPress={() => setStatus(s)}
              style={[prs.statusBtn, { backgroundColor: status === s ? theme.primary + '25' : inputBg, borderColor: status === s ? theme.primary : inputBorder }]} activeOpacity={0.7}>
              <Text style={{ color: status === s ? theme.primary : isDark ? '#5A7258' : '#AAAAAA', fontWeight: '700', fontSize: 14 }}>{t(`environments.statuses.${s}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleSave} style={[prs.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={prs.saveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const prs = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, borderRadius: 10, borderWidth: 1.2, paddingVertical: 10, alignItems: 'center' },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
