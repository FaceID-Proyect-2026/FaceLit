// ─────────────────────────────────────────────
//  app/admin/environments/register.tsx
//  Formulario de registro/edición de ambiente
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { EnvironmentType, EnvironmentStatus } from '@/features/environments/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const TYPES: { value: EnvironmentType; icon: string }[] = [
  { value: 'classroom', icon: 'school-outline' },
  { value: 'laboratory', icon: 'flask-outline' },
  { value: 'workshop', icon: 'construct-outline' },
  { value: 'auditorium', icon: 'mic-outline' },
  { value: 'office', icon: 'briefcase-outline' },
];

const STATUSES: EnvironmentStatus[] = ['active', 'inactive', 'maintenance'];

export default function EnvironmentRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getById, register, update } = useEnvironments();
  const existing = id ? getById(id) : null;
  const isEditing = !!existing;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [form, setForm] = useState({
    code: existing?.code ?? '',
    name: existing?.name ?? '',
    type: (existing?.type ?? '') as EnvironmentType | '',
    capacity: existing?.capacity?.toString() ?? '',
    status: existing?.status ?? 'active' as EnvironmentStatus,
    location: existing?.location ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Requerido';
    if (!form.name.trim()) e.name = 'Requerido';
    if (!form.type) e.type = 'Selecciona un tipo';
    if (!form.capacity || parseInt(form.capacity, 10) < 1) e.capacity = 'Mínimo 1';
    if (!form.location.trim()) e.location = 'Requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (isEditing) {
      update(id!, form);
    } else {
      register(form);
    }
    Alert.alert('✓', isEditing ? 'Ambiente actualizado' : 'Ambiente registrado', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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

        {/* Code */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.code')}</Text>
        <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.code ? Colors.error : inputBorder, color: text }] as any}
          value={form.code} onChangeText={v => { setForm(p => ({ ...p, code: v })); setErrors(p => ({ ...p, code: '' })); }}
          placeholder="AMB-000" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
        {errors.code ? <Text style={ers.error}>{errors.code}</Text> : null}

        {/* Name */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.name')}</Text>
        <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.name ? Colors.error : inputBorder, color: text }] as any}
          value={form.name} onChangeText={v => { setForm(p => ({ ...p, name: v })); setErrors(p => ({ ...p, name: '' })); }}
          placeholder="Nombre del ambiente" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
        {errors.name ? <Text style={ers.error}>{errors.name}</Text> : null}

        {/* Type */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.type')}</Text>
        <View style={ers.typeGrid}>
          {TYPES.map(({ value, icon }) => (
            <TouchableOpacity
              key={value}
              onPress={() => { setForm(p => ({ ...p, type: value })); setErrors(p => ({ ...p, type: '' })); }}
              style={[ers.typeCard, {
                backgroundColor: form.type === value ? theme.primary + '20' : inputBg,
                borderColor: form.type === value ? theme.primary : inputBorder,
              }]}
              activeOpacity={0.7}
            >
              <Ionicons name={icon as any} size={22} color={form.type === value ? theme.primary : muted} />
              <Text style={[ers.typeLabel, { color: form.type === value ? theme.primary : text }]}>
                {t(`environments.types.${value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.type ? <Text style={ers.error}>{errors.type}</Text> : null}

        {/* Capacity */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.capacity')}</Text>
        <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.capacity ? Colors.error : inputBorder, color: text }] as any}
          value={form.capacity} onChangeText={v => { setForm(p => ({ ...p, capacity: v.replace(/\D/g, '') })); setErrors(p => ({ ...p, capacity: '' })); }}
          placeholder="30" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} keyboardType="numeric" />
        {errors.capacity ? <Text style={ers.error}>{errors.capacity}</Text> : null}

        {/* Status */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.status')}</Text>
        <View style={ers.statusRow}>
          {STATUSES.map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setForm(p => ({ ...p, status: s }))}
              style={[ers.statusBtn, {
                backgroundColor: form.status === s ? theme.primary + '25' : inputBg,
                borderColor: form.status === s ? theme.primary : inputBorder,
              }]}
              activeOpacity={0.7}
            >
              <Text style={[ers.statusText, { color: form.status === s ? theme.primary : muted }]}>
                {t(`environments.statuses.${s}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text style={[ers.label, { color: text }]}>{t('environments.fields.location')}</Text>
        <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.location ? Colors.error : inputBorder, color: text }] as any}
          value={form.location} onChangeText={v => { setForm(p => ({ ...p, location: v })); setErrors(p => ({ ...p, location: '' })); }}
          placeholder="Edificio - Piso" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
        {errors.location ? <Text style={ers.error}>{errors.location}</Text> : null}

        {/* Save */}
        <TouchableOpacity onPress={handleSave} style={[ers.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Text style={ers.saveBtnText}>{isEditing ? t('common.save') : t('environments.register')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: {
    width: '30%', flex: 1, minWidth: 90,
    borderRadius: 12, borderWidth: 1.2, padding: 12,
    alignItems: 'center', gap: 6,
  },
  typeLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: {
    flex: 1, borderRadius: 10, borderWidth: 1.2,
    paddingVertical: 10, alignItems: 'center',
  },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  saveBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
