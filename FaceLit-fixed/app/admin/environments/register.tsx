// ─────────────────────────────────────────────
//  app/admin/environments/register.tsx
//  Formulario de registro/edición de ambiente
// ─────────────────────────────────────────────
import { ENVIRONMENT_NAME_REGEX, EnvironmentStatus, MAX_ENVIRONMENT_QUANTITY } from '@/features/environments/types';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function EnvironmentRegisterScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const { getById, register, update } = useEnvironments();
  const { alert, DialogUI } = useAppDialog();
  const existing = id ? getById(id) : null;
  const isEditing = !!existing;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const panelBg = isDark ? '#0D1F14' : Colors.white;
  const panelBorder = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';

  const [form, setForm] = useState({
    code: existing?.code ?? '',
  });
  const [quantity, setQuantity] = useState(existing?.quantity != null ? String(existing.quantity) : '');
  const [status, setStatus] = useState<EnvironmentStatus>(existing?.status ?? 'active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const value = form.code.trim();
    if (!value) e.code = t('environments.fields.codeRequired');
    else if (!ENVIRONMENT_NAME_REGEX.test(value)) e.code = t('environments.fields.nameInvalid');

    const quantityTrimmed = quantity.trim();
    if (!quantityTrimmed) {
      e.quantity = t('environments.fields.quantityRequired');
    } else if (Number(quantityTrimmed) < 1) {
      e.quantity = t('environments.fields.quantityMin', { min: 1 });
    } else if (Number(quantityTrimmed) > MAX_ENVIRONMENT_QUANTITY) {
      e.quantity = t('environments.fields.quantityMax', { max: MAX_ENVIRONMENT_QUANTITY });
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const quantityValue = Number(quantity.trim());
    if (isEditing) {
      update(id!, { ...form, status, quantity: quantityValue });
      alert('✓', t('environments.updateSuccess'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } else {
      const newEnv = register({ ...form, status: 'active', quantity: quantityValue });
      alert('✓', t('environments.registerSuccess'), [
        {
          text: t('common.ok'),
          // Lleva al usuario directo al ambiente ya registrado/asignado
          onPress: () => router.replace(`/admin/environments/${newEnv.id}` as any),
        },
      ]);
    }
  };

  return (
    <View style={[ers.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ers.scroll} showsVerticalScrollIndicator={false}>
        <View style={[ers.content, { maxWidth: width >= 1200 ? 1040 : width >= 768 ? 860 : 520 }]}>
          <TouchableOpacity onPress={() => router.back()} style={ers.backBtn}>
            <Ionicons name="arrow-back" size={20} color={text} />
            <Text style={[ers.backText, { color: text }]}>{t('common.back')}</Text>
          </TouchableOpacity>

          <View style={ers.heading}>
            <View style={[ers.headingIcon, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '55' }]}>
              <Ionicons name="business-outline" size={26} color={theme.primary} />
            </View>
            <View style={ers.headingCopy}>
              <Text style={[ers.title, { color: text }]}>
                {isEditing ? t('environments.edit') : t('environments.register')}
              </Text>
              <Text style={[ers.subtitle, { color: muted }]}>{t(isEditing ? 'environments.editSubtitle' : 'environments.registerSubtitle', isEditing ? 'Corrige la información del ambiente: nombre, cantidad o estado.' : 'Crea un nuevo espacio físico para asignarlo a fichas y horarios.')}</Text>
            </View>
          </View>

          <View style={[ers.panel, { backgroundColor: panelBg, borderColor: panelBorder }]}>
            <Text style={[ers.sectionTitle, { color: text }]}>{t('environments.fields.name')}</Text>
            <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.code ? Colors.error : inputBorder, color: text }] as any}
              value={form.code} onChangeText={v => { setForm({ code: v }); setErrors(p => ({ ...p, code: '' })); }}
              placeholder={t('environments.fields.namePlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
            {errors.code ? <Text style={ers.error}>{errors.code}</Text> : null}

            <Text style={[ers.sectionTitle, { color: text, marginTop: 18 }]}>{t('environments.fields.quantity')}</Text>
            <Text style={[ers.helpText, { color: muted }]}>{t('environments.fields.quantityHelp', 'Número máximo de aprendices que puede albergar este ambiente.')}</Text>
            <TextInput style={[ers.input, { backgroundColor: inputBg, borderColor: errors.quantity ? Colors.error : inputBorder, color: text }] as any}
              value={quantity} onChangeText={v => { setQuantity(v.replace(/\D/g, '')); setErrors(p => ({ ...p, quantity: '' })); }}
              placeholder="0" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} keyboardType="numeric" />
            {errors.quantity ? <Text style={ers.error}>{errors.quantity}</Text> : null}

            {isEditing && <>
              <Text style={[ers.sectionTitle, { color: text, marginTop: 18 }]}>{t('environments.fields.status')}</Text>
              <View style={ers.statusRow}>
              {(['active', 'inactive'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[ers.statusBtn, { backgroundColor: status === s ? theme.primary + '25' : inputBg, borderColor: status === s ? theme.primary : inputBorder }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name={s === 'active' ? 'checkmark-circle-outline' : 'pause-circle-outline'} size={18} color={status === s ? theme.primary : muted} />
                  <Text style={{ color: status === s ? theme.primary : muted, fontWeight: '700', fontSize: 14 }}>
                    {t(`environments.statuses.${s}`)}
                  </Text>
                </TouchableOpacity>
              ))}
              </View>
            </>}
          </View>

          <View style={ers.actions}>
            <TouchableOpacity onPress={() => router.back()} style={[ers.cancelBtn, { borderColor: inputBorder }]} activeOpacity={0.8}>
              <Text style={[ers.cancelBtnText, { color: muted }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[ers.saveBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
              <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
              <Text style={ers.saveBtnText}>{isEditing ? t('common.save') : t('environments.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {DialogUI}
    </View>
  );
}

const ers = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  content: { width: '100%' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headingIcon: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },
  panel: { borderRadius: 16, borderWidth: 1, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 7 },
  helpText: { fontSize: FontSize.xs, lineHeight: 17, marginTop: -2, marginBottom: 7 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 7, borderRadius: 10, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { minWidth: 112, borderRadius: 12, borderWidth: 1.2, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  saveBtn: { minWidth: 160, flexDirection: 'row', justifyContent: 'center', gap: 7, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
