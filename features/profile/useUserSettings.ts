// ─────────────────────────────────────────────
//  features/profile/useUserSettings.ts
//  Trae las preferencias guardadas, permite editarlas
//  como borrador local, y las guarda todas juntas
//  con un solo botón "Guardar cambios".
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
  ES: 'es', EN: 'en', DE: 'de', FR: 'fr', FRA: 'fr', FRANCES: 'fr',
};
const LANG_APP_TO_BACKEND: Record<string, string[]> = {
  es: ['ES'], en: ['EN'], de: ['DE'], fr: ['FR', 'FRA', 'FRANCES'],
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
  const [saved, setSaved] = useState(true); // true = no hay cambios sin guardar

  // Borrador local — lo que el usuario está eligiendo en pantalla,
  // AÚN NO aplicado ni guardado hasta que presione "Guardar cambios"
  const [draft, setDraftState] = useState<Draft>({
    darkMode: isDark,
    language: i18n.language,
    notificationsActive: true,
  });

  // Se llama una vez tras iniciar sesión, para traer la configuración
  // guardada y aplicarla de inmediato en toda la app.
  const loadAndApply = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getUserConfiguration();
      setHasConfig(true);

      const backendLanguage = String(config.language ?? '').trim().toUpperCase();
      const lang = LANG_BACKEND_TO_APP[backendLanguage] ?? 'es';
      setDarkMode(config.darkMode);
      i18n.changeLanguage(lang);

      setDraftState({
        darkMode: config.darkMode,
        language: lang,
        notificationsActive: config.notificationsActive,
      });
      setSaved(true);
    } catch {
      // El usuario aún no tiene configuración guardada (primera vez)
      setHasConfig(false);
    } finally {
      setLoading(false);
    }
  }, [i18n, setDarkMode]);

  // Actualiza el borrador local Y aplica el cambio visual al instante
  // (para que el usuario vea la vista previa), pero SIN guardar todavía.
  const setDraftTheme = useCallback((dark: boolean) => {
    setDarkMode(dark); // vista previa inmediata
    setDraftState(prev => ({ ...prev, darkMode: dark }));
    setSaved(false);
  }, [setDarkMode]);

  const setDraftLanguage = useCallback((lang: string) => {
    i18n.changeLanguage(lang); // vista previa inmediata
    setDraftState(prev => ({ ...prev, language: lang }));
    setSaved(false);
  }, [i18n]);

  const setDraftNotifications = useCallback((active: boolean) => {
    setDraftState(prev => ({ ...prev, notificationsActive: active }));
    setSaved(false);
  }, []);

  // Guarda TODO el borrador en una sola llamada al backend
  const saveChanges = useCallback(async () => {
    setSaving(true);
    try {
      const languageCodes = LANG_APP_TO_BACKEND[draft.language] ?? ['ES'];
      const basePayload = {
        configurationName: 'Configuración principal',
        description: '',
        notificationsActive: draft.notificationsActive,
        darkMode: draft.darkMode,
      };

      let lastError: any;
      for (const language of languageCodes) {
        try {
          const payload = { ...basePayload, language };
          if (hasConfig) {
            await updateUserConfiguration(payload);
          } else {
            await createUserConfiguration(payload);
            setHasConfig(true);
          }
          setSaved(true);
          return { success: true };
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError;
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
    saved,       // true = todo guardado, false = hay cambios pendientes
    draft,       // valores actuales del borrador (para pintar la UI)
    loadAndApply,
    setDraftTheme,
    setDraftLanguage,
    setDraftNotifications,
    saveChanges,
  };
}