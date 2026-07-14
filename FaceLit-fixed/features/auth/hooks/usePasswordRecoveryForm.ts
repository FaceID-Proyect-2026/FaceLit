// ─────────────────────────────────────────────
//  features/auth/hooks/usePasswordRecoveryForm.ts
//  Lógica del formulario de recuperación de
//  contraseña, separada de la pantalla (clean code)
//  — misma convención que useLoginForm / useRegisterForm
// ─────────────────────────────────────────────
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mock temporal: simula la validación contra el backend
// (debe reemplazarse por la llamada real al servicio de auth)
const REGISTERED_EMAILS = [
  'admin@test.com',
  'usuario@empresa.com',
  'valery@gmail.com',
  'juan@gmail.com',
];

export function usePasswordRecoveryForm() {
  const { t } = useTranslation();

  const [email, setEmailValue]   = useState('');
  const [error, setError]        = useState('');
  const [showModal, setShowModal] = useState(false);

  const setEmail = (v: string) => {
    setEmailValue(v);
    setError('');
  };

  const handleSubmit = () => {
    if (!EMAIL_REGEX.test(email)) {
      setError(t('passwordRecovery.errors.invalidEmail'));
      return;
    }
    if (!REGISTERED_EMAILS.includes(email)) {
      setError(t('passwordRecovery.errors.emailNotFound'));
      return;
    }
    setError('');
    setShowModal(true);
  };

  // Cierra el modal sin navegar (ej. botón "atrás" de Android)
  const closeModal = () => setShowModal(false);

  const handleModalContinue = () => {
    setShowModal(false);
    router.push('/auth/verify-identity');
  };

  const handleCancel = () => router.replace('/auth/login');

  return {
    email,
    error,
    showModal,
    setEmail,
    handleSubmit,
    closeModal,
    handleModalContinue,
    handleCancel,
  };
}
