// ─────────────────────────────────────────────
//  shared/i18n/index.ts
//  Configuración de i18next para la app
//  Versiones: i18next@23 + react-i18next@14
// ─────────────────────────────────────────────
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from '@/shared/i18n/locales/es';
import en from '@/shared/i18n/locales/en';
import de from '@/shared/i18n/locales/de';
import fr from '@/shared/i18n/locales/fr';

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        es: { translation: es },
        en: { translation: en },
        de: { translation: de },
        fr: { translation: fr },
      },
      lng:          'es',
      fallbackLng:  'es',
      initImmediate: false,
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;