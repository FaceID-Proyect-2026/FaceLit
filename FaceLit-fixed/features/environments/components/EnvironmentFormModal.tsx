// ─────────────────────────────────────────────
//  features/environments/components/EnvironmentFormModal.tsx
//  Formulario de Ambiente (crear / editar) dentro de un modal, en
//  vez de una pantalla completa. Misma lógica que antes vivía en
//  app/admin/environments/register.tsx.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { ENVIRONMENT_NAME_REGEX, EnvironmentStatus, MAX_ENVIRONMENT_QUANTITY } from '@/features/environments/types';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface EnvironmentFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
}

export default function EnvironmentFormModal({ visible, onClose, editId }: EnvironmentFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { getById, register, update } = useEnvironments();
  const existing = editId ? getById(editId) : null;
  const isEditing = !!existing;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState<EnvironmentStatus>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setCode(existing?.code ?? '');
    setQuantity(existing?.quantity != null ? String(existing.quantity) : '');
    setStatus(existing?.status ?? 'active');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const validate = () => {
    const e: Record<string, string> = {};
    const value = code.trim();
    if (!value) e.code = t('environments.fields.codeRequired');
    else if (!ENVIRONMENT_NAME_REGEX.test(value)) e.code = t('environments.fields.nameInvalid');

    const quantityTrimmed = quantity.trim();
    if (!quantityTrimmed) e.quantity = t('environments.fields.quantityRequired');
    else if (Number(quantityTrimmed) < 1) e.quantity = t('environments.fields.quantityMin', { min: 1 });
    else if (Number(quantityTrimmed) > MAX_ENVIRONMENT_QUANTITY) e.quantity = t('environments.fields.quantityMax', { max: MAX_ENVIRONMENT_QUANTITY });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const quantityValue = Number(quantity.trim());
    if (existing) {
      update(existing.id, { code, status, quantity: quantityValue });
    } else {
      register({ code, status: 'active', quantity: quantityValue });
    }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={isEditing ? t('environments.edit') : t('environments.register')}
      subtitle={t(isEditing ? 'environments.editSubtitle' : 'environments.registerSubtitle', isEditing ? 'Corrige la información del ambiente: nombre, cantidad o estado.' : 'Crea un nuevo espacio físico para asignarlo a fichas y horarios.')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[efm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[efm.footerBtn, { backgroundColor: theme.primary, flexDirection: 'row', gap: 6 }]} activeOpacity={0.85}>
            <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[efm.label, { color: text }]}>{t('environments.fields.name')}</Text>
      <TextInput
        style={[efm.input, { backgroundColor: inputBg, borderColor: errors.code ? Colors.error : inputBorder, color: text }] as any}
        value={code}
        onChangeText={v => { setCode(v); setErrors(p => ({ ...p, code: '' })); }}
        placeholder={t('environments.fields.namePlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />
      {errors.code ? <Text style={efm.error}>{errors.code}</Text> : null}

      <Text style={[efm.label, { color: text, marginTop: 16 }]}>{t('environments.fields.quantity')}</Text>
      <Text style={[efm.helpText, { color: muted }]}>{t('environments.fields.quantityHelp', 'Número máximo de aprendices que puede albergar este ambiente.')}</Text>
      <TextInput
        style={[efm.input, { backgroundColor: inputBg, borderColor: errors.quantity ? Colors.error : inputBorder, color: text }] as any}
        value={quantity} onChangeText={v => { setQuantity(v.replace(/\D/g, '')); setErrors(p => ({ ...p, quantity: '' })); }}
        placeholder="0" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} keyboardType="numeric"
      />
      {errors.quantity ? <Text style={efm.error}>{errors.quantity}</Text> : null}

      {isEditing && (
        <>
          <Text style={[efm.label, { color: text, marginTop: 16 }]}>{t('environments.fields.status')}</Text>
          <View style={efm.statusRow}>
            {(['active', 'inactive'] as const).map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={[efm.statusBtn, { backgroundColor: status === s ? theme.primary + '25' : inputBg, borderColor: status === s ? theme.primary : inputBorder }]}
                activeOpacity={0.7}
              >
                <Ionicons name={s === 'active' ? 'checkmark-circle-outline' : 'pause-circle-outline'} size={18} color={status === s ? theme.primary : muted} />
                <Text style={{ color: status === s ? theme.primary : muted, fontWeight: '700', fontSize: 14 }}>{t(`environments.statuses.${s}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </FormModal>
  );
}

const efm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  helpText: { fontSize: FontSize.xs, lineHeight: 17, marginTop: -2, marginBottom: 7 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 7, borderRadius: 10, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
});
