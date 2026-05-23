import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import am from './locales/am.json';
import or from './locales/or.json';
import ti from './locales/ti.json';

// Ethiopic scripts (Amharic, Tigrinya) are LTR — keep array empty unless adding Arabic/Hebrew
const RTL_LANGUAGES = [];

const resources = {
  en: { translation: en },
  am: { translation: am },
  or: { translation: or },
  ti: { translation: ti },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Persist language preference and apply document direction on every change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('language', lng);
  document.documentElement.dir = RTL_LANGUAGES.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

// Apply on initial load
const initialLng = localStorage.getItem('language') || 'en';
document.documentElement.dir = RTL_LANGUAGES.includes(initialLng) ? 'rtl' : 'ltr';
document.documentElement.lang = initialLng;

export default i18n;
