// ─────────────────────────────────────────────
//  features/auth/hooks/useLoginForm.ts
//  Lógica del formulario de login separada
//  de la pantalla (clean code)
// ─────────────────────────────────────────────
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/contexts/AuthContext';

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
  const { login } = useAuth();

  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<LoginErrors>(initialErrors);
  const [loading, setLoading] = useState(false);

  const setField = <K extends keyof LoginForm>(
    key: K,
    value: LoginForm[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
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

    if (!form.accepted)
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
  };
}