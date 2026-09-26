// ─────────────────────────────────────────────
//  app/admin/academic/assignments.tsx
//  RF-3.2 — Asignación manual de Aprendices a Ficha
//  El Coordinador registra aprendices con datos
//  personales (documento, nombre, apellido, correo)
//  y selecciona la ficha por código/número.
//  El backend crea el usuario si no existe y
//  genera la contraseña automáticamente.
// ─────────────────────────────────────────────
import { assignApprentice } from '@/features/academic/academicApi';
import { refreshAcademicStoreFromBackend, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Estado de un resultado de asignación ─────
type AssignResult = {
  success: boolean;
  apprenticeName: string;
  fichaCode: string;
  initialPassword?: string;
  document?: string;
  error?: string;
};

export default function AcademicAssignmentsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { allFichas, programs } = useAcademic();

  // ── Datos del aprendiz ────────────────────
  const [document,  setDocument]  = useState('');
  const [name,      setName]      = useState('');
  const [lastname,  setLastname]  = useState('');
  const [email,     setEmail]     = useState('');

  // ── Selección de ficha ────────────────────
  const [fichaSearch, setFichaSearch] = useState('');
  const [selectedFicha, setSelectedFicha] = useState<{ id: string; code: string; number: string; programName: string } | null>(null);

  // ── Estado UI ─────────────────────────────
  const [saving,    setSaving]   = useState(false);
  const [error,     setError]    = useState('');
  const [result,    setResult]   = useState<AssignResult | null>(null);

  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg  = theme.surface;
  const border  = theme.border;
  const inputBg = theme.inputBg;
  const bg      = isDark ? Colors.dark.background : Colors.light.background;

  // ── Fichas activas filtradas por búsqueda ──
  const activeFichas = useMemo(() => {
    const q = fichaSearch.toLowerCase().trim();
    return allFichas
      .filter(f => f.status === 'active')
      .map(f => {
        const prog = programs.find(p => p.id === f.programId);
        return {
          id:          f.id,
          code:        f.code,
          number:      f.number,
          programName: prog?.name ?? t('academic.assignNoProgram'),
          programCode: prog?.code ?? '',
        };
      })
      .filter(f => !q || f.number.includes(q) || f.code.toLowerCase().includes(q) || f.programName.toLowerCase().includes(q));
  }, [allFichas, programs, fichaSearch, t]);

  const reset = () => {
    setDocument(''); setName(''); setLastname(''); setEmail('');
    setFichaSearch(''); setSelectedFicha(null); setError(''); setResult(null);
  };

  const validate = (): string | null => {
    if (!/^\d{6,15}$/.test(document.trim()))                    return t('academic.assignValidationDoc');
    if (!name.trim())                                            return t('academic.assignValidationName');
    if (!lastname.trim())                                        return t('academic.assignValidationLastName');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))       return t('academic.assignValidationEmail');
    if (!selectedFicha)                                          return t('academic.assignValidationFicha');
    return null;
  };

  const handleAssign = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    try {
      const resp = await assignApprentice(selectedFicha!.id, {
        document: document.trim(),
        name:     name.trim(),
        lastname: lastname.trim(),
        email:    email.trim(),
      });
      const data = (resp as any)?.data ?? resp;
      const pwd  = (data as any)?.initialPassword ?? (data as any)?.password ?? null;
      await refreshAcademicStoreFromBackend();
      setResult({
        success:         true,
        apprenticeName:  `${name.trim()} ${lastname.trim()}`,
        fichaCode:       selectedFicha!.number,
        initialPassword: pwd ?? undefined,
        document:        document.trim(),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('academic.assignError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Pantalla de resultado exitoso ──────────
  if (result?.success) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
        <ScrollView contentContainerStyle={s.resultScroll} showsVerticalScrollIndicator={false}>
          <View style={[s.resultCard, { backgroundColor: cardBg, borderColor: border }]}>
            {/* Ícono éxito */}
            <View style={[s.resultIcon, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
            </View>

            <Text style={[s.resultTitle,    { color: text  }]}>{t('academic.assignSuccessTitle')}</Text>
            <Text style={[s.resultSubtitle, { color: muted }]}>
              <Text style={{ fontWeight: FontWeight.black, color: text }}>{result.apprenticeName}</Text>
              {' '}{t('academic.assignSuccessSubtitle')}{' '}
              <Text style={{ fontWeight: FontWeight.black, color: theme.primary }}>{result.fichaCode}</Text>
              {' '}{t('academic.assignSuccessAdverb')}
            </Text>

            {/* Contraseña generada */}
            {result.initialPassword && (
              <View style={[s.pwdSection, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '44' }]}>
                <View style={s.pwdHeader}>
                  <Ionicons name="key-outline" size={16} color={theme.primary} />
                  <Text style={[s.pwdLabel, { color: theme.primary }]}>{t('academic.assignPwdLabel')}</Text>
                </View>
                <Text style={[s.pwdValue, { color: theme.primary }]}>{result.initialPassword}</Text>
                <Text style={[s.pwdHint, { color: muted }]}>
                  {t('academic.assignPwdDocHint')}:{' '}
                  <Text style={{ fontWeight: FontWeight.black, color: text }}>{result.document}</Text>
                </Text>
                <View style={[s.pwdWarning, { backgroundColor: Colors.warning + '15', borderColor: Colors.warning + '44' }]}>
                  <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
                  <Text style={[s.pwdWarningText, { color: Colors.warning }]}>
                    {t('academic.assignPwdWarning')}
                  </Text>
                </View>
              </View>
            )}

            {/* Acciones */}
            <View style={s.resultActions}>
              <TouchableOpacity onPress={reset} style={[s.newBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
                <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={s.newBtnGrad}>
                  <Ionicons name="person-add-outline" size={18} color={Colors.white} />
                  <Text style={{ color: Colors.white, fontWeight: FontWeight.bold }}>{t('academic.assignAnotherBtn')}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={[s.backLink, { borderColor: border }]} activeOpacity={0.7}>
                <Ionicons name="arrow-back-outline" size={16} color={muted} />
                <Text style={{ color: muted, fontWeight: FontWeight.semibold }}>{t('academic.assignBackBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Formulario principal ───────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]}>
      {/* Cabecera */}
      <View style={[s.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: text }]}>{t('academic.assignTitle')}</Text>
          <Text style={[s.subtitle, { color: muted }]}>{t('academic.assignSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Sección: datos del aprendiz ── */}
        <View style={[s.section, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="person-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[s.sectionTitle, { color: text }]}>{t('academic.assignSectionLearner')}</Text>
          </View>

          {/* Documento */}
          <View style={s.field}>
            <Text style={[s.label, { color: text }]}>{t('academic.assignDocLabel')}</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: error && !document ? Colors.error : border }]}>
              <Ionicons name="card-outline" size={16} color={muted} />
              <TextInput
                style={[s.input, { color: text }] as any}
                value={document}
                onChangeText={v => { setDocument(v.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                placeholder={t('academic.assignDocPlaceholder')}
                placeholderTextColor={muted}
                keyboardType="numeric"
                maxLength={10}
              />
              {document.length === 10 && (
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              )}
            </View>
          </View>

          {/* Nombre */}
          <View style={s.field}>
            <Text style={[s.label, { color: text }]}>{t('academic.assignNameLabel')}</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: border }]}>
              <Ionicons name="person-outline" size={16} color={muted} />
              <TextInput
                style={[s.input, { color: text }] as any}
                value={name}
                onChangeText={v => { setName(v); setError(''); }}
                placeholder={t('academic.assignNamePlaceholder')}
                placeholderTextColor={muted}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Apellido */}
          <View style={s.field}>
            <Text style={[s.label, { color: text }]}>{t('academic.assignLastNameLabel')}</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: border }]}>
              <Ionicons name="person-outline" size={16} color={muted} />
              <TextInput
                style={[s.input, { color: text }] as any}
                value={lastname}
                onChangeText={v => { setLastname(v); setError(''); }}
                placeholder={t('academic.assignLastNamePlaceholder')}
                placeholderTextColor={muted}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Correo */}
          <View style={s.field}>
            <Text style={[s.label, { color: text }]}>{t('academic.assignEmailLabel')}</Text>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: border }]}>
              <Ionicons name="mail-outline" size={16} color={muted} />
              <TextInput
                style={[s.input, { color: text }] as any}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                placeholder={t('academic.assignEmailPlaceholder')}
                placeholderTextColor={muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        {/* ── Sección: selección de ficha ── */}
        <View style={[s.section, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionIcon, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="document-text-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[s.sectionTitle, { color: text }]}>{t('academic.assignSectionFicha')}</Text>
          </View>

          {/* Ficha seleccionada */}
          {selectedFicha && (
            <View style={[s.selectedFicha, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '55' }]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.selectedFichaCode, { color: theme.primary }]}>{t('academic.assignFichaLabel')} {selectedFicha.number}</Text>
                <Text style={[s.selectedFichaProg,  { color: muted }]}>{selectedFicha.programName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedFicha(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle-outline" size={18} color={muted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Búsqueda de ficha */}
          {!selectedFicha && (
            <>
              <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: border, marginBottom: 10 }]}>
                <Ionicons name="search-outline" size={16} color={muted} />
                <TextInput
                  style={[s.input, { color: text }] as any}
                  value={fichaSearch}
                  onChangeText={setFichaSearch}
                  placeholder={t('academic.assignFichaSearchPlaceholder')}
                  placeholderTextColor={muted}
                />
                {fichaSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setFichaSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle" size={16} color={muted} />
                  </TouchableOpacity>
                )}
              </View>

              {activeFichas.length === 0 ? (
                <Text style={[s.fichaEmpty, { color: muted }]}>
                  {fichaSearch ? t('academic.assignFichaNoResults') : t('academic.assignFichaEmpty')}
                </Text>
              ) : (
                <FlatList
                  data={activeFichas}
                  keyExtractor={f => f.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={[s.separator, { backgroundColor: border }]} />}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => { setSelectedFicha(item); setFichaSearch(''); setError(''); }}
                      style={s.fichaOption}
                      activeOpacity={0.7}
                    >
                      <View style={[s.fichaCodeBadge, { backgroundColor: theme.primary + '18' }]}>
                        <Text style={[s.fichaCodeText, { color: theme.primary }]}>{item.number}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.fichaProgramName, { color: text }]}>{item.programName}</Text>
                        <Text style={[s.fichaProgramCode, { color: muted }]}>{item.programCode}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={muted} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}
        </View>

        {/* ── Error ── */}
        {error ? (
          <View style={[s.errorBanner, { backgroundColor: Colors.error + '12', borderColor: Colors.error + '44' }]}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={[s.errorText, { color: Colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {/* ── Botón asignar ── */}
        <TouchableOpacity
          disabled={saving}
          onPress={handleAssign}
          style={[s.submitBtn, saving && { opacity: 0.65 }]}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#72C96D', '#65B361', '#4FA14B']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.submitBtnGrad}
          >
            {saving
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Ionicons name="person-add-outline" size={20} color={Colors.white} />
            }
            <Text style={s.submitBtnText}>
              {saving ? t('academic.assignSaving') : t('academic.assignBtn')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Nota informativa */}
        <View style={[s.infoNote, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="information-circle-outline" size={15} color={muted} />
          <Text style={[s.infoNoteText, { color: muted }]}>
            {t('academic.assignInfoNote')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48, gap: 14 },

  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:  { padding: 4 },
  title:    { fontSize: FontSize.xl,  fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.xs,  marginTop: 2 },

  section:       { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIcon:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: FontSize.base, fontWeight: FontWeight.black },

  field:     { marginBottom: 12 },
  label:     { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 12 },
  input:     { flex: 1, fontSize: FontSize.base, outlineStyle: 'none' } as any,

  selectedFicha:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: 4 },
  selectedFichaCode:  { fontSize: FontSize.base, fontWeight: FontWeight.black },
  selectedFichaProg:  { fontSize: FontSize.xs, marginTop: 1 },

  fichaOption:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 2 },
  fichaCodeBadge:  { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fichaCodeText:   { fontSize: FontSize.sm, fontWeight: FontWeight.black },
  fichaProgramName:{ fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  fichaProgramCode:{ fontSize: FontSize.xs, marginTop: 1 },
  fichaEmpty:      { fontSize: FontSize.sm, textAlign: 'center', paddingVertical: 16 },
  separator:       { height: 1, marginVertical: 1 },

  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  errorText:   { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, lineHeight: 18 },

  submitBtn:     { borderRadius: 16, overflow: 'hidden' },
  submitBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  submitBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },

  infoNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  infoNoteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 17 },

  // Resultado exitoso
  resultScroll:  { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  resultCard:    { width: '100%', maxWidth: 480, borderRadius: 22, borderWidth: 1, padding: 26, alignItems: 'center', gap: 4 },
  resultIcon:    { width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  resultTitle:   { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  resultSubtitle:{ fontSize: FontSize.base, lineHeight: 22, textAlign: 'center', marginBottom: 18 },

  pwdSection:    { width: '100%', borderRadius: 14, borderWidth: 1.5, padding: 16, marginBottom: 18, gap: 6 },
  pwdHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pwdLabel:      { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  pwdValue:      { fontSize: 26, fontWeight: FontWeight.black, letterSpacing: 2, textAlign: 'center', paddingVertical: 8 },
  pwdHint:       { fontSize: FontSize.xs, textAlign: 'center' },
  pwdWarning:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 4 },
  pwdWarningText:{ flex: 1, fontSize: FontSize.xs, lineHeight: 16 },

  resultActions: { width: '100%', gap: 10, marginTop: 4 },
  newBtn:        { borderRadius: 14, overflow: 'hidden' },
  newBtnGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  backLink:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.2, borderRadius: 14, paddingVertical: 12 },
});
