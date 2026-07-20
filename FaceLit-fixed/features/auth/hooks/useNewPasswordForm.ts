// ─────────────────────────────────────────────
//  features/auth/hooks/useNewPasswordForm.ts
// ─────────────────────────────────────────────
import { resetPassword } from '@/shared/services/passwordRecoveryService';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,15}$/;

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

export function useNewPasswordForm() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string; email?: string }>();

  const [password, setPasswordValue]               = useState('');
  const [confirmPassword, setConfirmPasswordValue]  = useState('');
  const [errors, setErrors]                         = useState<Record<string, string>>({});
  const [loading, setLoading]                       = useState(false);
  const [showSuccess, setShowSuccess]               = useState(false);

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

  const handleSubmit = async () => {
    const e: Record<string, string> = {};

    if (!password)                           e.password = t('newPassword.errors.passwordRequired');
    else if (!PASSWORD_REGEX.test(password)) e.password = t('newPassword.errors.passwordInvalid');

    if (!confirmPassword)                  e.confirm = t('newPassword.errors.confirmRequired');
    else if (password !== confirmPassword) e.confirm = t('newPassword.errors.confirmMismatch');

    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!token) {
      setErrors({ password: 'No se encontró el código de verificación' });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password, confirmPassword);
      setShowSuccess(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo restablecer la contraseña';
      // El backend puede responder "Código incorrecto" o "Código vencido" —
      // se lo mostramos junto al campo de contraseña ya que no hay campo de código aquí
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // El history.back de expo-router funciona bien aquí, no hace falta ruta fija
  };

  return {
    password,
    confirmPassword,
    errors,
    requirements,
    loading,
    showSuccess,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    handleBack,
  };
}