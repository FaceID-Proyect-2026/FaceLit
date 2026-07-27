// ─────────────────────────────────────────────
//  features/profile/useUserSettings.ts
//  Trae y aplica las preferencias guardadas del
//  usuario (tema, idioma, notificaciones), y las
//  guarda en el backend cada vez que cambian.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
    createUserConfiguration,
    getUserConfiguration,
    updateUserConfiguration,
} from '@/shared/services/userConfigService';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANG_BACKEND_TO_APP: Record<string, string> = { ES: 'es', EN: 'en', DE: 'de', FR: 'fr' };
const LANG_APP_TO_BACKEND: Record<string, string> = { es: 'ES', en: 'EN', de: 'DE', fr: 'FR' };

export function useUserSettings() {
  const { i18n } = useTranslation();
  const { isDark, setDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const [notificationsActive, setNotificationsActiveState] = useState(true);

  // Se llama una vez tras iniciar sesión (o al restaurar sesión guardada)
  // para traer las preferencias del usuario y aplicarlas en pantalla.
  const loadAndApply = useCallback(async () => {
    setLoading(true);
    try {
      const config = await getUserConfiguration();
      setHasConfig(true);
      setDarkMode(config.darkMode);
      setNotificationsActiveState(config.notificationsActive);
      i18n.changeLanguage(LANG_BACKEND_TO_APP[config.language] ?? 'es');
    } catch {
      // El usuario aún no tiene configuración guardada (primera vez) —
      // se queda con lo que ya tenga local (localStorage/valores por defecto)
      setHasConfig(false);
    } finally {
      setLoading(false);
    }
  }, [i18n, setDarkMode]);

  const persist = useCallback(async (next: {
    darkMode: boolean;
    language: string;
    notificationsActive: boolean;
  }) => {
    const payload = {
      configurationName: 'Configuración principal',
      description: '',
      notificationsActive: next.notificationsActive,
      darkMode: next.darkMode,
      language: LANG_APP_TO_BACKEND[next.language] ?? 'ES',
    };

    if (hasConfig) {
      await updateUserConfiguration(payload);
    } else {
      await createUserConfiguration(payload);
      setHasConfig(true);
    }
  }, [hasConfig]);

  // Cambia el tema al instante en pantalla, y lo guarda en el backend
  const changeTheme = useCallback(async (dark: boolean) => {
    setDarkMode(dark);
    try {
      await persist({ darkMode: dark, language: i18n.language, notificationsActive });
    } catch {
      // si falla el guardado, el cambio visual ya ocurrió;
      // se reintentará en el próximo cambio
    }
  }, [persist, i18n.language, notificationsActive, setDarkMode]);

  // Cambia el idioma al instante, y lo guarda en el backend
  const changeLanguage = useCallback(async (lang: string) => {
    i18n.changeLanguage(lang);
    try {
      await persist({ darkMode: isDark, language: lang, notificationsActive });
    } catch {}
  }, [persist, isDark, notificationsActive, i18n]);

  const changeNotifications = useCallback(async (active: boolean) => {
    setNotificationsActiveState(active);
    try {
      await persist({ darkMode: isDark, language: i18n.language, notificationsActive: active });
    } catch {}
  }, [persist, isDark, i18n.language]);

  return {
    loading,
    hasConfig,
    notificationsActive,
    loadAndApply,
    changeTheme,
    changeLanguage,
    changeNotifications,
  };
}