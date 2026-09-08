// ─────────────────────────────────────────────
//  features/academic/components/PeriodFormModal.tsx
//  Formulario de Período académico (crear / editar) — Prompt maestro,
//  sección 7. El nombre se autogenera a partir de tipo+número+año pero
//  puede editarse manualmente.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { useAcademicPeriods } from '@/features/academic/periods/useAcademicPeriods';
import { buildPeriodName, PERIOD_TYPES, PeriodType } from '@/features/academic/periods/types';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { DateField, SelectField } from '@/shared/components/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PeriodFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
}

export default function PeriodFormModal({ visible, onClose, editId }: PeriodFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { getPeriod, addPeriod, updatePeriod } = useAcademicPeriods();
  const existing = editId ? getPeriod(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [type, setType] = useState<PeriodType>('TRIMESTRE');
  const [number, setNumber] = useState('1');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const typeLabels: Record<PeriodType, string> = {
    TRIMESTRE: t('academic.periods.types.TRIMESTRE'),
    BIMESTRE: t('academic.periods.types.BIMESTRE'),
    SEMESTRE: t('academic.periods.types.SEMESTRE'),
    CUATRIMESTRE: t('academic.periods.types.CUATRIMESTRE'),
    OTRO: t('academic.periods.types.OTRO'),
  };

  useEffect(() => {
    if (!visible) return;
    setType(existing?.type ?? 'TRIMESTRE');
    setNumber(String(existing?.number ?? 1));
    setYear(String(existing?.year ?? new Date().getFullYear()));
    setName(existing?.name ?? '');
    setNameEdited(!!existing);
    setStartDate(existing?.startDate ?? '');
    setEndDate(existing?.endDate ?? '');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  // Autogenera el nombre mientras el usuario no lo haya editado a mano.
  useEffect(() => {
    if (nameEdited) return;
    const n = parseInt(number, 10) || 0;
    const y = parseInt(year, 10) || 0;
    setName(buildPeriodName(type, n, y, typeLabels));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, number, year, nameEdited]);

  const typeOptions = PERIOD_TYPES.map(pt => ({ value: pt, label: typeLabels[pt] }));

  const handleSave = () => {
    const input = {
      name,
      type,
      number: parseInt(number, 10) || 0,
      year: parseInt(year, 10) || 0,
      startDate,
      endDate,
    };
    const result = existing ? updatePeriod(existing.id, input) : addPeriod(input);
    if (!result.success) { setError(t(result.error)); return; }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={existing ? t('academic.periods.edit') : t('academic.periods.register')}
      subtitle={t(existing ? 'academic.periods.editSubtitle' : 'academic.periods.registerSubtitle')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[pdm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[pdm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <SelectField label={t('academic.periods.fields.type')} value={type} options={typeOptions} onSelect={v => setType(v as PeriodType)} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          style={[pdm.input, { flex: 1, backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
          value={number} onChangeText={setNumber} keyboardType="numeric"
          placeholder={t('academic.periods.fields.number')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        />
        <TextInput
          style={[pdm.input, { flex: 1, backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
          value={year} onChangeText={setYear} keyboardType="numeric"
          placeholder={t('academic.periods.fields.year')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        />
      </View>

      <Text style={[pdm.label, { color: text, marginTop: 14 }]}>{t('academic.periods.fields.name')}</Text>
      <TextInput
        style={[pdm.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
        value={name} onChangeText={v => { setName(v); setNameEdited(true); }}
        placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <DateField label={t('academic.periods.fields.startDate')} value={startDate} onChange={setStartDate} containerStyle={{ flex: 1 }} />
        <DateField label={t('academic.periods.fields.endDate')} value={endDate} onChange={setEndDate} minDate={startDate} containerStyle={{ flex: 1 }} />
      </View>

      {error ? <Text style={pdm.error}>{error}</Text> : null}
    </FormModal>
  );
}

const pdm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none', marginBottom: 14 } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: -6, marginBottom: 8 },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
