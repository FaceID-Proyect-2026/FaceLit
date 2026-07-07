// ─────────────────────────────────────────────
//  features/auth/hooks/useMinorConsentForm.ts
//  Lógica del formulario de consentimiento del
//  acudiente, separada de la pantalla (clean code)
//  — misma convención que useLoginForm / useRegisterForm
// ─────────────────────────────────────────────
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

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
  /** Correo del menor, recibido por query param, para evitar que coincida con el del acudiente */
  minorEmail?: string;
}

export function useMinorConsentForm({ minorEmail }: UseMinorConsentFormParams) {
  const { t } = useTranslation();

  const [form, setForm]                     = useState<GuardianForm>(initialForm);
  const [emailValidated, setEmailValidated] = useState(false);
  const [accepted, setAccepted]             = useState(false);
  const [errors, setErrors]                 = useState(initialErrors);

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

  const handleSubmit = () => {
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

    // Tras el consentimiento, se continúa con el registro facial.
    // El modal de éxito se muestra en esa pantalla (teenager-registration), no acá.
    router.replace('/auth/teenager-registration');
  };

  const handleBack = () => router.back();

  return {
    form,
    emailValidated,
    accepted,
    errors,

    handleName,
    handleDoc,
    handleEmail,
    handleEmailValidate,
    setAccepted,
    handleSubmit,
    handleBack,
  };
}
