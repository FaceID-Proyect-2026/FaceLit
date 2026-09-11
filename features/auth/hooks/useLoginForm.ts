// ─────────────────────────────────────────────
//  features/auth/hooks/useLoginForm.ts
//
//  RF-1.1 V3 / RF-1 V4 — Validaciones exhaustivas
//  · Documento: exactamente 10 dígitos numéricos
//  · Contraseña: 8–15 caracteres (sin validar complejidad en login)
//  · Mensaje genérico cuando documento no existe (anti-enumeración)
//  · Bloqueo temporal tras 5 intentos fallidos (RNF-1.3)
//  · Prevención de doble submit (RNF-1.12)
//  · Política de privacidad: una sola vez por documento (RF-1.1 V3)
// ─────────────────────────────────────────────
import {
    hasAcceptedPrivacy,
    recordPrivacyAcceptance,
} from '@/features/auth/privacyAcceptanceStore';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Exactamente 10 dígitos — RF-1 V4 §1
const DOCUMENT_REGEX = /^\d{10}$/;

interface LoginForm {
  document: string;
  password: string;
  accepted: boolean;
}

interface LoginErrors {
  document: string;
  password: string;
  policy:   string;
  /** Mensaje de bloqueo temporal de cuenta (RNF-1.3) */
  blocked:  string;
}

const initialForm: LoginForm   = { document: '', password: '', accepted: false };
const initialErrors: LoginErrors = { document: '', password: '', policy: '', blocked: '' };

export function useLoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [form, setForm]       = useState<LoginForm>(initialForm);
  const [errors, setErrors]   = useState<LoginErrors>(initialErrors);
  const [loading, setLoading] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);

  // Prevención de doble submit — RF-1 V4 §7
  const submittingRef = useRef(false);

  // RF-1.1 V3: ocultar checkbox si ya hay aceptación previa para ese documento
  useEffect(() => {
    const accepted = hasAcceptedPrivacy(form.document.trim());
    setAlreadyAccepted(accepted);
    if (accepted && !form.accepted) {
      setForm(prev => ({ ...prev, accepted: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.document]);

  const setField = <K extends keyof LoginForm>(key: K, value: LoginForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Limpiar el error del campo que se está editando
    setErrors(prev => ({ ...prev, [key]: '', blocked: '' }));
  };

  // ── Limpiar los caracteres no numéricos al pegar (RF-1 V4 §1 — paste)
  const setDocumentField = (raw: string) => {
    // strip todo lo que no sea dígito (guiones, puntos, espacios del copy-paste)
    const cleaned = raw.replace(/\D/g, '');
    setField('document', cleaned);
  };

  const validate = (): LoginErrors => {
    const e = { ...initialErrors };
    const doc = form.document.trim();

    // ── Documento (RF-1 V4 §1) ──────────────────
    if (!doc) {
      e.document = t('login.errors.emptyDocument');
    } else if (!/^\d+$/.test(doc)) {
      // Carácter no numérico (no debería llegar aquí porque el campo filtra,
      // pero se valida igual como defensa en profundidad)
      e.document = t('login.errors.invalidDocument');
    } else if (doc.length !== 10) {
      e.document = t('login.errors.documentLength');
    }

    // ── Contraseña (RF-1 V4 §2) ─────────────────
    // En login NO se valida complejidad — solo longitud
    if (!form.password) {
      e.password = t('login.errors.emptyPassword');
    } else if (form.password.includes(' ')) {
      e.password = t('login.errors.passwordNoSpaces');
    } else if (form.password.length < 8 || form.password.length > 15) {
      e.password = t('login.errors.passwordLength');
    }

    // ── Política de privacidad (RF-1 V4 §3) ─────
    if (!form.accepted) {
      e.policy = t('login.errors.policyRequired');
    }

    return e;
  };

  const handleSubmit = async () => {
    // Prevención de doble submit
    if (submittingRef.current) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (nextErrors.document || nextErrors.password || nextErrors.policy) return;

    submittingRef.current = true;
    setLoading(true);

    try {
      const result = await login(form.document.trim(), form.password);

      if (result.success) {
        recordPrivacyAcceptance(form.document.trim());
        return;
      }

      // ── Bloqueo temporal (RNF-1.3 / RF-1 V4 §4) ──
      if (result.locked) {
        const mins = result.lockRemainingSeconds
          ? Math.ceil(result.lockRemainingSeconds / 60)
          : 15;
        setErrors(prev => ({
          ...prev,
          blocked: t('login.errors.accountLocked', { minutes: mins }),
        }));
        return;
      }

      // ── Error genérico — no revelar si fue documento o contraseña (RF-1 V4 §1 nota seguridad) ──
      setErrors(prev => ({
        ...prev,
        password: t('login.errors.invalidCredentials'),
      }));
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return {
    form,
    errors,
    loading,
    alreadyAccepted,
    setField,
    setDocumentField,
    handleSubmit,
  };
}
