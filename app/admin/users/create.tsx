// ─────────────────────────────────────────────
//  app/admin/users/create.tsx
//  MF-06 — Alta de coordinador (no crea Instructor/Aprendiz)
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { createManagedUser } from '@/shared/services/userManagementService';
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
}

interface Errors {
  document?: string;
  name?: string;
  lastname?: string;
  email?: string;
}

const EMPTY_FORM: Form = {
  document: '',
  name: '',
  lastname: '',
  email: '',
};

function generateTemporaryPassword() {
  const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
  const randomLetters = Math.random().toString(36).slice(-4).toUpperCase();
  return `FaceLit-${randomDigits}${randomLetters}`;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboard?: 'default' | 'email-address' | 'numeric';
  error?: string;
  maxLength?: number;
  labelColor: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboard,
  error,
  maxLength,
  labelColor,
  textColor,
  mutedColor,
  borderColor,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: labelColor }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? label}
        placeholderTextColor={mutedColor}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        maxLength={maxLength}
        style={[styles.field, { color: textColor, borderColor: error ? Colors.error : borderColor }]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function CreateCoordinatorScreen() {
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

  const updateField = (key: keyof Form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Errors = {};

    if (!form.document.trim()) {
      nextErrors.document = t('users.errors.requiredField');
    } else if (!/^\d{6,15}$/.test(form.document.trim())) {
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

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const password = generateTemporaryPassword();

    try {
      await createManagedUser({
        numberDocument: form.document.trim(),
        firstName: form.name.trim(),
        lastName: form.lastname.trim(),
        email: form.email.trim(),
        password,
        role: 'COORDINATOR',
      });

      setCreatedPassword(password);
      setPasswordVisible(true);
      alert(
        'Coordinador creado',
        `Usuario coordinador creado correctamente. La contraseÃ±a inicial es: ${password}. Entregarla al usuario para que inicie sesiÃ³n.`,
        [{ text: t('common.ok') }],
      );
    } catch (error: any) {
      alert(
        t('common.error'),
        error?.response?.data?.message || 'No se pudo crear el coordinador.',
        [{ text: t('common.ok') }],
      );
    }
  };

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
            <Text style={[styles.title, { color: text }]}>Crear Coordinador</Text>
            <Text style={[styles.subtitle, { color: muted }]}>Registro exclusivo del coordinador</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('register.sections.personal')}</Text>

          <Field
            label={t('users.document')}
            value={form.document}
            onChange={updateField('document')}
            placeholder="0000000000"
            keyboard="numeric"
             maxLength={15}
            error={errors.document}
            labelColor={theme.primary}
            textColor={text}
            mutedColor={muted}
            borderColor={border}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label={t('users.firstName')}
                value={form.name}
                onChange={updateField('name')}
                error={errors.name}
                labelColor={theme.primary}
                textColor={text}
                mutedColor={muted}
                borderColor={border}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t('users.lastName')}
                value={form.lastname}
                onChange={updateField('lastname')}
                error={errors.lastname}
                labelColor={theme.primary}
                textColor={text}
                mutedColor={muted}
                borderColor={border}
              />
            </View>
          </View>

          <Field
            label={t('register.email')}
            value={form.email}
            onChange={updateField('email')}
            placeholder="correo@ejemplo.com"
            keyboard="email-address"
            error={errors.email}
            labelColor={theme.primary}
            textColor={text}
            mutedColor={muted}
            borderColor={border}
          />

          <View style={[styles.note, { backgroundColor: softAmber, borderColor: Colors.warning + '40' }]}>
            <Ionicons name="key-outline" size={14} color={Colors.warning} />
            <Text style={[styles.noteText, { color: Colors.warning }]}>
              El sistema asigna el rol de Coordinador y genera la contraseña temporal para su primer inicio de sesión.
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
            </View>
          ) : null}

          <View style={[styles.note, { backgroundColor: softBlue, borderColor: theme.info + '40' }]}>
            <Ionicons name="lock-closed-outline" size={14} color={theme.info} />
            <Text style={[styles.noteText, { color: theme.info }]}>
              El documento se conserva como dato de identificación y la contraseña solo se muestra durante la creación de la cuenta.
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
              <Text style={styles.submitBtnText}>Crear Coordinador</Text>
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
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  passwordBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  passwordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passwordTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  passwordAction: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  passwordValue: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginTop: 10 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 11 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  submitBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
});
