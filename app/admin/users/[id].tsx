import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { getManagedUser, updateManagedUser } from '@/shared/services/userManagementService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

type ManagedUserDetail = {
  userId: string;
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  sessionStatus?: string;
  sessionExpiresAt?: string;
  hasSession?: boolean;
  chipCode?: string | null;
  programName?: string | null;
  instructorChipCodes?: string[];
  instructorProgramNames?: string[];
};

type FormState = {
  document: string;
  firstName: string;
  lastName: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { document: '', firstName: '', lastName: '', email: '' };
const LETTERS_ONLY = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

function normalizeDate(value?: string | null, emptyLabel = 'Sin registro') {
  if (!value) return emptyLabel;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function roleLabel(role: string | undefined, t: (key: any) => string) {
  if (role === 'COORDINATOR') return t('users.roles.COORDINATOR');
  if (role === 'INSTRUCTOR') return t('users.roles.INSTRUCTOR');
  if (role === 'APPRENTICE') return t('users.roles.APPRENTICE');
  return role || t('users.detail.noRole');
}

function PillList({ items, empty, color }: { items?: string[]; empty: string; color: string }) {
  const uniqueItems = [...new Set((items ?? []).filter(Boolean))];
  if (!uniqueItems.length) {
    return <Text style={[styles.infoText, { color }]}>{empty}</Text>;
  }

  return (
    <View style={styles.pillList}>
      {uniqueItems.map((item) => (
        <View key={item} style={[styles.smallPill, { borderColor: color + '55', backgroundColor: color + '12' }]}>
          <Text style={[styles.smallPillText, { color }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function UserDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [base, setBase] = useState<ManagedUserDetail | null | undefined>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const card = theme.surface;
  const border = theme.border;

  useEffect(() => {
    if (!id) return;
    getManagedUser(id)
      .then((data: ManagedUserDetail) => {
        setBase(data);
        setForm({
          document: data.documentNumber ?? '',
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          email: data.email ?? '',
        });
      })
      .catch(() => setBase(undefined))
      .finally(() => setLoading(false));
  }, [id]);

  const role = base?.role;
  const isCoordinator = role === 'COORDINATOR';
  const isInstructor = role === 'INSTRUCTOR';
  const isApprentice = role === 'APPRENTICE';

  const roleColor = useMemo(() => {
    if (isInstructor) return theme.info;
    if (isApprentice) return Colors.warning;
    return theme.primary;
  }, [isApprentice, isInstructor, theme.info, theme.primary]);

  const updateField = (key: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!/^\d{6,15}$/.test(form.document.trim())) {
      nextErrors.document = t('register.errors.documentLength');
    }
    if (!form.firstName.trim()) {
      nextErrors.firstName = t('users.errors.requiredField');
    } else if (!LETTERS_ONLY.test(form.firstName.trim())) {
      nextErrors.firstName = t('users.errors.lettersOnlyName');
    }
    if (!form.lastName.trim()) {
      nextErrors.lastName = t('users.errors.requiredField');
    } else if (!LETTERS_ONLY.test(form.lastName.trim())) {
      nextErrors.lastName = t('users.errors.lettersOnlyLastName');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t('register.errors.emailInvalid');
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!base || !validate()) return;

    try {
      const updated = await updateManagedUser(base.userId, {
        numberDocument: form.document.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        accountStatus: base.accountStatus,
        role: base.role,
      });
      setBase(updated);
      alert(t('common.save'), t('users.detail.saveSuccess'), [{ text: t('common.ok') }]);
    } catch (error: any) {
      alert(t('common.error'), error?.response?.data?.message || t('users.saveError'), [
        { text: t('common.ok') },
      ]);
    }
  };

  if (loading) return <View style={[styles.root, { backgroundColor: bg }]} />;

  if (!base) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: bg }]}>
        <Ionicons name="alert-circle-outline" size={40} color={muted} />
        <Text style={[styles.notFound, { color: muted }]}>{t('users.errors.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { borderColor: border }]}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: card, borderColor: border }]}
          >
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: text }]} numberOfLines={1}>
              {form.firstName} {form.lastName}
            </Text>
            <Text style={[styles.subtitle, { color: muted }]}>{t('users.detail.title')}</Text>
          </View>
        </View>

        <View style={[styles.banner, { backgroundColor: roleColor + '18', borderColor: roleColor + '35' }]}>
          <View style={[styles.bannerAvatar, { backgroundColor: roleColor }]}>
            <Text style={styles.bannerAvatarText}>{form.firstName.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerName, { color: text }]}>{form.firstName} {form.lastName}</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
              <Text style={[styles.rolePillText, { color: roleColor }]}>{roleLabel(role, t)}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: theme.successSoft }]}>
            <View style={[styles.statusDot, { backgroundColor: base.accountStatus === 'ACTIVE' ? Colors.success : muted }]} />
            <Text style={[styles.statusText, { color: base.accountStatus === 'ACTIVE' ? Colors.success : muted }]}>
              {base.accountStatus === 'ACTIVE' ? t('users.statuses.ACTIVE') : t('users.statuses.INACTIVE')}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.personalData')}</Text>
          <View style={styles.row}>
            <Field
              label={t('users.document')}
              value={form.document}
              onChange={updateField('document')}
              error={errors.document}
              keyboard="numeric"
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
            <Field
              label={t('register.email')}
              value={form.email}
              onChange={updateField('email')}
              error={errors.email}
              keyboard="email-address"
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
          </View>
          <View style={styles.row}>
            <Field
              label={t('users.firstName')}
              value={form.firstName}
              onChange={updateField('firstName')}
              error={errors.firstName}
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
            <Field
              label={t('users.lastName')}
              value={form.lastName}
              onChange={updateField('lastName')}
              error={errors.lastName}
              textColor={text}
              mutedColor={muted}
              borderColor={border}
              labelColor={theme.primary}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.session')}</Text>
          <Text style={[styles.infoText, { color: muted }]}>
            {t('users.detail.sessionStatus', {
              status: base.sessionStatus === 'ACTIVE' ? t('users.detail.sessionActive') : t('users.detail.sessionInactive'),
            })}
          </Text>
          <Text style={[styles.infoText, { color: muted }]}>
            {t('users.detail.sessionExpires', { date: normalizeDate(base.sessionExpiresAt, t('users.detail.noDate')) })}
          </Text>
          <Text style={[styles.infoText, { color: muted }]}>
            {t('users.detail.hasLoggedIn', { value: base.hasSession ? t('common.yes') : t('common.no') })}
          </Text>
        </View>

        {isApprentice ? (
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.academicData')}</Text>
            <Text style={[styles.infoText, { color: muted }]}>
              {t('users.detail.fichaLabel', { ficha: base.chipCode || t('users.noFichaActive') })}
            </Text>
            <Text style={[styles.infoText, { color: muted }]}>
              {t('users.detail.programLabel', { program: base.programName || t('users.noProgram') })}
            </Text>
          </View>
        ) : null}

        {isInstructor ? (
          <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.section, { color: theme.primary }]}>{t('users.detail.academicData')}</Text>
            <Text style={[styles.infoLabel, { color: text }]}>{t('users.detail.assignedPrograms')}</Text>
            <PillList items={base.instructorProgramNames} empty={t('users.detail.noAssignedPrograms')} color={theme.primary} />
            <Text style={[styles.infoLabel, { color: text }]}>{t('users.detail.relatedFichas')}</Text>
            <PillList items={base.instructorChipCodes} empty={t('users.detail.noRelatedFichas')} color={theme.info} />
          </View>
        ) : null}

        {isCoordinator ? (
          <View style={[styles.note, { backgroundColor: theme.infoSoft, borderColor: theme.info + '40' }]}>
            <Ionicons name="information-circle-outline" size={14} color={theme.info} />
            <Text style={[styles.noteText, { color: theme.info }]}>
              {t('users.detail.coordinatorNote')}
            </Text>
          </View>
        ) : null}

        <View style={styles.formActions}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
            <Text style={{ color: muted, fontWeight: '600' }}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="save-outline" size={16} color={Colors.white} />
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {DialogUI}
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  keyboard,
  textColor,
  mutedColor,
  borderColor,
  labelColor,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  keyboard?: 'default' | 'email-address' | 'numeric';
  textColor: string;
  mutedColor: string;
  borderColor: string;
  labelColor: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: labelColor }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={mutedColor}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        style={[styles.field, { color: textColor, borderColor: error ? Colors.error : borderColor }]}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 18, paddingBottom: 40, gap: 12 },
  notFound: { fontSize: FontSize.md, marginTop: 12 },
  backBtnCenter: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  bannerAvatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bannerAvatarText: { color: Colors.white, fontWeight: '900', fontSize: 18 },
  bannerName: { fontSize: 15, fontWeight: '800' },
  rolePill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
  rolePillText: { fontSize: FontSize.xs, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  section: { fontSize: FontSize.xs, fontWeight: '900', textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 10 },
  fieldWrap: { flex: 1, gap: 5 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  fieldError: { color: Colors.error, fontSize: FontSize.xs, marginTop: 2 },
  infoText: { fontSize: FontSize.sm },
  infoLabel: { fontSize: FontSize.sm, fontWeight: '800' },
  pillList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  smallPillText: { fontSize: FontSize.xs, fontWeight: '800' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  cancelBtn: { paddingHorizontal: 8, paddingVertical: 11 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  saveBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
});
