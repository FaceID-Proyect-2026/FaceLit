// ─────────────────────────────────────────────
//  app/apprentice/join-ficha.tsx
//  Un aprendiz que quedó SIN ficha (porque el Coordinador lo marcó
//  como "traslado" al desvincularlo de su ficha anterior) usa esta
//  pantalla para ingresar el código de la ficha destino que le
//  compartieron y quedar asociado, sin pasar por una solicitud con
//  aprobación adicional (esa ya existe para el caso de traslado
//  solicitado por el propio aprendiz, ver transfer-request.tsx).
// ─────────────────────────────────────────────
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function JoinFichaScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { orphanLearners, joinFichaByCode } = useAcademic();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [joinedFicha, setJoinedFicha] = useState<string | null>(null);

  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;

  const isOrphan = orphanLearners.some(l => l.id === user?.id);

  const submit = () => {
    if (!code.trim()) { setError(t('academic.fichaCodeRequired', 'Ingresa el código de ficha')); return; }
    const result = joinFichaByCode(user?.id ?? '', code);
    if (!result.success) { setError(t((result as { error?: string }).error ?? 'academic.fichaCodeNotFound')); return; }
    setJoinedFicha((result as any).fichaNumber ?? '');
  };

  if (!isOrphan && !joinedFicha) {
    return (
      <View style={[jfs.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="checkmark-circle-outline" size={56} color={muted} />
        <Text style={[jfs.successTitle, { color: text }]}>{t('academic.joinNotNeeded', 'Ya estás asociado a una ficha')}</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={{ color: theme.primary, marginTop: 18 }}>{t('common.back')}</Text></TouchableOpacity>
      </View>
    );
  }

  if (joinedFicha !== null) {
    return (
      <View style={[jfs.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={[jfs.successTitle, { color: text }]}>{t('academic.joinFichaSuccess', '¡Listo! Quedaste vinculado a la ficha')} {joinedFicha}</Text>
        <TouchableOpacity onPress={() => router.replace('/apprentice' as any)}><Text style={{ color: theme.primary, marginTop: 18 }}>{t('common.back')}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[jfs.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={jfs.scroll}>
        <Ionicons name="link-outline" size={40} color={theme.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text style={[jfs.title, { color: text }]}>{t('academic.joinFichaTitle', 'Unirse a Ficha')}</Text>
        <Text style={[jfs.subtitle, { color: muted }]}>{t('academic.joinFichaSubtitle', 'Tu Coordinador te compartió el código de la nueva ficha. Ingrésalo aquí para quedar vinculado.')}</Text>
        <Text style={[jfs.label, { color: text }]}>{t('academic.learnerFields.code')}</Text>
        <TextInput
          value={code}
          onChangeText={v => { setCode(v); setError(''); }}
          placeholder="FCH-000"
          placeholderTextColor={muted}
          autoCapitalize="characters"
          style={[jfs.input, { color: text, borderColor: error ? Colors.error : muted }]}
        />
        {error ? <Text style={jfs.error}>{error}</Text> : null}
        <TouchableOpacity onPress={submit} style={[jfs.button, { backgroundColor: theme.primary }]}>
          <Text style={jfs.buttonText}>{t('academic.joinFichaTitle', 'Unirse a Ficha')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const jfs = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 24 },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', fontSize: FontSize.base, lineHeight: 22, marginBottom: 24 },
  label: { fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg },
  error: { color: Colors.error, marginTop: 6 },
  button: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  successTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginTop: 16 },
});
