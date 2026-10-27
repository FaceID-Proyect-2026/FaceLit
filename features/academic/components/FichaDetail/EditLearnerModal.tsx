import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { elm } from '@/features/academic/components/FichaDetailStyles';
import { EditLearnerModalProps } from '@/features/academic/components/FichaDetailSupport';

export function EditLearnerModal({
  visible, fichaId, learnerId,
  initialName, initialLastname, initialEmail, initialDocument,
  onClose, onSave,
}: EditLearnerModalProps) {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [name, setName]         = useState(initialName);
  const [lastname, setLastname] = useState(initialLastname);
  const [email, setEmail]       = useState(initialEmail);
  const [document, setDoc]      = useState(initialDocument);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setLastname(initialLastname);
      setEmail(initialEmail);
      setDoc(initialDocument);
      setError('');
      setSaving(false);
    }
  }, [visible, initialName, initialLastname, initialEmail, initialDocument]);

  const text      = isDark ? Colors.dark.text       : Colors.light.text;
  const muted     = isDark ? Colors.dark.textMuted   : Colors.light.textMuted;
  const inputBg   = isDark ? 'rgba(255,255,255,0.05)' : Colors.light.inputBg;
  const inputBorder = isDark ? 'rgba(255,255,255,0.25)' : '#BBBBBB';
  const modalBg   = theme.surface;
  const overlayBg = 'rgba(0,0,0,0.55)';

  const handleSave = async () => {
    if (!name.trim() || !lastname.trim()) { setError(t('academic.assignValidationName')); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t('academic.assignValidationEmail')); return; }
    if (!document.trim() || !/^\d{6,15}$/.test(document.trim())) { setError(t('academic.assignValidationDoc')); return; }

    setSaving(true);
    setError('');
    try {
      const result = await onSave({ name: name.trim(), lastname: lastname.trim(), email: email.trim(), document: document.trim() });
      if (!result.success) {
        setError(result.error ? t(result.error as any, { defaultValue: result.error }) : t('academic.assignError'));
        return;
      }
      onClose();
    } catch (saveError: any) {
      const message = saveError?.response?.data?.message ?? saveError?.message ?? t('academic.assignError');
      setError(t(message, { defaultValue: message }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[elm.overlay, { backgroundColor: overlayBg }]}>
        <View style={[elm.sheet, { backgroundColor: modalBg }]}>
          <View style={elm.modalHeader}>
            <Text style={[elm.modalTitle, { color: text }]}>{t('academic.editLearnerTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { label: t('academic.assignNameLabel'), value: name, onChange: setName, keyboard: 'default' as const },
              { label: t('academic.assignLastNameLabel'), value: lastname, onChange: setLastname, keyboard: 'default' as const },
              { label: t('academic.assignEmailLabel'), value: email, onChange: setEmail, keyboard: 'email-address' as const },
              { label: t('academic.assignDocLabel'), value: document, onChange: setDoc, keyboard: 'numeric' as const },
            ].map(f => (
              <View key={f.label} style={{ marginBottom: 14 }}>
                <Text style={[elm.label, { color: text }]}>{f.label}</Text>
                <TextInput
                  style={[elm.input, { backgroundColor: inputBg, borderColor: inputBorder, color: text } as any]}
                  value={f.value}
                  onChangeText={v => { f.onChange(v); setError(''); }}
                  keyboardType={f.keyboard}
                  maxLength={f.keyboard === 'numeric' ? 15 : 80}
                  placeholderTextColor={muted}
                  autoCapitalize={f.keyboard === 'default' ? 'words' : 'none'}
                />
              </View>
            ))}
            {error ? <Text style={elm.errorText}>{error}</Text> : null}
          </ScrollView>

          <View style={elm.footer}>
            <TouchableOpacity onPress={onClose} style={[elm.btn, { borderColor: inputBorder, borderWidth: 1.2 }]} activeOpacity={0.7}>
              <Text style={{ color: text, fontWeight: '700' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[elm.btn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]} activeOpacity={0.85}>
              {saving
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={{ color: Colors.white, fontWeight: '700' }}>{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
