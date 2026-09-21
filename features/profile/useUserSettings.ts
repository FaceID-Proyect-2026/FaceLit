// ─────────────────────────────────────────────
//  features/profile/useUserSettings.ts
//  Persiste la configuración del usuario en el backend,
//  no solo en el dispositivo.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
    createUserConfiguration,
    getUserConfiguration,
    updateUserConfiguration,
} from '@/shared/services/userConfigService';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANG_BACKEND_TO_APP: Record<string, string> = {
  ES: 'es',
  EN: 'en',
  PR: 'pr',
  FR: 'fr',
  FRA: 'fr',
  FRANCES: 'fr',
};

const LANG_APP_TO_BACKEND: Record<string, string> = {
  es: 'ES',
  en: 'EN',
  pr: 'PR',
  fr: 'FR',
};

const DEFAULT_USER_CONFIG = {
  language: 'ES',
  darkMode: false,
  notificationsActive: true,
};

interface Draft {
  darkMode: boolean;
  language: string;
  notificationsActive: boolean;
}

export function useUserSettings() {
  const { i18n } = useTranslation();
  const { isDark, setDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [saved, setSaved] = useState(true);

  const [draft, setDraftState] = useState<Draft>({
    darkMode: isDark,
    language: i18n.language,
    notificationsActive: true,
  });

  const applyConfig = useCallback((config: any) => {
    const backendLanguage = String(config?.language ?? DEFAULT_USER_CONFIG.language).trim().toUpperCase();
    const lang = LANG_BACKEND_TO_APP[backendLanguage] ?? 'es';
    const darkMode = Boolean(config?.darkMode ?? DEFAULT_USER_CONFIG.darkMode);
    const notificationsActive = config?.notificationsActive ?? DEFAULT_USER_CONFIG.notificationsActive;

    setDarkMode(darkMode);
    i18n.changeLanguage(lang);
    setDraftState({
      darkMode,
      language: lang,
      notificationsActive,
    });
    setSaved(true);
  }, [i18n, setDarkMode]);

  const loadAndApply = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getUserConfiguration();
      setHasConfig(true);
      applyConfig(config);
    } catch {
      setHasConfig(false);
      applyConfig(DEFAULT_USER_CONFIG);
      try {
        await createUserConfiguration(DEFAULT_USER_CONFIG);
        setHasConfig(true);
      } catch {
        // La primera visita puede fallar por backend sin configuración; el usuario
        // conserva la configuración por defecto local hasta el siguiente intento.
      }
    } finally {
      setLoading(false);
    }
  }, [applyConfig]);

  const setDraftTheme = useCallback((dark: boolean) => {
    setDarkMode(dark);
    setDraftState((prev) => ({ ...prev, darkMode: dark }));
    setSaved(false);
  }, [setDarkMode]);

  const setDraftLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    setDraftState((prev) => ({ ...prev, language: lang }));
    setSaved(false);
  }, [i18n]);

  const setDraftNotifications = useCallback((active: boolean) => {
    setDraftState((prev) => ({ ...prev, notificationsActive: active }));
    setSaved(false);
  }, []);

  const saveChanges = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        language: LANG_APP_TO_BACKEND[draft.language] ?? DEFAULT_USER_CONFIG.language,
        darkMode: draft.darkMode,
        notificationsActive: draft.notificationsActive,
      };

      if (hasConfig) {
        await updateUserConfiguration(payload);
      } else {
        await createUserConfiguration(payload);
        setHasConfig(true);
      }

      setSaved(true);
      return { success: true };
    } catch (err: any) {
      const responseData = err.response?.data;
      const serverError = typeof responseData === 'string'
        ? responseData
        : responseData?.message || responseData?.error || responseData?.title;
      const status = err.response?.status;
      return {
        success: false,
        error: serverError || (status ? `Error del servidor (${status})` : 'No se pudo guardar la configuración'),
      };
    } finally {
      setSaving(false);
    }
  }, [draft, hasConfig]);

  return {
    loading,
    saving,
    saved,
    draft,
    loadAndApply,
    setDraftTheme,
    setDraftLanguage,
    setDraftNotifications,
    saveChanges,
  };
}