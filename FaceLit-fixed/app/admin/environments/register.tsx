// ─────────────────────────────────────────────
//  app/admin/environments/register.tsx
//  Formulario de registro/edición de ambiente
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { ENVIRONMENT_NAME_REGEX, EnvironmentStatus } from '@/features/environments/types';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function EnvironmentRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getById, register, update } = useEnvironments();
  const { alert, DialogUI } = useAppDialog();
  const existing = id ? getById(id) : null;
  const isEditing = !!existing;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [form, setForm] = useState({
    code: existing?.code ?? '',
  });
  const [status, setStatus] = useState<EnvironmentStatus>(existing?.status ?? 'active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const value = form.code.trim();
    if (!value) e.code = 'Requerido';
    else if (!ENVIRONMENT_NAME_REGEX.test(value)) e.code = 'Formato inválido. Ej: 209, 209-1, Laboratorio A';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (isEditing) {
      update(id!, { ...form, status });
      alert('✓', 'Ambiente actualizado', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      const newEnv = register({ ...form, status });
      alert('✓', 'Ambiente registrado', [
        {
          text: 'OK',
          // Lleva al usuario directo al ambiente ya registrado/asignado
          onPress: () => router.replace(`/admin/environments/${newEnv.id}` as any),
        },
      ]);
    }
  };

  return (
    <View style={[ers.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ers.scroll} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={ers.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ers.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[ers.title, { color: text }]}>
          {isEditing ? t('environments.edit') : t('environments.register')}
        </Text>

        {/* Nombre del ambiente */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.name')}</Text>
        <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.code ? Colors.error : inputBorder, color: text }] as any}
          value={form.code} onChangeText={v => { setForm({ code: v }); setErrors(p => ({ ...p, code: '' })); }}
          placeholder="Ej: 209, 209-1, Laboratorio A" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
        {errors.code ? <Text style={ers.error}>{errors.code}</Text> : null}

        {/* Estado */}
        <Text style={[ers.label, { color: text, marginTop: 16 }]}>{t('environments.fields.status')}</Text>
        <View style={ers.statusRow}>
          {(['active', 'inactive'] as const).map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setStatus(s)}
              style={[ers.statusBtn, { backgroundColor: status === s ? theme.primary + '25' : inputBg, borderColor: status === s ? theme.primary : inputBorder }]}
              activeOpacity={0.7}
            >
              <Text style={{ color: status === s ? theme.primary : muted, fontWeight: '700', fontSize: 14 }}>
                {t(`environments.statuses.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity onPress={handleSave} style={[ers.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={ers.saveBtnText}>{isEditing ? t('common.save') : t('environments.register')}</Text>
        </TouchableOpacity>
      </ScrollView>
      {DialogUI}
    </View>
  );
}

const ers = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6, marginTop: 12 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, borderRadius: 10, borderWidth: 1.2, paddingVertical: 10, alignItems: 'center' },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
