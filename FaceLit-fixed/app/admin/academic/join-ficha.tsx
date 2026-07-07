import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function JoinFichaScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { allFichas, addLearner } = useAcademic();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!name.trim() || !lastname.trim() || !code.trim()) {
      setError('Completa todos los campos'); return;
    }
    const ficha = allFichas.find(f => f.code === code.trim());
    if (!ficha) { setError('Código de ficha no encontrado'); return; }
    if (ficha.status !== 'active') { setError('La ficha no está activa'); return; }
    addLearner(ficha.id, {
      id: Date.now().toString(),
      name: name.trim(),
      lastname: lastname.trim(),
      document: '0000000000',
      email: `${name.toLowerCase()}@mail.com`,
      role: 'aprendiz',
      status: 'active',
    });
    setJoined(true);
    setError('');
    Alert.alert('✓', t('academic.joinSuccess'));
  };

  if (joined) {
    return (
      <View style={[jfs.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={[jfs.successTitle, { color: text }]}>{t('academic.joinSuccess')}</Text>
        <Text style={[jfs.successSub, { color: muted }]}>{t('academic.joinDisabled')}</Text>
      </View>
    );
  }

  return (
    <View style={[jfs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={jfs.scroll}>
        <Text style={[jfs.title, { color: text }]}>{t('academic.joinTitle')}</Text>
        <Text style={[jfs.subtitle, { color: muted }]}>{t('academic.joinSubtitle')}</Text>
        <Text style={[jfs.label, { color: text }]}>{t('academic.learnerFields.name')}</Text>
        <TextInput style={[jfs.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
          value={name} onChangeText={setName} placeholder="Nombre" placeholderTextColor={isDark?'#5A7258':'#AAAAAA'} />
        <Text style={[jfs.label, { color: text }]}>{t('academic.learnerFields.lastname')}</Text>
        <TextInput style={[jfs.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
          value={lastname} onChangeText={setLastname} placeholder="Apellidos" placeholderTextColor={isDark?'#5A7258':'#AAAAAA'} />
        <Text style={[jfs.label, { color: text }]}>{t('academic.learnerFields.code')}</Text>
        <TextInput style={[jfs.input, { backgroundColor: inputBg, borderColor: error ? Colors.error : inputBorder, color: text }] as any}
          value={code} onChangeText={v => { setCode(v); setError(''); }} placeholder="FCH-000" placeholderTextColor={isDark?'#5A7258':'#AAAAAA'} />
        {error ? <Text style={jfs.error}>{error}</Text> : null}
        <TouchableOpacity onPress={handleJoin} style={[jfs.joinBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={jfs.joinBtnText}>{t('academic.joinTitle')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const jfs = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: FontSize.base, marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6, marginTop: 12 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 6 },
  joinBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  joinBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  successTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 16 },
  successSub: { fontSize: FontSize.base, marginTop: 8, textAlign: 'center' },
});
