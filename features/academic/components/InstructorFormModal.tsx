// ─────────────────────────────────────────────
//  features/academic/components/InstructorFormModal.tsx
//  Formulario de Instructor (crear / editar) — Prompt maestro, sección
//  3: todo instructor se clasifica como ESPECÍFICO (asociado a un Área)
//  o TRANSVERSAL (asociado a una o varias Transversales). Ambos casos
//  son mutuamente excluyentes en la interfaz.
// ─────────────────────────────────────────────
import FormModal from '@/shared/components/ui/FormModal';
import { useAreas } from '@/features/academic/areas/useAreas';
import { useTransversals } from '@/features/academic/transversals/useTransversals';
import { useInstructors } from '@/features/academic/instructors/useInstructors';
import { InstructorType } from '@/features/academic/instructors/types';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { MultiSelectField, SelectField } from '@/shared/components/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface InstructorFormModalProps {
  visible: boolean;
  onClose: () => void;
  editId?: string;
}

export default function InstructorFormModal({ visible, onClose, editId }: InstructorFormModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { getInstructor, addInstructor, updateInstructor } = useInstructors();
  const { activeAreas } = useAreas();
  const { activeTransversals } = useTransversals();
  const existing = editId ? getInstructor(editId) : null;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';

  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<InstructorType>('ESPECIFICO');
  const [areaId, setAreaId] = useState('');
  const [transversalIds, setTransversalIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(existing?.name ?? '');
    setLastname(existing?.lastname ?? '');
    setDocument(existing?.document ?? '');
    setEmail(existing?.email ?? '');
    setType(existing?.type ?? 'ESPECIFICO');
    setAreaId(existing?.areaId ?? '');
    setTransversalIds(existing?.transversalIds ?? []);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editId]);

  const areaOptions = activeAreas.map(a => ({ value: a.id, label: a.name }));
  const transversalOptions = activeTransversals.map(tr => ({ value: tr.id, label: tr.name }));

  const toggleTransversal = (id: string) => {
    setTransversalIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const handleSave = () => {
    const input = {
      name, lastname, document, email: email || undefined, type,
      areaId: type === 'ESPECIFICO' ? areaId : undefined,
      transversalIds: type === 'TRANSVERSAL' ? transversalIds : undefined,
    };
    const result = existing ? updateInstructor(existing.id, input) : addInstructor(input);
    if (!result.success) { setError(t(result.error)); return; }
    onClose();
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={existing ? t('academic.instructors.edit') : t('academic.instructors.register')}
      subtitle={t(existing ? 'academic.instructors.editSubtitle' : 'academic.instructors.registerSubtitle')}
      footer={
        <>
          <TouchableOpacity onPress={onClose} style={[ifm.footerBtn, { borderColor: inputBorder }]} activeOpacity={0.7}>
            <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[ifm.footerBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>
          </TouchableOpacity>
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          style={[ifm.input, { flex: 1, backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
          value={name} onChangeText={setName}
          placeholder={t('academic.instructors.namePlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        />
        <TextInput
          style={[ifm.input, { flex: 1, backgroundColor: inputBg, borderColor: inputBorder, color: text }] as any}
          value={lastname} onChangeText={setLastname}
          placeholder={t('academic.instructors.lastnamePlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        />
      </View>

      <TextInput
        style={[ifm.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text, marginTop: 14 }] as any}
        value={document} onChangeText={setDocument} keyboardType="numeric"
        placeholder={t('academic.instructors.documentPlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />

      <TextInput
        style={[ifm.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text, marginTop: 14 }] as any}
        value={email} onChangeText={setEmail} keyboardType="email-address"
        placeholder={t('academic.instructors.emailPlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
      />

      {error ? <Text style={ifm.error}>{error}</Text> : null}

      <Text style={[ifm.label, { color: text, marginTop: 16 }]}>{t('academic.instructors.fields.type')}</Text>
      <View style={ifm.statusRow}>
        {(['ESPECIFICO', 'TRANSVERSAL'] as const).map(ty => (
          <TouchableOpacity
            key={ty}
            onPress={() => setType(ty)}
            style={[ifm.statusBtn, { backgroundColor: type === ty ? theme.primary + '25' : inputBg, borderColor: type === ty ? theme.primary : inputBorder }]}
            activeOpacity={0.7}
          >
            <Text style={{ color: type === ty ? theme.primary : isDark ? '#5A7258' : '#AAAAAA', fontWeight: '700', fontSize: 14 }}>{t(`academic.instructors.types.${ty}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'ESPECIFICO' ? (
        <SelectField
          label={t('academic.fields.area')}
          value={areaId}
          options={areaOptions}
          onSelect={setAreaId}
          placeholder={t('academic.instructors.selectArea')}
          containerStyle={{ marginTop: 16 }}
        />
      ) : (
        <MultiSelectField
          label={t('academic.instructors.selectTransversals')}
          values={transversalIds}
          options={transversalOptions}
          onToggle={toggleTransversal}
          emptyText={t('academic.instructors.noTransversals')}
          containerStyle={{ marginTop: 16 }}
        />
      )}
    </FormModal>
  );
}

const ifm = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 8 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, borderRadius: 10, borderWidth: 1.2, paddingVertical: 10, alignItems: 'center' },
  footerBtn: { flex: 1, borderRadius: 12, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center' },
});
