// ─────────────────────────────────────────────
//  app/admin/users/create.tsx
//  RF-10 — Alta manual de usuario (datos quemados)
//
//  · Solo ofrece Instructor / Aprendiz (nunca Admin ni Coordinador)
//  · Validaciones locales antes de confirmar
//  · Al confirmar muestra mensaje de éxito y vuelve al panel
// ─────────────────────────────────────────────
import { InstructorType, MockUserRole, MOCK_PROGRAMS } from '@/features/users/mocks';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Form {
  document:       string;
  name:           string;
  lastname:       string;
  email:          string;
  role:           MockUserRole;
  instructorType: InstructorType;
  programCode:    string;
}

interface Errors {
  document?:       string;
  name?:           string;
  lastname?:       string;
  email?:          string;
  programCode?:    string;
}

const EMPTY_FORM: Form = {
  document:       '',
  name:           '',
  lastname:       '',
  email:          '',
  role:           'INSTRUCTOR',
  instructorType: 'especifico',
  programCode:    '',
};

export default function CreateUserScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const { alert, DialogUI } = useAppDialog();

  const [form, setForm]     = useState<Form>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});

  // ── Colores ────────────────────────────────
  const text      = isDark ? Colors.dark.text       : Colors.light.text;
  const muted     = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const bg        = isDark ? Colors.dark.background : Colors.light.background;
  const card      = isDark ? '#0D1F14'              : Colors.white;
  const border    = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const softAmber = isDark ? 'rgba(232,155,44,0.16)': '#FFF5DF';
  const softBlue  = isDark ? 'rgba(74,144,217,0.16)': '#EAF3FC';

  // ── Helpers ────────────────────────────────
  const set = (key: keyof Form) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  // ── Validación ────────────────────────────
  const validate = (): boolean => {
    const e: Errors = {};

    if (!form.document.trim())
      e.document = t('users.errors.requiredField');
    else if (!/^\d{10}$/.test(form.document.trim()))
      e.document = t('register.errors.documentLength');

    if (!form.name.trim())
      e.name = t('users.errors.requiredField');

    if (!form.lastname.trim())
      e.lastname = t('users.errors.requiredField');

    if (!form.email.trim())
      e.email = t('users.errors.requiredField');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = t('register.errors.emailInvalid');

    if (form.role === 'INSTRUCTOR' && form.instructorType === 'especifico' && !form.programCode)
      e.programCode = t('users.errors.specificNeedsProgram');

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    alert(t('users.create.title'), t('users.create.success'), [
      { text: t('common.ok'), onPress: () => router.back() },
    ]);
  };

  // ── Subcomponentes ─────────────────────────
  const Field = ({
    label, value, onChange, placeholder, keyboard, error, maxLength,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    keyboard?: 'default' | 'email-address' | 'numeric';
    error?: string;
    maxLength?: number;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.primary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={muted}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        maxLength={maxLength}
        style={[
          styles.field,
          { color: text, borderColor: error ? Colors.error : border },
        ]}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );

  const showInstructorExtras =
    form.role === 'INSTRUCTOR';
  const showProgramPicker =
    form.role === 'INSTRUCTOR' && form.instructorType === 'especifico';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: card, borderColor: border }]}
          >
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: text }]}>{t('users.create.title')}</Text>
            <Text style={[styles.subtitle, { color: muted }]}>
              {t('users.panel.createButton')}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>

          {/* ── Sección datos personales ── */}
          <Text style={[styles.section, { color: theme.primary }]}>
            {t('register.sections.personal')}
          </Text>

          <Field
            label={t('users.document')}
            value={form.document}
            onChange={set('document')}
            placeholder="0000000000"
            keyboard="numeric"
            maxLength={10}
            error={errors.document}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label={t('users.firstName')}
                value={form.name}
                onChange={set('name')}
                error={errors.name}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t('users.lastName')}
                value={form.lastname}
                onChange={set('lastname')}
                error={errors.lastname}
              />
            </View>
          </View>

          <Field
            label={t('register.email')}
            value={form.email}
            onChange={set('email')}
            placeholder="correo@ejemplo.com"
            keyboard="email-address"
            error={errors.email}
          />

          {/* ── Sección rol ── */}
          <Text style={[styles.section, { color: theme.primary }]}>
            {t('users.create.roleLabel')}
          </Text>

          <View style={styles.roleRow}>
            {(['INSTRUCTOR', 'APPRENTICE'] as MockUserRole[]).map(r => {
              const active = form.role === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    set('role')(r);
                    setErrors(e => ({ ...e, programCode: undefined }));
                  }}
                  style={[
                    styles.roleOption,
                    {
                      borderColor:     active ? theme.primary : border,
                      backgroundColor: active ? theme.primary + '18' : 'transparent',
                      flex: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={r === 'INSTRUCTOR' ? 'school-outline' : 'person-outline'}
                    size={18}
                    color={active ? theme.primary : muted}
                  />
                  <Text style={[styles.roleOptionText, { color: active ? theme.primary : text }]}>
                    {r === 'INSTRUCTOR'
                      ? t('users.create.roleInstructor')
                      : t('users.create.roleApprentice')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Tipo instructor ── */}
          {showInstructorExtras && (
            <>
              <Text style={[styles.section, { color: theme.primary }]}>
                {t('users.create.instructorTypeLabel')}
              </Text>

              <View style={styles.roleRow}>
                {(['especifico', 'transversal'] as InstructorType[]).map(tp => {
                  const active = form.instructorType === tp;
                  return (
                    <TouchableOpacity
                      key={tp}
                      onPress={() => {
                        set('instructorType')(tp);
                        if (tp === 'transversal') {
                          set('programCode')('');
                          setErrors(e => ({ ...e, programCode: undefined }));
                        }
                      }}
                      style={[
                        styles.roleOption,
                        {
                          borderColor:     active ? theme.primary : border,
                          backgroundColor: active ? theme.primary + '18' : 'transparent',
                          flex: 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={tp === 'especifico' ? 'bookmark-outline' : 'globe-outline'}
                        size={16}
                        color={active ? theme.primary : muted}
                      />
                      <Text style={[styles.roleOptionText, { color: active ? theme.primary : text }]}>
                        {tp === 'especifico'
                          ? t('users.create.instructorTypeSpecific')
                          : t('users.create.instructorTypeTransversal')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Programa (específico) ── */}
          {showProgramPicker && (
            <>
              <Text style={[styles.section, { color: theme.primary }]}>
                {t('users.create.programLabel')}
              </Text>

              <View style={styles.programGrid}>
                {MOCK_PROGRAMS.map(p => {
                  const active = form.programCode === p.code;
                  return (
                    <TouchableOpacity
                      key={p.code}
                      onPress={() => { set('programCode')(p.code); }}
                      style={[
                        styles.programChip,
                        {
                          borderColor:     active ? theme.primary : border,
                          backgroundColor: active ? theme.primary + '18' : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.programCode, { color: active ? theme.primary : text }]}>
                        {p.code}
                      </Text>
                      <Text style={[styles.programLabel, { color: active ? theme.primary : muted }]} numberOfLines={1}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errors.programCode && (
                <Text style={styles.fieldError}>{errors.programCode}</Text>
              )}
            </>
          )}

          {/* ── Nota contraseña auto ── */}
          <View style={[styles.note, { backgroundColor: softAmber, borderColor: Colors.warning + '40' }]}>
            <Ionicons name="key-outline" size={14} color={Colors.warning} />
            <Text style={[styles.noteText, { color: Colors.warning }]}>
              {t('users.panel.autoPassword')}
            </Text>
          </View>

          {/* ── Nota solo lectura documento ── */}
          <View style={[styles.note, { backgroundColor: softBlue, borderColor: '#4A90D940' }]}>
            <Ionicons name="lock-closed-outline" size={14} color="#4A90D9" />
            <Text style={[styles.noteText, { color: '#4A90D9' }]}>
              {t('users.detail.documentReadonly')}
            </Text>
          </View>

          {/* ── Acciones ── */}
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={{ color: muted, fontWeight: '600' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="person-add-outline" size={16} color={Colors.white} />
              <Text style={styles.submitBtnText}>{t('users.panel.createButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {DialogUI}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { padding: 18, paddingBottom: 40 },

  header:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 20 },
  backBtn:  { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },

  card: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },

  section: { fontSize: FontSize.xs, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 },

  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  field: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  fieldError: { color: Colors.error, fontSize: FontSize.xs, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },

  roleRow: { flexDirection: 'row', gap: 10 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  roleOptionText: { fontSize: FontSize.sm, fontWeight: '700' },

  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  programChip: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 11, paddingVertical: 9,
    width: '47%',
  },
  programCode:  { fontSize: FontSize.sm, fontWeight: '900' },
  programLabel: { fontSize: FontSize.xs, marginTop: 2 },

  note: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 10,
  },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },

  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  cancelBtn:   { paddingHorizontal: 8, paddingVertical: 11 },
  submitBtn:   { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  submitBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
});
