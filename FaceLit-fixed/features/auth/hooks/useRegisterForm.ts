// ─────────────────────────────────────────────
//  features/auth/hooks/useRegisterForm.ts
//  Lógica del formulario de registro separada
//  de la pantalla (clean code) — misma
//  convención que useLoginForm.ts
//  ahora conectada al backend real
// ─────────────────────────────────────────────
import { Routes } from '@/shared/constants/routes';
import { getRegistrationStatus, registerUser } from '@/shared/services/authService';
import { getDocumentTypes } from '@/shared/services/catalogService';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ── Regex de validación ────────────────────────
const ONLY_LETTERS = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]).{8,15}$/;

export const IDENTITY_VALUES = ['TI', 'CC', 'CE', 'PA'] as const;
export type IdentityType = typeof IDENTITY_VALUES[number];

interface RegisterForm {
  name: string;
  lastname: string;
  identityType: string;
  document: string;
  email: string;
  password: string;
}

interface DocumentTypeOption {
  idDocumentType: string;
  name: string;
  abbreviation: string;
}

const initialForm: RegisterForm = {
  name: '', lastname: '', identityType: '',
  document: '', email: '', password: '',
};

const initialErrors: Record<string, string> = {
  name: '', lastname: '', identityType: '', document: '',
  email: '', emailAction: '', password: '', confirmPassword: '',
  birthdate: '', policy: '', rights: '',
};

// ── Helpers de negocio (puros, sin JSX) ────────
export function getAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function liveValidate(key: string, value: string, t: (k: string) => string): string {
  switch (key) {
    case 'name':
    case 'lastname':
      if (!value) return '';
      if (!ONLY_LETTERS.test(value)) return t('register.errors.onlyLetters');
      return value.length >= 2 ? '✓' : '';
    case 'document':
      if (!value) return '';
      if (value.length < 10) return t('register.errors.documentLength');
      return '✓';
    case 'email':
      if (!value) return '';
      if (!EMAIL_REGEX.test(value)) return t('register.errors.emailInvalid');
      return '✓';
    case 'password':
      if (!value) return '';
      if (!PASSWORD_REGEX.test(value)) return t('register.errors.passwordWeak');
      return '✓';
    default:
      return '';
  }
}

interface UseRegisterFormParams {
  /** Correo ya validado que llega desde la pantalla de verificación (query param) */
  validatedEmail?: string;
}

export function useRegisterForm({ validatedEmail }: UseRegisterFormParams) {
  const { t } = useTranslation();

  const [form, setForm] = useState<RegisterForm>({ ...initialForm, email: validatedEmail ?? '' });
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [hasRights, setHasRights] = useState<boolean | null>(null);
  const [emailValidated, setEmailValidated] = useState(!!validatedEmail);
  const [errors, setErrors] = useState(initialErrors);
  const [hints, setHints] = useState<Record<string, string>>({});
  const [confirmPassword, setConfirmPasswordState] = useState('');
  const [duplicateAccount, setDuplicateAccount] = useState(false); // ← NUEVO, junto a los demás useState

  // ── Catálogo de tipos de documento (viene del backend) ──
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDocumentTypes()
      .then(setDocumentTypes)
      .catch(() => console.warn('No se pudieron cargar los tipos de documento'));
  }, []);

  const identityOptions = documentTypes.map(dt => ({
    value: dt.abbreviation,
    label: t(`register.identity${dt.abbreviation}`),
  }));

  const clearError = (k: string) => setErrors(p => ({ ...p, [k]: '' }));

  const setField = (key: keyof RegisterForm, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    clearError(key);
    setHints(p => ({ ...p, [key]: liveValidate(key, value, t) }));
  };

  const setConfirmPassword = (value: string) => {
    setConfirmPasswordState(value);
    clearError('confirmPassword');
  };

  const handleEmail = (v: string) => {
    const val = v.replace(/\s/g, '');
    setForm(p => ({ ...p, email: val }));
    setEmailValidated(false);
    clearError('email');
    clearError('emailAction');
    setHints(p => ({ ...p, email: liveValidate('email', val, t) }));
  };

  const handleIdentity = (value: string) => {
    setForm(p => ({ ...p, identityType: value }));
    clearError('identityType');
  };

  const setBirthdateValue = (date: Date) => {
    setBirthdate(date);
    clearError('birthdate');
  };

  const handleRegister = async () => {
    const e = { ...initialErrors };
    const d = { ...form, name: form.name.trim(), lastname: form.lastname.trim(), email: form.email.trim() };

    if (!d.name) e.name = t('register.errors.nameRequired');
    else if (!ONLY_LETTERS.test(d.name)) e.name = t('register.errors.onlyLetters');

    if (!d.lastname) e.lastname = t('register.errors.lastnameRequired');
    else if (!ONLY_LETTERS.test(d.lastname)) e.lastname = t('register.errors.onlyLetters');

    if (!d.identityType) e.identityType = t('register.errors.identityRequired');

    if (!d.document) e.document = t('register.errors.documentRequired');
    else if (d.document.length !== 10) e.document = t('register.errors.documentLength');

    if (!d.email) e.email = t('register.errors.emailRequired');
    else if (!EMAIL_REGEX.test(d.email)) e.email = t('register.errors.emailInvalid');

    if (!d.password) e.password = t('register.errors.passwordRequired');
    else if (!PASSWORD_REGEX.test(d.password)) e.password = t('register.errors.passwordWeak');

    if (hasRights === null) e.rights = t('register.errors.rightsRequired');
    else if (hasRights === false) e.rights = t('register.errors.rightsDeclined');

    if (!confirmPassword) {
      e.confirmPassword = t('register.errors.confirmPasswordRequired') ?? 'Confirma tu contraseña';
    } else if (confirmPassword !== d.password) {
      e.confirmPassword = t('register.errors.passwordMismatch') ?? 'Las contraseñas no coinciden';
    }

    if (!birthdate) {
      e.birthdate = t('register.errors.birthdateRequired');
    } else {
      const age = getAge(birthdate);
      if (age < 8) e.birthdate = t('register.errors.ageMin');
      else if (age > 100) e.birthdate = t('register.errors.ageMax');
      else if (d.identityType === 'TI' && age >= 18) e.identityType = t('register.errors.tiAdult');
      else if (d.identityType === 'CC' && age < 18) e.identityType = t('register.errors.ccMinor');
    }

    if (!accepted) e.policy = t('register.errors.policyRequired');
    if (hasRights === null) e.rights = t('register.errors.rightsRequired');
    else if (hasRights === false) e.rights = t('register.errors.rightsDeclined');

    setErrors(e);
    if (Object.values(e).some(v => v !== '')) return;

    const docType = documentTypes.find(dt => dt.abbreviation === d.identityType);
    if (!docType) {
      setErrors(prev => ({ ...prev, identityType: 'No se pudo validar el tipo de documento' }));
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        idDocumentType: docType.idDocumentType,
        firstName: d.name,
        lastName: d.lastname,
        documentNumber: d.document,
        birthDate: formatDate(birthdate!),
        email: d.email,
        password: d.password,
        accepted: accepted,
      });

      router.push({
        pathname: Routes.AUTH.EMAIL_VALIDATION as any,
        params: { idUser: result.id_user, email: d.email },
      });

    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo completar el registro';
      const isDuplicate = message.includes('ya esta registrado') || message.includes('ya está registrado');

      if (isDuplicate) {
        try {
          const status = await getRegistrationStatus(d.document, d.email);
          // 1. Falta verificar el email
          if (!status.emailVerified) {
            router.replace({
              pathname: Routes.AUTH.EMAIL_VALIDATION as any,
              params: { idUser: status.idUser, email: d.email },
            });
            return;
          }

          if (status.isMinor && status.accountStatus !== 'ACTIVE') {
            if (!status.consentStatus) {
              router.replace({
                pathname: Routes.AUTH.MINOR_CONSENT as any,
                params: { idUser: status.idUser, minorEmail: d.email },
              });
              return;
            }
            if (status.consentStatus === 'PENDING') {
              router.replace({
                pathname: '/auth/guardian-verification' as any,
                params: { idUser: status.idUser, guardianEmail: status.guardianEmail },
              });
              return;
            }
          }

          router.replace(Routes.AUTH.TEENAGER_REGISTRATION as any);
          return;

        } catch (statusError) {
          setErrors(prev => ({ ...prev, policy: 'Ya existe una cuenta con estos datos, pero no pudimos verificar en qué paso quedó.' }));
          return;
        }
      }

      if (message.includes('documento')) {
        setErrors(prev => ({ ...prev, document: message }));
      } else if (message.toLowerCase().includes('email') || message.toLowerCase().includes('correo')) {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (message.includes('Tarjeta de Identidad') || message.includes('Cedula')) {
        setErrors(prev => ({ ...prev, identityType: message }));
      } else {
        setErrors(prev => ({ ...prev, policy: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setBirthdate(null);
    setConfirmPasswordState('');
    setErrors(initialErrors);
    setHints({});
    setAccepted(false);
    setHasRights(null);
    setDuplicateAccount(false); // ← NUEVO — limpia el estado también al cancelar
    router.replace(Routes.AUTH.LOGIN as any);
  };

  const hintColor = (key: string, primaryColor: string, errorColor: string) =>
    hints[key] === '✓' ? primaryColor : errorColor;

  return {
    // datos
    form,
    birthdate,
    accepted,
    hasRights,
    emailValidated,
    errors,
    hints,
    confirmPassword,
    identityOptions,
    loading,
    duplicateAccount, // ← NUEVO

    // acciones
    setField,
    setConfirmPassword,
    handleEmail,
    handleIdentity,
    setBirthdate: setBirthdateValue,
    setAccepted,
    setHasRights,
    handleRegister,
    handleCancel,
    hintColor,
  };
}