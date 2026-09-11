// ─────────────────────────────────────────────
//  features/auth/hooks/usePasswordRecoveryForm.ts
//
//  RF-1.5 / RF-1 V4 §1 — Recuperación de contraseña
//  · Valida correo electrónico
//  · Mensaje genérico si el correo no existe (anti-enumeración de cuentas)
//  · Prevención de doble submit
//  · Mensajes de error de red sin exponer detalles técnicos (RF-1 V4 §7)
//  · Auditoría del proceso (RNF-1.8)
// ─────────────────────────────────────────────
import { Routes } from '@/shared/constants/routes';
import { logFailure, logSuccess } from '@/shared/services/auditLogger';
import { requestRecovery } from '@/shared/services/passwordRecoveryService';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usePasswordRecoveryForm() {
  const { t } = useTranslation();

  const [email, setEmailValue]    = useState('');
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(false);

  // Prevención de doble submit — RF-1 V4 §7
  const submittingRef = useRef(false);

  const setEmail = (v: string) => {
    setEmailValue(v);
    setError('');
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;

    const trimmed = email.trim();

    if (!trimmed) {
      setError(t('passwordRecovery.errors.emailEmpty'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError(t('passwordRecovery.errors.invalidEmail'));
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      await requestRecovery(trimmed);
      logSuccess('PASSWORD_RECOVERY_REQUESTED', { detail: 'Solicitud enviada' });
      setShowModal(true);
    } catch (err: any) {
      const status = err.response?.status;

      if (status === 404 || status === 400) {
        // RF-1 V4 §1 — mensaje genérico: no confirmar si el correo existe o no
        // Mostramos el modal igual para no revelar la existencia de la cuenta.
        // El backend tampoco debería responder con un 404 distinguible, pero
        // si lo hace, tapamos esa info con el mismo comportamiento visual.
        logFailure('PASSWORD_RECOVERY_REQUESTED', { detail: 'Correo no encontrado (enmascarado)' });
        setShowModal(true);
        return;
      }

      if (status >= 500 || !status) {
        // RF-1 V4 §7 — error de servidor: no mostrar detalles técnicos
        setError(t('passwordRecovery.errors.serverError'));
        return;
      }

      // Cualquier otro error
      setError(t('passwordRecovery.errors.networkError'));
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const closeModal = () => setShowModal(false);

  const handleModalContinue = () => {
    setShowModal(false);
    router.push({
      pathname: Routes.AUTH.VERIFY_IDENTITY as any,
      params: { email: email.trim() },
    });
  };

  const handleCancel = () => router.replace(Routes.AUTH.LOGIN as any);

  return {
    email,
    error,
    showModal,
    loading,
    setEmail,
    handleSubmit,
    closeModal,
    handleModalContinue,
    handleCancel,
  };
}
