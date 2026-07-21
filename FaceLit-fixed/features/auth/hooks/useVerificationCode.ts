import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DEFAULT_TIME = 5 * 60; // 5 minutos — duración del código y cooldown del botón

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface UseVerificationCodeParams {
  namespace: string;
  initialTime?: number;
  checkExpired?: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export function useVerificationCode({
  namespace,
  initialTime = DEFAULT_TIME,
  checkExpired = false,
  onVerify,
  onResend,
}: UseVerificationCodeParams) {
  const { t } = useTranslation();

  const [code, setCodeValue]     = useState('');
  const [timeLeft, setTimeLeft]  = useState(initialTime);
  const [expired, setExpired]    = useState(false);
  const [error, setError]        = useState('');
  const [loading, setLoading]    = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (checkExpired) setExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, checkExpired]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const setCode = (v: string) => {
    setCodeValue(v.replace(/\D/g, ''));
    setError('');
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    setError('');
    try {
      await onResend();
      setCodeValue('');
      setExpired(false);
      setTimeLeft(initialTime);      // reinicia el temporizador de expiración del código
      setResendCooldown(initialTime); // el botón queda bloqueado los mismos 5 minutos
    } catch (err: any) {
      setError(err.response?.data?.message || t(`${namespace}.errors.resendFailed`) || 'No se pudo reenviar el código');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (checkExpired && expired) {
      setError(t(`${namespace}.errors.expired`));
      return;
    }
    if (code.length !== 6) {
      setError(t(`${namespace}.errors.length`));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.response?.data?.message || t(`${namespace}.errors.invalid`));
    } finally {
      setLoading(false);
    }
  };

  return {
    code, setCode, timeLeft, expired, error,
    loading, resending, resendCooldown,
    handleResend, handleVerify,
  };
}