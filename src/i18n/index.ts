import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'

const savedLang = localStorage.getItem('portfolio-lang')

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: savedLang ?? (navigator.language.startsWith('de') ? 'de' : 'en'),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('portfolio-lang', lng)
  document.documentElement.lang = lng
})

document.documentElement.lang = i18n.language

export default i18n
