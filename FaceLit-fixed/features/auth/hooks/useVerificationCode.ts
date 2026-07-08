// ─────────────────────────────────────────────
//  features/auth/hooks/useVerificationCode.ts
//  Lógica de verificación por código (OTP) —
//  reutilizada por email-validation.tsx y
//  verify-identity.tsx, que comparten el mismo
//  patrón: temporizador, reenvío y validación.
// ─────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_TIME = 5 * 60; // 5 minutos

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface UseVerificationCodeParams {
  /** Prefijo de las claves i18n de error, ej: 'emailValidation' o 'verifyIdentity' */
  namespace: string;
  /** Código correcto simulado (mock del backend) */
  codeMock: string;
  /** Duración inicial del temporizador, en segundos */
  initialTime?: number;
  /** Si el código expirado debe bloquear la verificación (email-validation lo usa, verify-identity no) */
  checkExpired?: boolean;
  /** Qué hacer cuando el código es correcto */
  onVerified: () => void;
}

export function useVerificationCode({
  namespace,
  codeMock,
  initialTime = DEFAULT_TIME,
  checkExpired = false,
  onVerified,
}: UseVerificationCodeParams) {
  const { t } = useTranslation();

  const [code, setCodeValue]     = useState('');
  const [timeLeft, setTimeLeft]  = useState(initialTime);
  const [expired, setExpired]    = useState(false);
  const [error, setError]        = useState('');

  useEffect(() => {
    if (timeLeft <= 0) {
      if (checkExpired) setExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, checkExpired]);

  const setCode = (v: string) => {
    setCodeValue(v.replace(/\D/g, ''));
    setError('');
  };

  const handleResend = () => {
    setCodeValue('');
    setError('');
    setExpired(false);
    setTimeLeft(initialTime);
  };

  const handleVerify = () => {
    if (checkExpired && expired) {
      setError(t(`${namespace}.errors.expired`));
      return;
    }
    if (code.length !== 6) {
      setError(t(`${namespace}.errors.length`));
      return;
    }
    if (code !== codeMock) {
      setError(t(`${namespace}.errors.invalid`));
      return;
    }
    setError('');
    onVerified();
  };

  return {
    code,
    setCode,
    timeLeft,
    expired,
    error,
    setError,
    handleResend,
    handleVerify,
  };
}