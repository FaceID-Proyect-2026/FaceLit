// ─────────────────────────────────────────────
//  shared/contexts/I18nContext.tsx
//  Maneja el idioma activo de la app
// ─────────────────────────────────────────────
import React, {
  createContext, useContext, useState,
  useEffect, ReactNode,
} from 'react';
import i18n from '@/shared/i18n/index';

// ── Tipos ─────────────────────────────────────
export type Language = 'es' | 'en' | 'de' | 'fr';

export const LANGUAGE_LABELS: Record<Language, string> = {
  es: 'ES', en: 'EN', de: 'DE', fr: 'FR',
};

export const LANGUAGE_NAMES: Record<Language, string> = {
  es: 'Español', en: 'English', de: 'Deutsch', fr: 'Français',
};

const LANGUAGES: Language[] = ['es', 'en', 'de', 'fr'];
const STORAGE_KEY = 'facelit-lang';

// ── Helpers ───────────────────────────────────
function getSavedLanguage(): Language {
  try {
    const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved as Language)) {
      return saved as Language;
    }
  } catch {}
  return 'es';
}

// ── Contexto ──────────────────────────────────
interface I18nContextType {
  language:       Language;
  changeLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
  language:       'es',
  changeLanguage: () => {},
});

// ── Provider ──────────────────────────────────
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getSavedLanguage);

  useEffect(() => {
    // Sincroniza i18next con el idioma guardado al montar
    const saved = getSavedLanguage();
    i18n.changeLanguage(saved);

    // Escucha cambios de i18next y actualiza React
    const onLanguageChanged = (lng: string) => {
      if (LANGUAGES.includes(lng as Language)) {
        setLanguage(lng as Language);
      }
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);           // ← agregar esta línea
    i18n.changeLanguage(lang);
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, lang);
  } catch {}
};

  return (
    <I18nContext.Provider value={{ language, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useLanguage(): I18nContextType {
  return useContext(I18nContext);
}