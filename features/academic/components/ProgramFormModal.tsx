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
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ name?: string; code?: string; form?: string }>({});

  // Cada vez que el modal se abre (o cambia a qué programa apunta),
  // recarga los valores desde el registro actual.
  useEffect(() => {
    if (!visible) return;
    setName(existing?.name ?? '');
    setCode(existing?.code ?? '');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const handleSave = async () => {
    const nextErrors: typeof errors = {};
    const normalizedName = name.trim();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedName) nextErrors.name = 'El nombre del programa es obligatorio.';
    else if (normalizedName.length > 100) nextErrors.name = 'El nombre no puede superar los 100 caracteres.';
    if (!normalizedCode) nextErrors.code = 'El código de programa es obligatorio.';
    else if (!/^[A-Z0-9]{2,15}$/.test(normalizedCode)) nextErrors.code = 'El código debe tener entre 2 y 15 caracteres alfanuméricos.';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    try {
      if (existing) await updateProgram(existing.id, normalizedName, normalizedCode);
      else await addProgram(normalizedName, normalizedCode);
      onClose();
    } catch (error: any) {
      setErrors({ form: error?.response?.data?.message ?? t('academic.duplicateProgram') });
    }
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
        style={[pfm.input, { backgroundColor: inputBg, borderColor: errors.name || errors.form ? Colors.error : inputBorder, color: text }] as any}
        value={name}
        onChangeText={v => { setName(v); setErrors(previous => ({ ...previous, name: undefined, form: undefined })); }}
        placeholder="Nombre del programa"
        placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />
      {errors.name ? <Text style={pfm.error}>{errors.name}</Text> : null}

      <Text style={[pfm.label, { color: text, marginTop: 16 }]}>Código del programa</Text>
      <TextInput
        style={[pfm.input, { backgroundColor: inputBg, borderColor: errors.code || errors.form ? Colors.error : inputBorder, color: text }] as any}
        value={code}
        onChangeText={v => { setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '')); setErrors(previous => ({ ...previous, code: undefined, form: undefined })); }}
        placeholder="ADSO"
        placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        autoCapitalize="characters"
      />

      {errors.code ? <Text style={pfm.error}>{errors.code}</Text> : null}
      {errors.form ? <Text style={pfm.error}>{errors.form}</Text> : null}
    </FormModal>
  );
}

const pfm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
