// ─────────────────────────────────────────────
//  app/admin/academic/instructors.tsx
//  RF-3.2 — Gestión manual de Instructores
//  El Coordinador crea instructores con datos
//  personales (documento, nombre, apellido, correo).
//  El backend genera la contraseña automáticamente.
// ─────────────────────────────────────────────
import {
    createInstructor,
    deleteInstructor as deleteInstructorApi,
    fetchInstructors,
    reactivateInstructor,
    updateInstructor
} from '@/features/academic/academicApi';
import { refreshAcademicStoreFromBackend, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Tipo que refleja InstructorResponseDTO ────
type InstructorItem = {
  idInstructor: string;
  idUser: string;
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  instructorType: 'ESPECIFICO' | 'TRANSVERSAL';
  programIds: string[];
  programNames?: string[];
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string | null;
  updatedAt?: string | null;
};

// ── Modal de registro / edición ───────────────
function InstructorFormModal({
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
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inpBdr  = isDark ? 'rgba(255,255,255,0.20)' : '#CCCCCC';

  const reset = () => {
    setDocument(''); setName(''); setLastname(''); setEmail('');
    setType('TRANSVERSAL'); setSelected([]); setProgramQuery(''); setError(''); setPwdResult('');
  };

  const handleClose = () => { reset(); onClose(); };

  const toggleProgram = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  useEffect(() => {
    if (!visible) return;
    if (!editItem) {
      reset();
      return;
    }
    setDocument(editItem.document ?? '');
    setName(editItem.firstName ?? '');
    setLastname(editItem.lastName ?? '');
    setEmail(editItem.email ?? '');
    setType(editItem.instructorType ?? 'TRANSVERSAL');
    setSelected(editItem.programIds ?? []);
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
    if (selected.length === 0) { setError(t('academic.instructorValidationPrograms')); return; }

    setSaving(true);
    try {
      const payload = {
        document:       cleanedDocument,
        name:           name.trim(),
        lastname:       lastname.trim(),
        email:          email.trim(),
        instructorType: type,
        programIds:     selected,
      };
      const result = editing && editItem
        ? await updateInstructor(editItem.idInstructor, payload)
        : await createInstructor(payload);
      // El backend puede devolver initialPassword en la respuesta
      const pwd = (result as any)?.initialPassword ?? (result as any)?.password ?? null;
      await refreshAcademicStoreFromBackend();
      if (!editing && pwd) {
        setPwdResult(pwd);
      } else {
        reset();
        onSaved();
        onClose();
      }
    } catch (err: any) {
      const serverMessage = err?.response?.data?.message ?? err?.response?.data?.error ?? '';
      const duplicateMessage = /document|duplicado|registrado/i.test(serverMessage)
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
        <View style={[fm.sheet, { backgroundColor: isDark ? Colors.dark.surface : Colors.white }]}>
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
                      onPress={() => { setType(opt); setError(''); }}
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
              {/* Programas en los que puede dar formación */}
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

const fm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  sheet:        { width: '100%', maxWidth: 520, borderRadius: 22, padding: 22, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title:        { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  field:        { marginBottom: 14 },
  label:        { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 5 },
  input:        { height: 46, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 12, fontSize: FontSize.base, outlineStyle: 'none' } as any,
  typeRow:      { flexDirection: 'row', gap: 10 },
  typeBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  programSearch:{ height: 42, borderWidth: 1.2, borderRadius: 11, paddingHorizontal: 12, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  programSearchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
  programOption:{ flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1.2, borderRadius: 11, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 7 },
  error:        { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 10 },
  saveBtn:      { borderRadius: 14, overflow: 'hidden', marginTop: 4, marginBottom: 12 },
  saveBtnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  // Pantalla de contraseña generada
  pwdBox:       { alignItems: 'center', paddingVertical: 12 },
  pwdTitle:     { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 8 },
  pwdSub:       { fontSize: FontSize.sm, lineHeight: 20, textAlign: 'center', marginBottom: 18, paddingHorizontal: 8 },
  pwdCard:      { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 16, marginBottom: 12 },
  pwdValue:     { fontSize: 24, fontWeight: FontWeight.black, letterSpacing: 2, textAlign: 'center' },
  pwdHint:      { fontSize: FontSize.sm, marginBottom: 20 },
  pwdBtn:       { borderRadius: 14, paddingHorizontal: 32, paddingVertical: 13 },
});

// ── Pantalla principal ────────────────────────
export default function AcademicInstructorsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { programs } = useAcademic();

  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ESPECIFICO' | 'TRANSVERSAL'>('ALL');
  const [items,      setItems]      = useState<InstructorItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingItem, setEditingItem] = useState<InstructorItem | null>(null);

  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const inputBg = theme.inputBg;
  const bg      = isDark ? Colors.dark.background : Colors.light.background;

  const activePrograms = programs
    .filter(p => p.status === 'active')
    .map(p => ({ id: p.id, name: p.name, code: p.code ?? '' }));

  const load = () => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    const q = search.trim();
    if (q) {
      if (/^\d+$/.test(q)) params.document = q;
      else params.name = q;
    }
    if (typeFilter !== 'ALL') params.type = typeFilter;
    fetchInstructors(params)
      .then(data => setItems(data as InstructorItem[]))
      .catch(err => setError(err?.response?.data?.message ?? t('academic.instructorLoadError')))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, typeFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: InstructorItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const refreshAfterLifecycleChange = async () => {
    await refreshAcademicStoreFromBackend();
    load();
  };

  const handleDeactivateInstructor = async (item: InstructorItem, fullName: string) => {
    try {
      await deleteInstructorApi(item.idInstructor);
      await refreshAfterLifecycleChange();
    } catch (err: any) {
      setError(err?.message ?? err?.response?.data?.message ?? t('academic.instructorDeactivateError', { name: fullName }));
    }
  };

  const handleActivateInstructor = async (item: InstructorItem, fullName: string) => {
    try {
      await reactivateInstructor(item.idInstructor);
      await refreshAfterLifecycleChange();
    } catch (err: any) {
      setError(err?.message ?? err?.response?.data?.message ?? t('academic.instructorActivateError', { name: fullName }));
    }
  };

  const handleDeleteInstructor = async (item: InstructorItem, fullName: string) => {
    try {
      await deleteInstructorApi(item.idInstructor);
      await refreshAfterLifecycleChange();
    } catch (err: any) {
      setError(err?.message ?? err?.response?.data?.message ?? t('academic.instructorDeleteError', { name: fullName }));
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      {/* Cabecera */}
      <View style={[s.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: text }]}>{t('academic.instructors')}</Text>
          <Text style={[s.subtitle, { color: muted }]}>{t('academic.instructorScreenSubtitle')}</Text>
        </View>
        <TouchableOpacity
          onPress={openCreateModal}
          style={[s.addBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={18} color={Colors.white} />
          <Text style={s.addBtnText}>{t('academic.instructorNewBtn')}</Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda y filtro */}
      <View style={s.filters}>
        <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="search-outline" size={16} color={muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('academic.instructorSearchPlaceholder')}
            placeholderTextColor={muted}
            style={[s.searchInput, { color: text }] as any}
            keyboardType="default"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={muted} />
            </TouchableOpacity>
          )}
        </View>
        <View style={s.typeFilters}>
          {(['ALL', 'TRANSVERSAL', 'ESPECIFICO'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              onPress={() => setTypeFilter(opt)}
              style={[s.typeChip, {
                backgroundColor: typeFilter === opt ? theme.primary + '20' : inputBg,
                borderColor:     typeFilter === opt ? theme.primary : border,
              }]}
              activeOpacity={0.7}
            >
              <Text style={[s.typeChipText, { color: typeFilter === opt ? theme.primary : muted }]}>
                {opt === 'ALL' ? t('academic.instructorFilterAll') : opt === 'TRANSVERSAL' ? t('academic.instructorFilterTransversal') : t('academic.instructorFilterEspecifico')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? (
        <View style={[s.errorBanner, { backgroundColor: Colors.error + '12', borderColor: Colors.error + '44' }]}>
          <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
          <Text style={[s.errorText, { color: Colors.error }]}>{error}</Text>
        </View>
      ) : null}

      {loading
        ? <ActivityIndicator color={theme.primary} style={{ marginTop: 32 }} />
        : (
          <FlatList
            data={items}
            keyExtractor={item => item.idInstructor}
            contentContainerStyle={s.list}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="people-outline" size={52} color={muted} />
                <Text style={[s.emptyText, { color: muted }]}>
                  {search ? t('academic.instructorNoResultsDoc') : t('academic.instructorEmpty')}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const fullName = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || t('academic.instructorNoName');
              const isEsp = item.instructorType === 'ESPECIFICO';
              const isInactive = item.status === 'INACTIVE';
              return (
                <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
                  {/* Cabecera tarjeta */}
                  <View style={s.cardHeader}>
                    <View style={[s.avatar, { backgroundColor: theme.primary + '20' }]}>
                      <Ionicons name="person-outline" size={22} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[s.cardName, { color: text }]}>{fullName}</Text>
                      {item.document
                        ? <Text style={[s.cardDoc,  { color: muted }]}>{t('academic.instructorDocPrefix')}: {item.document}</Text>
                        : null
                      }
                      {item.email
                        ? <Text style={[s.cardEmail, { color: muted }]}>{item.email}</Text>
                        : null
                      }
                      {item.createdAt ? (
                        <Text style={[s.cardEmail, { color: muted }]}>{t('academic.instructorCreatedPrefix')}: {formatDateTime(item.createdAt)}</Text>
                      ) : null}
                      {item.updatedAt ? (
                        <Text style={[s.cardEmail, { color: muted }]}>{t('academic.instructorLastEditPrefix')}: {formatDateTime(item.updatedAt)}</Text>
                      ) : null}
                    </View>
                    <View style={[s.typeBadge, {
                      backgroundColor: isInactive ? Colors.error + '15' : isEsp ? theme.primary + '20' : Colors.info + '20',
                    }]}>
                      <Text style={[s.typeBadgeText, { color: isInactive ? Colors.error : isEsp ? theme.primary : Colors.info }]}>
                        {isInactive ? t('academic.instructorStatusInactive') : isEsp ? t('academic.instructorTypeEspecificoShort') : t('academic.instructorTypeTransversalShort')}
                      </Text>
                    </View>
                  </View>

                  {/* Programas */}
                  {item.programNames && item.programNames.length > 0 && (
                    <View style={s.progRow}>
                      <Ionicons name="school-outline" size={13} color={muted} />
                      <Text style={[s.progText, { color: muted }]} numberOfLines={2}>
                        {item.programNames.join(' · ')}
                      </Text>
                    </View>
                  )}

                  {/* Acciones */}
                  <View style={s.actions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={[s.actionBtn, { borderColor: theme.primary }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={14} color={theme.primary} />
                      <Text style={[s.actionBtnText, { color: theme.primary }]}>{t('academic.instructorActionEdit')}</Text>
                    </TouchableOpacity>
                    {isInactive ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleActivateInstructor(item, fullName)}
                          style={[s.actionBtn, { borderColor: theme.primary }]}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color={theme.primary} />
                          <Text style={[s.actionBtnText, { color: theme.primary }]}>{t('academic.instructorActionActivate')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteInstructor(item, fullName)}
                          style={[s.actionBtn, { borderColor: Colors.error }]}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={14} color={Colors.error} />
                          <Text style={[s.actionBtnText, { color: Colors.error }]}>{t('academic.instructorActionDelete')}</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleDeactivateInstructor(item, fullName)}
                        style={[s.actionBtn, { borderColor: Colors.error }]}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="ban-outline" size={14} color={Colors.error} />
                        <Text style={[s.actionBtnText, { color: Colors.error }]}>{t('academic.instructorActionDeactivate')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )
      }

      <InstructorFormModal
        visible={modalOpen}
        onClose={closeModal}
        onSaved={load}
        editItem={editingItem}
        programs={activePrograms}
        theme={theme}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:     { padding: 4 },
  title:       { fontSize: FontSize.xl,  fontWeight: FontWeight.black },
  subtitle:    { fontSize: FontSize.xs,  marginTop: 2 },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText:  { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  filters:     { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6, gap: 10 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: FontSize.base, outlineStyle: 'none' } as any,
  typeFilters: { flexDirection: 'row', gap: 8 },
  typeChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, borderWidth: 1.2 },
  typeChipText:{ fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  errorText:   { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  list:        { padding: 16, gap: 12, paddingBottom: 40 },
  card:        { borderRadius: 16, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardName:    { fontSize: FontSize.base, fontWeight: FontWeight.black },
  cardDoc:     { fontSize: FontSize.xs },
  cardEmail:   { fontSize: FontSize.xs },
  typeBadge:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typeBadgeText:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  progRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 },
  progText:    { flex: 1, fontSize: FontSize.xs, lineHeight: 17 },

  actions:     { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.2, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  actionBtnText:{ fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  empty:       { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText:   { fontSize: FontSize.base, textAlign: 'center' },
});
