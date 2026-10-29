import { createInstructor, updateInstructor } from '@/features/academic/academicApi';
import { refreshAcademicStoreFromBackend } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fm } from '@/features/academic/components/InstructorManagementStyles';
import { InstructorItem } from '@/features/academic/components/InstructorManagementSupport';

export function InstructorFormModal({
  visible,
  onClose,
  onSaved,
  editItem,
  programs,
  theme,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editItem?: InstructorItem | null;
  programs: { id: string; name: string; code: string }[];
  theme: any;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const latestEditItem = useRef(editItem);
  useEffect(() => { latestEditItem.current = editItem; }, [editItem]);
  const [document,  setDocument]  = useState('');
  const [name,      setName]      = useState('');
  const [lastname,  setLastname]  = useState('');
  const [email,     setEmail]     = useState('');
  const [type,      setType]      = useState<'ESPECIFICO' | 'TRANSVERSAL'>('TRANSVERSAL');
  const [selected,  setSelected]  = useState<string[]>([]);
  const [programQuery, setProgramQuery] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [pwdResult, setPwdResult] = useState('');
  const editing = Boolean(editItem);

  const text    = isDark ? Colors.dark.text      : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : Colors.light.inputBg;
  const inpBdr  = isDark ? 'rgba(255,255,255,0.20)' : '#CCCCCC';

  const reset = () => {
    setDocument(''); setName(''); setLastname(''); setEmail('');
    setType('TRANSVERSAL'); setSelected([]); setProgramQuery(''); setError(''); setPwdResult('');
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleProgram = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  useEffect(() => {
    // Reset on modal/identity changes while preserving a draft during background refreshes.
    const currentItem = latestEditItem.current;
    if (!visible) return;
    if (!currentItem) {
      reset();
      return;
    }
    setDocument(currentItem.document ?? '');
    setName(currentItem.firstName ?? '');
    setLastname(currentItem.lastName ?? '');
    setEmail(currentItem.email ?? '');
    setType(currentItem.instructorType ?? 'TRANSVERSAL');
    setSelected(currentItem.programIds ?? []);
    setProgramQuery('');
    setError('');
    setPwdResult('');
  }, [visible, editItem?.idInstructor]);

  const filteredPrograms = useMemo(() => {
    const q = programQuery.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  }, [programQuery, programs]);

  const handleSave = async () => {
    setError('');
    const cleanedDocument = document.replace(/\D/g, '').trim();
    if (!/^\d{6,15}$/.test(cleanedDocument))        { setError(t('academic.instructorValidationDoc')); return; }
    if (!name.trim())                                { setError(t('academic.instructorValidationName')); return; }
    if (!lastname.trim())                            { setError(t('academic.instructorValidationLastName')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(t('academic.instructorValidationEmail')); return; }
    if (type === 'ESPECIFICO' && selected.length === 0) { setError(t('academic.instructorValidationPrograms')); return; }

    setSaving(true);
    try {
      const payload = {
        document:       cleanedDocument,
        name:           name.trim(),
        lastname:       lastname.trim(),
        email:          email.trim(),
        instructorType: type,
        programIds:     type === 'ESPECIFICO' ? selected : [],
      };
      const result = editing && editItem
        ? await updateInstructor(editItem.idInstructor, payload)
        : await createInstructor(payload);
      // El backend puede devolver initialPassword en la respuesta
      const pwd = (result as any)?.initialPassword ?? (result as any)?.password ?? null;
      refreshAcademicStoreFromBackend().catch(() => undefined);
      if (!editing && pwd) {
        setPwdResult(pwd);
      } else {
        reset();
        onSaved();
        onClose();
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message ?? err?.response?.data?.error ?? '';
      const duplicateMessage = /correo|email/i.test(serverMessage)
        ? serverMessage
        : /document/i.test(serverMessage)
        ? t('academic.instructorDuplicateDoc')
        : serverMessage || t('academic.instructorCreateError');
      setError(duplicateMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={fm.overlay}>
        <View style={[fm.sheet, { backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface }]}>
          <View style={fm.header}>
            <Text style={[fm.title, { color: text }]}>{editing ? t('academic.instructorEdit') : t('academic.instructorRegister')}</Text>
            <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>

          {/* Contraseña generada — pantalla de éxito */}
          {pwdResult ? (
            <View style={fm.pwdBox}>
              <Ionicons name="key-outline" size={32} color={theme.primary} style={{ marginBottom: 10 }} />
              <Text style={[fm.pwdTitle, { color: text }]}>{t('academic.instructorCreatedTitle')}</Text>
              <Text style={[fm.pwdSub, { color: muted }]}>
                {t('academic.instructorCreatedSubtitle')}
              </Text>
              <View style={[fm.pwdCard, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '0D' }]}>
                <Text style={[fm.pwdValue, { color: theme.primary }]}>{pwdResult}</Text>
              </View>
              <Text style={[fm.pwdHint, { color: muted }]}>
                {t('academic.instructorDocNumber')}: <Text style={{ fontWeight: '800', color: text }}>{document}</Text>
              </Text>
              <TouchableOpacity
                style={[fm.pwdBtn, { backgroundColor: theme.primary }]}
                onPress={() => { reset(); onSaved(); onClose(); }}
                activeOpacity={0.85}
              >
                <Text style={{ color: Colors.white, fontWeight: FontWeight.bold }}>{t('academic.instructorUnderstood')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              {/* Documento */}
              <View style={fm.field}>
                <Text style={[fm.label, { color: text }]}>{t('academic.instructorDocLabel')}</Text>
                <TextInput
                  style={[fm.input, { color: text, backgroundColor: inputBg, borderColor: inpBdr }] as any}
                  value={document} onChangeText={v => { setDocument(v.replace(/\D/g, '').slice(0, 15)); setError(''); }}
                  placeholder={t('academic.instructorDocPlaceholder')} placeholderTextColor={muted}
                  keyboardType="numeric" maxLength={15}
                />
              </View>
              {/* Nombre */}
              <View style={fm.field}>
                <Text style={[fm.label, { color: text }]}>{t('academic.instructorNameLabel')}</Text>
                <TextInput
                  style={[fm.input, { color: text, backgroundColor: inputBg, borderColor: inpBdr }] as any}
                  value={name} onChangeText={v => { setName(v); setError(''); }}
                  placeholder={t('academic.instructorNamePlaceholder')} placeholderTextColor={muted} autoCapitalize="words"
                />
              </View>
              {/* Apellido */}
              <View style={fm.field}>
                <Text style={[fm.label, { color: text }]}>{t('academic.instructorLastNameLabel')}</Text>
                <TextInput
                  style={[fm.input, { color: text, backgroundColor: inputBg, borderColor: inpBdr }] as any}
                  value={lastname} onChangeText={v => { setLastname(v); setError(''); }}
                  placeholder={t('academic.instructorLastNamePlaceholder')} placeholderTextColor={muted} autoCapitalize="words"
                />
              </View>
              {/* Correo */}
              <View style={fm.field}>
                <Text style={[fm.label, { color: text }]}>{t('academic.instructorEmailLabel')}</Text>
                <TextInput
                  style={[fm.input, { color: text, backgroundColor: inputBg, borderColor: inpBdr }] as any}
                  value={email} onChangeText={v => { setEmail(v); setError(''); }}
                  placeholder={t('academic.instructorEmailPlaceholder')} placeholderTextColor={muted}
                  keyboardType="email-address" autoCapitalize="none"
                />
              </View>
              {/* Tipo */}
              <View style={fm.field}>
                <Text style={[fm.label, { color: text }]}>{t('academic.instructorTypeLabel')}</Text>
                <View style={fm.typeRow}>
                  {(['TRANSVERSAL', 'ESPECIFICO'] as const).map(opt => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        setType(opt);
                        if (opt === 'TRANSVERSAL') setSelected([]);
                        setError('');
                      }}
                      style={[fm.typeBtn, {
                        borderColor:       type === opt ? theme.primary : inpBdr,
                        backgroundColor:   type === opt ? theme.primary + '18' : inputBg,
                      }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={type === opt ? 'radio-button-on' : 'radio-button-off'}
                        size={16} color={type === opt ? theme.primary : muted}
                      />
                      <Text style={{ color: type === opt ? theme.primary : muted, fontWeight: FontWeight.bold, fontSize: FontSize.sm }}>
                        {opt === 'TRANSVERSAL' ? t('academic.instructorTypeTransversalShort') : t('academic.instructorTypeEspecificoShort')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {type === 'ESPECIFICO' && (
                <View style={fm.field}>
                  <Text style={[fm.label, { color: text }]}>{t('academic.instructorProgramsLabel')}</Text>
                  <View style={[fm.programSearch, { backgroundColor: inputBg, borderColor: inpBdr }]}>
                    <Ionicons name="search-outline" size={16} color={muted} />
                    <TextInput
                      value={programQuery}
                      onChangeText={setProgramQuery}
                      placeholder={t('academic.instructorSearchProgramsPlaceholder')}
                      placeholderTextColor={muted}
                      style={[fm.programSearchInput, { color: text }] as any}
                    />
                  </View>
                  {programs.length === 0
                    ? <Text style={{ color: muted, fontSize: FontSize.sm }}>{t('academic.instructorNoActivePrograms')}</Text>
                    : filteredPrograms.map(p => {
                        const on = selected.includes(p.id);
                        return (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => { toggleProgram(p.id); setError(''); }}
                            style={[fm.programOption, {
                              borderColor:     on ? theme.primary : inpBdr,
                              backgroundColor: on ? theme.primary + '12' : inputBg,
                            }]}
                            activeOpacity={0.7}
                          >
                            <Ionicons name={on ? 'checkbox' : 'square-outline'} size={18} color={on ? theme.primary : muted} />
                            <Text style={{ color: on ? theme.primary : text, fontSize: FontSize.sm, fontWeight: on ? FontWeight.bold : FontWeight.semibold, flex: 1 }}>
                              {p.name} <Text style={{ color: muted }}>({p.code})</Text>
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                  }
                  {programs.length > 0 && filteredPrograms.length === 0 ? (
                    <Text style={{ color: muted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: 8 }}>{t('academic.instructorNoProgramsFound')}</Text>
                  ) : null}
                </View>
              )}
              {/* Error */}
              {error ? <Text style={fm.error}>{error}</Text> : null}
              {/* Botón */}
              <TouchableOpacity
                disabled={saving}
                onPress={handleSave}
                style={[fm.saveBtn, saving && { opacity: 0.65 }]}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={fm.saveBtnGrad}>
                  {saving
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Ionicons name={editing ? 'save-outline' : 'person-add-outline'} size={18} color={Colors.white} />
                  }
                  <Text style={{ color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.base }}>
                    {saving ? t('academic.instructorSaving') : editing ? t('academic.instructorSaveChanges') : t('academic.instructorCreateBtn')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
