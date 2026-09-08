// ─────────────────────────────────────────────
//  features/academic/components/TransversalFormModal.tsx
//  Formulario de Transversal (crear / editar) — Prompt maestro, sección
//  4: una transversal es independiente del programa y puede asociarse
//  a varios programas a la vez (N:N), sin duplicarse por cada uno.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { useAcademic } from '@/features/academic/useAcademic';
import { useTransversals } from '@/features/academic/transversals/useTransversals';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { MultiSelectField } from '@/shared/components/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TransversalFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
}

export default function TransversalFormModal({ visible, onClose, editId }: TransversalFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { getTransversal, addTransversal, updateTransversal } = useTransversals();
  const { programs } = useAcademic();
  const existing = editId ? getTransversal(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(existing?.name ?? '');
    setStatus(existing?.status ?? 'active');
    setProgramIds(existing?.programIds ?? []);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const activePrograms = programs.filter(p => p.status === 'active');
  const programOptions = activePrograms.map(p => ({ value: p.id, label: p.name }));

  const toggleProgram = (id: string) => {
    setProgramIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const handleSave = () => {
    if (!name.trim()) { setError(t('academic.required', 'Requerido')); return; }
    const result = existing
      ? updateTransversal(existing.id, name, status, programIds)
      : addTransversal(name, programIds);
    if (!result.success) { setError(t(result.error)); return; }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={existing ? t('academic.transversals.edit') : t('academic.transversals.register')}
      subtitle={t(existing ? 'academic.transversals.editSubtitle' : 'academic.transversals.registerSubtitle')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[tfm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[tfm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[tfm.label, { color: text }]}>{t('academic.transversals.fields.name')}</Text>
      <TextInput
        style={[tfm.input, { backgroundColor: inputBg, borderColor: error ? Colors.error : inputBorder, color: text }] as any}
        value={name}
        onChangeText={v => { setName(v); setError(''); }}
        placeholder={t('academic.transversals.namePlaceholder')}
        placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />
      {error ? <Text style={tfm.error}>{error}</Text> : null}

      <MultiSelectField
        label={t('academic.transversals.fields.programs')}
        values={programIds}
        options={programOptions}
        onToggle={toggleProgram}
        emptyText={t('academic.transversals.noPrograms')}
        containerStyle={{ marginTop: 16 }}
      />

      <Text style={[tfm.label, { color: text, marginTop: 4 }]}>{t('academic.fields.status')}</Text>
      <View style={tfm.statusRow}>
        {(['active', 'inactive'] as const).map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[tfm.statusBtn, { backgroundColor: status === s ? theme.primary + '25' : inputBg, borderColor: status === s ? theme.primary : inputBorder }]}
            activeOpacity={0.7}
          >
            <Text style={{ color: status === s ? theme.primary : isDark ? '#5A7258' : '#AAAAAA', fontWeight: '700', fontSize: 14 }}>{t(`environments.statuses.${s}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </FormModal>
  );
}

const tfm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, borderRadius: 10, borderWidth: 1.2, paddingVertical: 10, alignItems: 'center' },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
