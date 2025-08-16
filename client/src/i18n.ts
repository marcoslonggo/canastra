import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Load translation using http -> see /public/locales
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'pt'],
    
    // Debug mode (disable in production)
    debug: process.env.NODE_ENV === 'development',

    // Detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user language
      caches: ['localStorage'],
      
      // localStorage key
      lookupLocalStorage: 'i18nextLng',
    },

    // Backend options
    backend: {
      // Path where resources get loaded from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React options
    react: {
      // Use Suspense for loading translations
      useSuspense: false,
    },

    // Interpolation options
    interpolation: {
      // React already escapes by default
      escapeValue: false,
    },

    // Namespace options
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;