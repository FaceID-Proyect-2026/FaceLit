// ─────────────────────────────────────────────
//  features/auth/hooks/useNewPasswordForm.ts
//
//  RF-1.5 / RF-1 V4 §6 — Nueva contraseña (restablecimiento)
//  · 8–15 caracteres
//  · Al menos 1 letra, 1 número y 1 símbolo
//  · Sin espacios
//  · Ambos campos obligatorios e idénticos (case-sensitive)
//  · Validación de complejidad EN TIEMPO REAL (indicadores visuales)
//  · Prevención de doble submit (RF-1 V4 §7)
//  · Mensajes exactos de RF-1 V4 §6
//  · Auditoría (RNF-1.8)
// ─────────────────────────────────────────────
import { logFailure, logSuccess } from '@/shared/services/auditLogger';
import { resetPassword } from '@/shared/services/passwordRecoveryService';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// RF-1 V4 §6 + RNF-1.2: 8–15 chars, ≥1 letra (mayúscula o minúscula), ≥1 dígito, ≥1 símbolo, sin espacios
const HAS_LETTER   = /[a-zA-Z]/;
const HAS_NUMBER   = /\d/;
const HAS_SYMBOL   = /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/;
const HAS_SPACE    = /\s/;
const MIN_LEN = 8;
const MAX_LEN = 15;

export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

export function useNewPasswordForm() {
  const { t } = useTranslation();
  const { token, email } = useLocalSearchParams<{ token: string; email?: string }>();

  const [password, setPasswordValue]              = useState('');
  const [confirmPassword, setConfirmPasswordValue] = useState('');
  const [errors, setErrors]                        = useState<Record<string, string>>({});
  const [loading, setLoading]                      = useState(false);
  const [showSuccess, setShowSuccess]              = useState(false);

  // Prevención de doble submit — RF-1 V4 §7
  const submittingRef = useRef(false);

  // ── Indicadores de requisitos en tiempo real ──
  const requirements: PasswordRequirement[] = [
    {
      key: 'length',
      label: t('newPassword.req.length'),
      met: password.length >= MIN_LEN && password.length <= MAX_LEN,
    },
    {
      key: 'letter',
      label: t('newPassword.req.letter'),
      met: HAS_LETTER.test(password),
    },
    {
      key: 'number',
      label: t('newPassword.req.number'),
      met: HAS_NUMBER.test(password),
    },
    {
      key: 'symbol',
      label: t('newPassword.req.symbol'),
      met: HAS_SYMBOL.test(password),
    },
    {
      key: 'noSpaces',
      label: t('newPassword.req.noSpaces'),
      met: password.length > 0 && !HAS_SPACE.test(password),
    },
  ];

  const setPassword = (v: string) => {
    setPasswordValue(v);
    setErrors(p => ({ ...p, password: '' }));
  };

  const setConfirmPassword = (v: string) => {
    setConfirmPasswordValue(v);
    setErrors(p => ({ ...p, confirm: '' }));
  };

  // ── Validación completa al submit ─────────────
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};

    // Nueva contraseña
    if (!password) {
      e.password = t('newPassword.errors.passwordRequired');
    } else if (HAS_SPACE.test(password)) {
      e.password = t('newPassword.errors.noSpaces');
    } else if (password.length < MIN_LEN || password.length > MAX_LEN) {
      e.password = t('newPassword.errors.passwordLength');
    } else if (!HAS_LETTER.test(password) || !HAS_NUMBER.test(password) || !HAS_SYMBOL.test(password)) {
      e.password = t('newPassword.errors.passwordWeak');
    }

    // Confirmar contraseña
    if (!confirmPassword) {
      e.confirm = t('newPassword.errors.confirmRequired');
    } else if (password !== confirmPassword) {
      e.confirm = t('newPassword.errors.confirmMismatch');
    }

    return e;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (!token) {
      setErrors({ code: t('newPassword.errors.tokenMissing') });
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      await resetPassword(token, password, confirmPassword, email);
      logSuccess('PASSWORD_RESET_SUCCESS');
      setShowSuccess(true);
    } catch (error: any) {
      const status: number = error.response?.status ?? 0;
      const backendMsg: string = error.response?.data?.message ?? '';

      logFailure('PASSWORD_RESET_FAILED', { detail: backendMsg });

      // ── Token expirado o ya usado (backend) ──
      if (
        status === 410 ||
        backendMsg.toLowerCase().includes('expir') ||
        backendMsg.toLowerCase().includes('vencid')
      ) {
        setErrors({ code: t('newPassword.errors.tokenExpired') });
        return;
      }

      if (
        status === 409 ||
        backendMsg.toLowerCase().includes('utilizado') ||
        backendMsg.toLowerCase().includes('used')
      ) {
        setErrors({ code: t('newPassword.errors.tokenUsed') });
        return;
      }

      // ── Error de red / servidor ──
      if (status >= 500 || status === 0) {
        setErrors({ code: t('newPassword.errors.serverError') });
        return;
      }

      setErrors({ code: backendMsg || t('newPassword.errors.genericError') });
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
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
  };
}
