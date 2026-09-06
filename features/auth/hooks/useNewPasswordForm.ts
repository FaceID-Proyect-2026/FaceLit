// ─────────────────────────────────────────────
//  features/auth/hooks/useNewPasswordForm.ts
//  Lógica del formulario de nueva contraseña
//  separada de la pantalla (clean code) — misma
//  convención que useLoginForm / useRegisterForm
// ─────────────────────────────────────────────
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,15}$/;

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

export function useNewPasswordForm() {
  const { t } = useTranslation();

  const [password, setPasswordValue]               = useState('');
  const [confirmPassword, setConfirmPasswordValue]  = useState('');
  const [errors, setErrors]                         = useState<Record<string, string>>({});

  // ── Requisitos de contraseña (regla de negocio) ──
  const requirements: PasswordRequirement[] = [
    { key: 'length', label: t('newPassword.req.length'), met: password.length >= 8 && password.length <= 15 },
    { key: 'upper',  label: t('newPassword.req.upper'),  met: /[A-Z]/.test(password) },
    { key: 'lower',  label: t('newPassword.req.lower'),  met: /[a-z]/.test(password) },
    { key: 'number', label: t('newPassword.req.number'), met: /\d/.test(password) },
    { key: 'symbol', label: t('newPassword.req.symbol'), met: /[!@#$%^&*(),.?":{}|<>_\-+=]/.test(password) },
  ];

  const setPassword = (v: string) => {
    setPasswordValue(v);
    setErrors(p => ({ ...p, password: '' }));
  };

  const setConfirmPassword = (v: string) => {
    setConfirmPasswordValue(v);
    setErrors(p => ({ ...p, confirm: '' }));
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};

    if (!password)                          e.password = t('newPassword.errors.passwordRequired');
    else if (!PASSWORD_REGEX.test(password)) e.password = t('newPassword.errors.passwordInvalid');

    if (!confirmPassword)                   e.confirm = t('newPassword.errors.confirmRequired');
    else if (password !== confirmPassword)  e.confirm = t('newPassword.errors.confirmMismatch');

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    router.push('/auth/password-reset-done');
  };

  const handleBack = () => router.push('/auth/verify-identity');

  return {
    password,
    confirmPassword,
    errors,
    requirements,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    handleBack,
  };
}
