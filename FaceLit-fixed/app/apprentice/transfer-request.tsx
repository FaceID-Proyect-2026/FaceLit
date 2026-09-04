import { useAcademic } from '@/features/academic/useAcademic';
import { useTransferRequests } from '@/features/academic/useTransferRequests';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function TransferRequestScreen() {
  const { theme, isDark } = useTheme(); const { t } = useTranslation(); const { user } = useAuth();
  const { allFichas } = useAcademic(); const { create } = useTransferRequests(); const [code, setCode] = useState(''); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  const currentFicha = allFichas.find(ficha => ficha.status === 'active' && ficha.learners.some(learner => learner.id === user?.id));
  const bg = isDark ? Colors.dark.background : Colors.light.background; const text = isDark ? Colors.dark.text : Colors.light.text; const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const submit = () => { if (!currentFicha) return; const normalizedCode = code.trim().toLowerCase(); const requested = allFichas.find(ficha => ficha.code.toLowerCase() === normalizedCode || ficha.number === code.trim()); if (!requested) { setError(t('academic.fichaCodeNotFound')); return; } if (requested.status !== 'active') { setError(t('academic.fichaInactive')); return; } const result = create(user?.id ?? 'l1', currentFicha.id, requested.id); if (!result.success) { setError(t(result.error!)); return; } setSent(true); };
  if (!currentFicha) return <View style={[styles.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}><Text style={[styles.successTitle, { color: text }]}>{t('academic.joinDisabled')}</Text></View>;
  if (sent) return <View style={[styles.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}><Ionicons name="checkmark-circle" size={64} color={Colors.success} /><Text style={[styles.successTitle, { color: text }]}>{t('academic.transferRequestSuccess')}</Text><TouchableOpacity onPress={() => router.back()}><Text style={{ color: theme.primary, marginTop: 18 }}>{t('common.back')}</Text></TouchableOpacity></View>;
  return <View style={[styles.safe, { backgroundColor: bg }]}><ScrollView contentContainerStyle={styles.scroll}><Text style={[styles.title, { color: text }]}>{t('academic.transferRequestTitle')}</Text><Text style={[styles.subtitle, { color: muted }]}>{t('academic.transferRequestSubtitle')}</Text><Text style={[styles.label, { color: text }]}>{t('academic.learnerFields.code')}</Text><TextInput value={code} onChangeText={value => { setCode(value); setError(''); }} placeholder="FCH-000" placeholderTextColor={muted} style={[styles.input, { color: text, borderColor: error ? Colors.error : muted }]} />{error ? <Text style={styles.error}>{error}</Text> : null}<TouchableOpacity onPress={submit} style={[styles.button, { backgroundColor: theme.primary }]}><Text style={styles.buttonText}>{t('academic.transferRequestTitle')}</Text></TouchableOpacity></ScrollView></View>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, scroll: { padding: 24 }, title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 }, subtitle: { textAlign: 'center', fontSize: FontSize.base, lineHeight: 22, marginBottom: 24 }, label: { fontWeight: FontWeight.bold, marginBottom: 6 }, input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg }, error: { color: Colors.error, marginTop: 6 }, button: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 }, buttonText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold }, successTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginTop: 16 } });