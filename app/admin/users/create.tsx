// ─────────────────────────────────────────────
//  app/admin/users/create.tsx
//  RF-10 — Alta manual de usuario
//
//  · Solo ofrece Instructor / Aprendiz (nunca Admin ni Coordinador)
//  · Validaciones de negocio locales antes de confirmar
//  · Muestra la contraseña temporal generada para iniciar sesión
// ─────────────────────────────────────────────
import { InstructorType, MOCK_PROGRAMS, MockUserRole } from '@/features/users/mocks';
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
  document: string;
  name: string;
  lastname: string;
  email: string;
  role: MockUserRole;
  instructorType: InstructorType;
  programCode: string;
}

interface Errors {
  document?: string;
  name?: string;
  lastname?: string;
  email?: string;
  programCode?: string;
}

const EMPTY_FORM: Form = {
  document: '',
  name: '',
  lastname: '',
  email: '',
  role: 'INSTRUCTOR',
  instructorType: 'especifico',
  programCode: '',
};

function generateTemporaryPassword() {
  const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
  const randomLetters = Math.random().toString(36).slice(-4).toUpperCase();
  return `FaceLit-${randomDigits}${randomLetters}`;
}

export default function CreateUserScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(true);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = theme.surface;
  const border = theme.border;
  const softAmber = theme.warningSoft;
  const softBlue = theme.infoSoft;
  const softGreen = theme.successSoft;

  const set = (key: keyof Form) => (val: string) => {
    setForm((current) => ({ ...current, [key]: val }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Errors = {};

    if (!form.document.trim()) {
      nextErrors.document = t('users.errors.requiredField');
    } else if (!/^\d{10}$/.test(form.document.trim())) {
      nextErrors.document = t('register.errors.documentLength');
    }

    if (!form.name.trim()) {
      nextErrors.name = t('users.errors.requiredField');
    }

    if (!form.lastname.trim()) {
      nextErrors.lastname = t('users.errors.requiredField');
    }

    if (!form.email.trim()) {
      nextErrors.email = t('users.errors.requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t('register.errors.emailInvalid');
    }

    if (form.role === 'INSTRUCTOR' && form.instructorType === 'especifico' && !form.programCode.trim()) {
      nextErrors.programCode = t('users.errors.specificNeedsProgram');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const password = generateTemporaryPassword();
    setCreatedPassword(password);
    setPasswordVisible(true);

    alert(
      t('users.create.title'),
      `Usuario creado correctamente. La contraseña inicial es: ${password}. Entregarla al usuario para que inicie sesión.`,
      [{ text: t('common.ok') }],
    );
  };

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
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );

  const showInstructorExtras = form.role === 'INSTRUCTOR';
  const showProgramPicker = form.role === 'INSTRUCTOR' && form.instructorType === 'especifico';

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

          <Text style={[styles.section, { color: theme.primary }]}>
            {t('users.create.roleLabel')}
          </Text>

          <View style={styles.roleRow}>
            {(['INSTRUCTOR', 'APPRENTICE'] as MockUserRole[]).map((roleOption) => {
              const active = form.role === roleOption;
              return (
                <TouchableOpacity
                  key={roleOption}
                  onPress={() => {
                    set('role')(roleOption);
                    setErrors((current) => ({ ...current, programCode: undefined }));
                  }}
                  style={[
                    styles.roleOption,
                    {
                      borderColor: active ? theme.primary : border,
                      backgroundColor: active ? theme.primary + '18' : 'transparent',
                      flex: 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={roleOption === 'INSTRUCTOR' ? 'school-outline' : 'person-outline'}
                    size={18}
                    color={active ? theme.primary : muted}
                  />
                  <Text style={[styles.roleOptionText, { color: active ? theme.primary : text }]}>
                    {roleOption === 'INSTRUCTOR'
                      ? t('users.create.roleInstructor')
                      : t('users.create.roleApprentice')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showInstructorExtras && (
            <>
              <Text style={[styles.section, { color: theme.primary }]}>
                {t('users.create.instructorTypeLabel')}
              </Text>

              <View style={styles.roleRow}>
                {(['especifico', 'transversal'] as InstructorType[]).map((typeOption) => {
                  const active = form.instructorType === typeOption;
                  return (
                    <TouchableOpacity
                      key={typeOption}
                      onPress={() => {
                        set('instructorType')(typeOption);
                        if (typeOption === 'transversal') {
                          set('programCode')('');
                          setErrors((current) => ({ ...current, programCode: undefined }));
                        }
                      }}
                      style={[
                        styles.roleOption,
                        {
                          borderColor: active ? theme.primary : border,
                          backgroundColor: active ? theme.primary + '18' : 'transparent',
                          flex: 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={typeOption === 'especifico' ? 'bookmark-outline' : 'globe-outline'}
                        size={16}
                        color={active ? theme.primary : muted}
                      />
                      <Text style={[styles.roleOptionText, { color: active ? theme.primary : text }]}>
                        {typeOption === 'especifico'
                          ? t('users.create.instructorTypeSpecific')
                          : t('users.create.instructorTypeTransversal')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {showProgramPicker && (
            <>
              <Text style={[styles.section, { color: theme.primary }]}>
                {t('users.create.programLabel')}
              </Text>

              <View style={styles.programGrid}>
                {MOCK_PROGRAMS.map((program) => {
                  const active = form.programCode === program.code;
                  return (
                    <TouchableOpacity
                      key={program.code}
                      onPress={() => set('programCode')(program.code)}
                      style={[
                        styles.programChip,
                        {
                          borderColor: active ? theme.primary : border,
                          backgroundColor: active ? theme.primary + '18' : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.programCode, { color: active ? theme.primary : text }]}>
                        {program.code}
                      </Text>
                      <Text style={[styles.programLabel, { color: active ? theme.primary : muted }]} numberOfLines={2}>
                        {program.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errors.programCode ? <Text style={styles.fieldError}>{errors.programCode}</Text> : null}
            </>
          )}

          <View style={[styles.note, { backgroundColor: softAmber, borderColor: Colors.warning + '40' }]}>
            <Ionicons name="key-outline" size={14} color={Colors.warning} />
            <Text style={[styles.noteText, { color: Colors.warning }]}>
              La contraseña se genera automáticamente y se entrega al usuario para que inicie sesión por primera vez.
            </Text>
          </View>

          {createdPassword ? (
            <View style={[styles.passwordBox, { backgroundColor: softGreen, borderColor: Colors.success + '55' }]}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.passwordTitle, { color: Colors.success }]}>Contraseña temporal</Text>
                <TouchableOpacity onPress={() => setPasswordVisible((visible) => !visible)}>
                  <Text style={[styles.passwordAction, { color: Colors.success }]}>
                    {passwordVisible ? 'Ocultar' : 'Mostrar'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.passwordValue, { color: Colors.success }]}>
                {passwordVisible ? createdPassword : '••••••••••••'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  alert('Contraseña inicial', createdPassword, [{ text: 'OK' }]);
                }}
                style={styles.copyButton}
              >
                <Ionicons name="copy-outline" size={14} color={Colors.success} />
                <Text style={[styles.copyButtonText, { color: Colors.success }]}>Ver contraseña</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={[styles.note, { backgroundColor: softBlue, borderColor: theme.info + '40' }]}>
            <Ionicons name="lock-closed-outline" size={14} color={theme.info} />
            <Text style={[styles.noteText, { color: theme.info }]}>
              El documento es de solo lectura en la ficha y la contraseña solo se muestra al momento de crear la cuenta.
            </Text>
          </View>

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
  root: { flex: 1 },
  scroll: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  section: { fontSize: FontSize.xs, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  fieldError: { color: Colors.error, fontSize: FontSize.xs, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  roleOptionText: { fontSize: FontSize.sm, fontWeight: '700' },
  programGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  programChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, width: '47%' },
  programCode: { fontSize: FontSize.sm, fontWeight: '900' },
  programLabel: { fontSize: FontSize.xs, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  passwordBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  passwordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passwordTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  passwordAction: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  passwordValue: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginTop: 10 },
  copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  copyButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 11 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  submitBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
});
