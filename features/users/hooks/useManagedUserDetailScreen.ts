import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { getManagedUser, updateManagedUser } from '@/shared/services/userManagementService';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ManagedUserDetail,
  FormState,
  FormErrors,
  EMPTY_FORM,
  LETTERS_ONLY,
} from '@/features/users/components/ManagedUserDetailSupport';

export function useManagedUserDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [base, setBase] = useState<ManagedUserDetail | null | undefined>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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
  const isInactive = base?.accountStatus === 'INACTIVE';

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
    } catch {
      alert(t('common.error'), t('users.saveError'), [
        { text: t('common.ok') },
      ]);
    }
  };

    return {
    theme,
    t,
    i18n,
    alert,
    DialogUI,
    base,
    setBase,
    form,
    errors,
    loading,
    updatingStatus,
    setUpdatingStatus,
    text,
    muted,
    bg,
    card,
    border,
    role,
    isCoordinator,
    isInstructor,
    isApprentice,
    isInactive,
    roleColor,
    updateField,
    handleSave,
  };
}
