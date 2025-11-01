import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/translation.json';
import hi from './locales/hi/translation.json';
import pa from './locales/pa/translation.json';

i18n
  .use(LanguageDetector) // auto-detects language via localStorage, navigator, etc.
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      pa: { translation: pa },
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
// Keep <html lang> in sync for accessibility/SEO
if (typeof document !== 'undefined') {
  document.documentElement.lang = (i18n.language || 'en').split('-')[0];
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = (lng || 'en').split('-')[0];
  });
}
