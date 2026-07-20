// ─────────────────────────────────────────────
//  features/auth/hooks/useMinorConsentForm.ts
// ─────────────────────────────────────────────
import { requestConsent } from '@/shared/services/consentService';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ONLY_LETTERS = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;

interface GuardianForm {
  name: string;
  document: string;
  email: string;
}

const initialForm: GuardianForm = { name: '', document: '', email: '' };

const initialErrors: Record<string, string> = {
  guardianName: '', guardianDoc: '', guardianEmail: '',
  emailAction: '', consent: '',
};

interface UseMinorConsentFormParams {
  minorEmail?: string;
  idUser?: string;
}

export function useMinorConsentForm({ minorEmail, idUser }: UseMinorConsentFormParams) {
  const { t } = useTranslation();

  const [form, setForm]                     = useState<GuardianForm>(initialForm);
  const [emailValidated, setEmailValidated] = useState(false);
  const [accepted, setAccepted]             = useState(false);
  const [errors, setErrors]                 = useState(initialErrors);
  const [loading, setLoading]               = useState(false);

  const clearError = (k: string) => setErrors(p => ({ ...p, [k]: '' }));

  const handleName = (v: string) => {
    setForm(p => ({ ...p, name: v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '') }));
    clearError('guardianName');
  };

  const handleDoc = (v: string) => {
    setForm(p => ({ ...p, document: v.replace(/\D/g, '').slice(0, 10) }));
    clearError('guardianDoc');
  };

  const handleEmail = (v: string) => {
    setForm(p => ({ ...p, email: v.replace(/\s/g, '') }));
    setEmailValidated(false);
    clearError('guardianEmail');
    clearError('emailAction');
  };

  const handleEmailValidate = () => {
    const e = form.email.trim();
    if (!e) {
      setErrors(p => ({ ...p, emailAction: t('minorConsent.errors.emailEmpty') }));
      return;
    }
    if (!EMAIL_REGEX.test(e)) {
      setErrors(p => ({ ...p, emailAction: t('minorConsent.errors.emailInvalid') }));
      return;
    }
    if (minorEmail && e.toLowerCase() === minorEmail.trim().toLowerCase()) {
      setErrors(p => ({ ...p, emailAction: t('minorConsent.errors.emailSameMinor') }));
      return;
    }
    setEmailValidated(true);
    clearError('emailAction');
  };

  const handleSubmit = async () => {
    const e = { ...initialErrors };
    const nameParts = form.name.trim().split(' ').filter(Boolean);

    if (!form.name.trim())               e.guardianName = t('minorConsent.errors.nameRequired');
    else if (nameParts.length < 2)       e.guardianName = t('minorConsent.errors.nameIncomplete');
    else if (!ONLY_LETTERS.test(form.name)) e.guardianName = t('minorConsent.errors.nameLettersOnly');

    if (!form.document)                  e.guardianDoc = t('minorConsent.errors.docRequired');
    else if (form.document.length !== 10) e.guardianDoc = t('minorConsent.errors.docLength');

    if (!form.email)                        e.guardianEmail = t('minorConsent.errors.emailRequired');
    else if (!EMAIL_REGEX.test(form.email)) e.guardianEmail = t('minorConsent.errors.emailInvalid');
    else if (minorEmail && form.email.toLowerCase() === minorEmail.trim().toLowerCase())
      e.guardianEmail = t('minorConsent.errors.emailSameMinor');

    if (!emailValidated) e.emailAction = t('minorConsent.errors.emailNotValidated');
    if (!accepted)        e.consent    = t('minorConsent.errors.consentRequired');

    setErrors(e);
    if (Object.values(e).some(v => v !== '')) return;

    if (!idUser) {
      setErrors(prev => ({ ...prev, consent: 'No se encontró el ID del usuario menor' }));
      return;
    }

    setLoading(true);
    try {
      await requestConsent({
        id_user: idUser,
        fullName: form.name.trim(),
        identityDocument: form.document,
        emailGuardian: form.email.trim(),
      });

      // Navega a la pantalla donde el acudiente ingresa el código de 6 dígitos
      router.replace({
        pathname: '/auth/guardian-verification' as any,
        params: { idUser, guardianEmail: form.email.trim() },
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo enviar la solicitud';
      if (message.toLowerCase().includes('correo') || message.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, guardianEmail: message }));
      } else {
        setErrors(prev => ({ ...prev, consent: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.back();

  return {
    form, emailValidated, accepted, errors, loading,
    handleName, handleDoc, handleEmail, handleEmailValidate,
    setAccepted, handleSubmit, handleBack,
  };
}