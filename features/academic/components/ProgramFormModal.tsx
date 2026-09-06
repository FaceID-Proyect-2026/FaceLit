// ─────────────────────────────────────────────
//  features/academic/components/ProgramFormModal.tsx
//  Formulario de Programa (crear / editar) dentro de un modal,
//  en vez de una pantalla completa. Misma lógica que antes vivía
//  en app/admin/academic/programs/register.tsx.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ProgramFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
}

export default function ProgramFormModal({ visible, onClose, editId }: ProgramFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { getProgram, addProgram, updateProgram } = useAcademic();
  const existing = editId ? getProgram(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');

  // Cada vez que el modal se abre (o cambia a qué programa apunta),
  // recarga los valores desde el registro actual.
  useEffect(() => {
    if (!visible) return;
    setName(existing?.name ?? '');
    setStatus(existing?.status ?? 'active');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const handleSave = () => {
    if (!name.trim()) { setError(t('academic.required', 'Requerido')); return; }
    if (existing) {
      updateProgram(existing.id, name, status);
    } else if (!addProgram(name)) {
      setError(t('academic.duplicateProgram'));
      return;
    }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={existing ? t('academic.programEdit') : t('academic.programRegister')}
      subtitle={t(existing ? 'academic.programEditSubtitle' : 'academic.programRegisterSubtitle')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[pfm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[pfm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[pfm.label, { color: text }]}>{t('academic.fields.programName')}</Text>
      <TextInput
        style={[pfm.input, { backgroundColor: inputBg, borderColor: error ? Colors.error : inputBorder, color: text }] as any}
        value={name}
        onChangeText={v => { setName(v); setError(''); }}
        placeholder="Nombre del programa"
        placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />
      {error ? <Text style={pfm.error}>{error}</Text> : null}

      <Text style={[pfm.label, { color: text, marginTop: 16 }]}>{t('academic.fields.status')}</Text>
      <View style={pfm.statusRow}>
        {(['active', 'inactive'] as const).map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatus(s)}
            style={[pfm.statusBtn, { backgroundColor: status === s ? theme.primary + '25' : inputBg, borderColor: status === s ? theme.primary : inputBorder }]}
            activeOpacity={0.7}
          >
            <Text style={{ color: status === s ? theme.primary : isDark ? '#5A7258' : '#AAAAAA', fontWeight: '700', fontSize: 14 }}>{t(`environments.statuses.${s}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </FormModal>
  );
}

const pfm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, borderRadius: 10, borderWidth: 1.2, paddingVertical: 10, alignItems: 'center' },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
