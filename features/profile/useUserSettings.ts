// ─────────────────────────────────────────────
//  features/profile/useUserSettings.ts
//  Persiste la configuración del usuario en el backend,
//  no solo en el dispositivo.
// ─────────────────────────────────────────────
import { Language, useLanguage } from '@/shared/contexts/I18nContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
    createUserConfiguration,
    getUserConfiguration,
    updateUserConfiguration,
} from '@/shared/services/userConfigService';
import { useCallback, useState } from 'react';

const LANG_BACKEND_TO_APP: Record<string, Language> = {
  ES: 'es',
  EN: 'en',
  DE: 'de',
  PR: 'es',
  FR: 'fr',
  FRA: 'fr',
  FRANCES: 'fr',
};

const LANG_APP_TO_BACKEND: Record<Language, string> = {
  es: 'ES',
  en: 'EN',
  de: 'DE',
  fr: 'FR',
};

const DEFAULT_USER_CONFIG = {
  language: 'ES',
  darkMode: false,
  notificationsActive: true,
};

interface Draft {
  darkMode: boolean;
  language: Language;
}

export function useUserSettings() {
  const { language, changeLanguage } = useLanguage();
  const { isDark, setDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [saved, setSaved] = useState(true);

  const [draft, setDraftState] = useState<Draft>({
    darkMode: isDark,
    language,
  });

  const applyConfig = useCallback((config: any) => {
    const backendLanguage = String(config?.language ?? DEFAULT_USER_CONFIG.language).trim().toUpperCase();
    const lang = LANG_BACKEND_TO_APP[backendLanguage] ?? 'es';
    const darkMode = Boolean(config?.darkMode ?? DEFAULT_USER_CONFIG.darkMode);
    if (isDark !== darkMode) setDarkMode(darkMode);
    if (language !== lang) changeLanguage(lang);
    setDraftState({
      darkMode,
      language: lang,
    });
    setSaved(true);
  }, [changeLanguage, isDark, language, setDarkMode]);

  const loadAndApply = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getUserConfiguration();
      setHasConfig(true);
      applyConfig(config);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.warn('[Settings] No se pudo cargar la configuración del usuario:', error);
        return;
      }

      setHasConfig(false);
      applyConfig(DEFAULT_USER_CONFIG);
      try {
        await createUserConfiguration(DEFAULT_USER_CONFIG);
        setHasConfig(true);
      } catch (createError) {
        console.warn('[Settings] No se pudo crear la configuración inicial:', createError);
      }
    } finally {
      setLoading(false);
    }
  }, [applyConfig]);

  const reloadAndApply = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getUserConfiguration();
      setHasConfig(true);
      applyConfig(config);
    } finally {
      setLoading(false);
    }
  }, [applyConfig]);

  const setDraftTheme = useCallback((dark: boolean) => {
    setDarkMode(dark);
    setDraftState((prev) => ({ ...prev, darkMode: dark }));
    setSaved(false);
  }, [setDarkMode]);

  const setDraftLanguage = useCallback((lang: Language) => {
    changeLanguage(lang);
    setDraftState((prev) => ({ ...prev, language: lang }));
    setSaved(false);
  }, [changeLanguage]);

  const saveChanges = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        language: LANG_APP_TO_BACKEND[draft.language] ?? DEFAULT_USER_CONFIG.language,
        darkMode: draft.darkMode,
        notificationsActive: true,
      };

      if (hasConfig) {
        await updateUserConfiguration(payload);
      } else {
        try {
          await getUserConfiguration();
          await updateUserConfiguration(payload);
        } catch (error: any) {
          if (error.response?.status !== 404) throw error;
          await createUserConfiguration(payload);
        }
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
        error: serverError || (status
          ? `Error del servidor (${status})`
          : 'No se pudo conectar con el backend. Verifica que esté iniciado en el puerto 8080.'),
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
    reloadAndApply,
    setDraftTheme,
    setDraftLanguage,
    saveChanges,
  };
}
