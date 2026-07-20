// ─────────────────────────────────────────────
//  features/auth/hooks/usePasswordRecoveryForm.ts
// ─────────────────────────────────────────────
import { Routes } from '@/shared/constants/routes';
import { requestRecovery } from '@/shared/services/passwordRecoveryService';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usePasswordRecoveryForm() {
  const { t } = useTranslation();

  const [email, setEmailValue]     = useState('');
  const [error, setError]          = useState('');
  const [showModal, setShowModal]  = useState(false);
  const [loading, setLoading]      = useState(false);

  const setEmail = (v: string) => {
    setEmailValue(v);
    setError('');
  };

  const handleSubmit = async () => {
    const e = email.trim();

    if (!e) {
      setError(t('passwordRecovery.errors.emailEmpty') ?? 'El correo es obligatorio');
      return;
    }
    if (!EMAIL_REGEX.test(e)) {
      setError(t('passwordRecovery.errors.invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await requestRecovery(e);
      setShowModal(true);
    } catch (err: any) {
      const message = err.response?.data?.message || t('passwordRecovery.errors.emailNotFound');
      setError(message);
    } finally {
      setLoading(false);
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