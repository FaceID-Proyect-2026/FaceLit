// ─────────────────────────────────────────────
//  features/academic/components/FichaFormModal.tsx
//  Formulario de Ficha (crear / editar) dentro de un modal, en vez
//  de una pantalla completa. Misma lógica que antes vivía en
//  app/admin/academic/fichas/register.tsx.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { getProgramDisplayName, JornadaType } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const JORNADAS: { value: JornadaType; icon: string }[] = [
  { value: 'morning', icon: 'sunny-outline' },
  { value: 'afternoon', icon: 'partly-sunny-outline' },
  { value: 'night', icon: 'moon-outline' },
  { value: 'full', icon: 'time-outline' },
];

interface FichaFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
  defaultProgramId?: string;
}

export default function FichaFormModal({ visible, onClose, editId, defaultProgramId }: FichaFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { programs, getFicha, addFicha, updateFicha } = useAcademic();
  const existing = editId ? getFicha(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const activePrograms = useMemo(() => programs.filter(p => p.status === 'active'), [programs]);

  const [number, setNumber] = useState('');
  const [jornada, setJornada] = useState<JornadaType>('morning');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    setNumber(existing?.number ?? '');
    setJornada(existing?.jornada ?? 'morning');
    setSelectedProgram(existing?.programId ?? defaultProgramId ?? '');
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!number.trim()) e.number = t('academic.required', 'Requerido');
    if (!selectedProgram) e.program = t('academic.selectProgram', 'Selecciona un programa');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (existing) {
      const result = updateFicha(existing.id, { number, jornada, programId: selectedProgram });
      if (!result.success) { setErrors({ number: result.error ? t(result.error) : t('academic.fichaSaveError') }); return; }
    } else if (!addFicha(number, jornada, selectedProgram)) {
      setErrors({ number: t('academic.duplicateFicha') });
      return;
    }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={existing ? t('academic.fichaEdit') : t('academic.fichaRegister')}
      subtitle={t(existing ? 'academic.fichaEditSubtitle' : 'academic.fichaRegisterSubtitle')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[ffm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[ffm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <Text style={[ffm.label, { color: text }]}>{t('academic.fields.fichaNumber')}</Text>
      <TextInput
        style={[ffm.input, { backgroundColor: inputBg, borderColor: errors.number ? Colors.error : inputBorder, color: text }] as any}
        value={number}
        onChangeText={v => { setNumber(v.replace(/\D/g, '')); setErrors(p => ({ ...p, number: '' })); }}
        placeholder="3145555" placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} keyboardType="numeric" maxLength={10}
      />
      {errors.number ? <Text style={ffm.error}>{errors.number}</Text> : null}

      <Text style={[ffm.label, { color: text, marginTop: 12 }]}>{t('academic.fields.jornada')}</Text>
      <View style={ffm.jornadaGrid}>
        {JORNADAS.map(({ value, icon }) => (
          <TouchableOpacity key={value} onPress={() => setJornada(value)}
            style={[ffm.jornadaCard, { backgroundColor: jornada === value ? theme.primary + '20' : inputBg, borderColor: jornada === value ? theme.primary : inputBorder }]} activeOpacity={0.7}>
            <Ionicons name={icon as any} size={22} color={jornada === value ? theme.primary : muted} />
            <Text style={[ffm.jornadaLabel, { color: jornada === value ? theme.primary : text }]}>{t(`academic.jornadas.${value}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[ffm.label, { color: text, marginTop: 12 }]}>{t('academic.fields.programName')}</Text>
      <View style={ffm.programList}>
        {activePrograms.map(p => (
          <TouchableOpacity key={p.id} onPress={() => { setSelectedProgram(p.id); setErrors(prev => ({ ...prev, program: '' })); }}
            style={[ffm.programCard, { backgroundColor: selectedProgram === p.id ? theme.primary + '15' : inputBg, borderColor: selectedProgram === p.id ? theme.primary : inputBorder }]} activeOpacity={0.7}>
            <Ionicons name={selectedProgram === p.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedProgram === p.id ? theme.primary : muted} />
            <Text style={[ffm.programName, { color: text }]}>{getProgramDisplayName(p, t)}</Text>
          </TouchableOpacity>
        ))}
        {activePrograms.length === 0 && <Text style={{ color: muted, textAlign: 'center', padding: 12 }}>{t('academic.noActivePrograms')}</Text>}
      </View>
      {errors.program ? <Text style={ffm.error}>{errors.program}</Text> : null}
    </FormModal>
  );
}

const ffm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  jornadaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  jornadaCard: { flex: 1, minWidth: 80, borderRadius: 12, borderWidth: 1.2, padding: 12, alignItems: 'center', gap: 6 },
  jornadaLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textAlign: 'center' },
  programList: { gap: 8 },
  programCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, borderWidth: 1.2, padding: 12 },
  programName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
