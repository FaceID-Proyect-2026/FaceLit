// ─────────────────────────────────────────────
//  features/auth/hooks/useVerificationCode.ts
//
//  RF-1.5 / RF-1 V4 §5 — Código de verificación
//  · Exactamente 6 dígitos numéricos
//  · Tiempo de vigencia: 5 minutos (300 s)
//  · Máximo 5 intentos de validación antes de invalidar el código
//  · Reenvío: cooldown mínimo de 60 segundos entre solicitudes
//  · Mensajes exactos definidos en RF-1 V4 §5
// ─────────────────────────────────────────────
import { logFailure, logSuccess } from '@/shared/services/auditLogger';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Vigencia del código en segundos (RF-1.5: máx 5 min) */
const CODE_TTL_SECONDS = 5 * 60;

/** Cooldown mínimo entre reenvíos en segundos (RF-1 V4 §5) */
const RESEND_COOLDOWN_SECONDS = 60;

/** Máximo de intentos de validación antes de invalidar el código (RF-1 V4 §5) */
const MAX_VERIFY_ATTEMPTS = 5;

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface UseVerificationCodeParams {
  namespace: string;
  initialTime?: number;
  /**
   * Si true, el hook bloquea el intento de verificar cuando el timer
   * llegó a 0 (útil en la pantalla email-validation del registro).
   * En verify-identity de recuperación de contraseña se pasa false
   * porque la expiración real la detecta el backend.
   */
  checkExpired?: boolean;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export function useVerificationCode({
  namespace,
  initialTime = CODE_TTL_SECONDS,
  checkExpired = false,
  onVerify,
  onResend,
}: UseVerificationCodeParams) {
  const { t } = useTranslation();

  const [code, setCodeValue]        = useState('');
  const [timeLeft, setTimeLeft]     = useState(initialTime);
  const [expired, setExpired]       = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [resending, setResending]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  /** Intentos fallidos de verificación en esta sesión del código */
  const attemptsRef   = useRef(0);
  /** true cuando se agotaron los intentos — el código quedó invalidado */
  const [exhausted, setExhausted]   = useState(false);

  // ── Timer de expiración del código ────────────
  useEffect(() => {
    if (timeLeft <= 0) {
      if (checkExpired) setExpired(true);
      return;
    }
    const id = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, checkExpired]);

  // ── Cooldown del botón de reenvío (60 s) ──────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  // ── Setter del campo — solo dígitos ───────────
  const setCode = (v: string) => {
    setCodeValue(v.replace(/\D/g, '').slice(0, 6));
    setError('');
  };

  // ── Reenviar código ───────────────────────────
  const handleResend = async () => {
    // Cooldown activo
    if (resendCooldown > 0) {
      setError(t(`${namespace}.errors.resendCooldown`));
      return;
    }

    setResending(true);
    setError('');
    try {
      await onResend();
      // Reiniciar todo el estado del código
      setCodeValue('');
      setExpired(false);
      setExhausted(false);
      attemptsRef.current = 0;
      setTimeLeft(initialTime);
      // Cooldown de reenvío: 60 s mínimo (RF-1 V4 §5)
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      logSuccess('PASSWORD_RECOVERY_REQUESTED', { detail: 'Código reenviado' });
    } catch (err: any) {
      setError(
        err.response?.data?.message
          ?? t(`${namespace}.errors.resendFailed`)
          ?? 'No se pudo reenviar el código',
      );
    } finally {
      setResending(false);
    }
  };

  // ── Verificar código ──────────────────────────
  const handleVerify = async () => {
    // Código ya expirado por timer (solo si checkExpired=true)
    if (checkExpired && expired) {
      setError(t(`${namespace}.errors.expired`));
      return;
    }

    // Intentos agotados
    if (exhausted) {
      setError(t(`${namespace}.errors.exhausted`));
      return;
    }

    // Validación de formato: obligatorio y exactamente 6 dígitos
    if (!code) {
      setError(t(`${namespace}.errors.emptyCode`));
      return;
    }
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError(t(`${namespace}.errors.length`));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(code);
      logSuccess('PASSWORD_RESET_SUCCESS', { detail: 'Código verificado' });
      attemptsRef.current = 0; // éxito — resetear contador
    } catch (err: any) {
      attemptsRef.current += 1;

      const backendMessage: string = err.response?.data?.message ?? '';
      const status: number = err.response?.status ?? 0;

      // ── Código expirado (backend) ──
      if (
        status === 410 ||
        backendMessage.toLowerCase().includes('expir') ||
        backendMessage.toLowerCase().includes('vencid')
      ) {
        setError(t(`${namespace}.errors.expired`));
        logFailure('PASSWORD_RESET_FAILED', { detail: 'Código expirado' });
        return;
      }

      // ── Código ya fue usado ──
      if (
        status === 409 ||
        backendMessage.toLowerCase().includes('utilizado') ||
        backendMessage.toLowerCase().includes('used')
      ) {
        setError(t(`${namespace}.errors.alreadyUsed`));
        logFailure('PASSWORD_RESET_FAILED', { detail: 'Código ya utilizado' });
        return;
      }

      // ── Se agotaron los intentos ──
      if (attemptsRef.current >= MAX_VERIFY_ATTEMPTS) {
        setExhausted(true);
        setError(t(`${namespace}.errors.exhausted`));
        logFailure('PASSWORD_RESET_FAILED', {
          detail: `Intentos agotados: ${attemptsRef.current}/${MAX_VERIFY_ATTEMPTS}`,
        });
        return;
      }

      // ── Código incorrecto (genérico) ──
      setError(t(`${namespace}.errors.invalid`));
      logFailure('PASSWORD_RESET_FAILED', {
        detail: `Intento ${attemptsRef.current}/${MAX_VERIFY_ATTEMPTS}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    code,
    setCode,
    timeLeft,
    expired,
    exhausted,
    error,
    loading,
    resending,
    resendCooldown,
    handleResend,
    handleVerify,
  };
}
