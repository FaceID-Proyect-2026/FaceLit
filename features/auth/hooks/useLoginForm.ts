// ─────────────────────────────────────────────
//  features/auth/hooks/useLoginForm.ts
//  Lógica del formulario de login separada
//  de la pantalla (clean code)
// ─────────────────────────────────────────────
import { hasAcceptedPrivacy } from '@/features/auth/privacyAcceptanceStore';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Routes } from '@/shared/constants/routes';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const EMAIL_REGEX            = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_ALLOWED_REGEX    = /^[A-Za-z0-9._%+\-@]+$/;
const PASSWORD_ALLOWED_REGEX = /^[A-Za-z0-9!@#$%^&*(),.?":{}|<>_\-+=]+$/;

interface LoginForm {
  email: string;
  password: string;
  accepted: boolean;
}

interface LoginErrors {
  email: string;
  password: string;
  policy: string;
}

const initialForm: LoginForm = {
  email: '',
  password: '',
  accepted: false,
};

const initialErrors: LoginErrors = {
  email: '',
  password: '',
  policy: '',
};

export function useLoginForm() {
  const { t } = useTranslation();
  const { login, user, isAuthenticated } = useAuth();

  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<LoginErrors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [privacyAlreadyAccepted, setPrivacyAlreadyAccepted] = useState(false);

  useEffect(() => {
    if (EMAIL_REGEX.test(form.email.trim())) {
      setPrivacyAlreadyAccepted(hasAcceptedPrivacy(form.email));
    }
  }, [form.email]);

  // Redirige a cada rol a su panel SOLO después de que React confirmó
  // el nuevo estado de sesión (isAuthenticated/user), nunca antes. Esto
  // evita la condición de carrera de navegar mientras el contexto
  // todavía tiene el valor anterior (lo que producía errores
  // intermitentes al iniciar sesión).
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === 'administrador') router.replace(Routes.ADMIN.DASHBOARD as any);
    else if (user.role === 'instructor') router.replace('/instructor' as any);
    else if ((user.role as string) === 'coordinador') router.replace(Routes.COORDINATOR.DASHBOARD as any);
    else router.replace('/apprentice' as any);
  }, [isAuthenticated, user]);

  const setField = <K extends keyof LoginForm>(
    key: K,
    value: LoginForm[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    if (key === 'email' && !EMAIL_REGEX.test(String(value).trim())) {
      setPrivacyAlreadyAccepted(false);
    }
  };

  const validate = (): LoginErrors => {
    const e = { ...initialErrors };
    const cleanEmail = form.email.trim();

    if (!cleanEmail)
      e.email = t('login.errors.emptyEmail');
    else if (/\s/.test(form.email))
      e.email = t('login.errors.noSpaces');
    else if (!EMAIL_ALLOWED_REGEX.test(cleanEmail))
      e.email = t('login.errors.invalidChars');
    else if (!cleanEmail.includes('@'))
      e.email = t('login.errors.invalidEmail');
    else if (!EMAIL_REGEX.test(cleanEmail))
      e.email = t('login.errors.invalidEmail');

    if (!form.password)
      e.password = t('login.errors.emptyPassword');
    else if (form.password.length < 6)
      e.password = t('login.errors.passwordShort');
    else if (form.password.length > 20)
      e.password = t('login.errors.passwordLong');

    if (!privacyAlreadyAccepted && !form.accepted)
      e.policy = t('login.policyError');

    return e;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (nextErrors.email || nextErrors.password || nextErrors.policy) return;

    setLoading(true);
    const result = await login(form.email.trim(), form.password);
    setLoading(false);

    if (!result.success && result.error) {
      if (result.error.includes('correo') || result.error.includes('registrado')) {
        setErrors(prev => ({ ...prev, email: result.error! }));
      } else {
        setErrors(prev => ({ ...prev, password: result.error! }));
      }
    }
  };

  return {
    form,
    errors,
    loading,
    setField,
    handleSubmit,
    privacyAlreadyAccepted,
  };
}