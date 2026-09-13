import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'
import it from './locales/it.json'
import {
  getInitialLanguage,
  normalizeLanguage,
} from './routing'

export type { SupportedLanguage } from './routing'
export {
  detectBrowserLanguage,
  getLanguageFromPathname,
  isSupportedLanguage,
  localizePath,
  normalizeLanguage,
  stripLanguagePrefix,
  supportedLanguages,
} from './routing'

const initialLanguage = getInitialLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    it: { translation: it },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('portfolio-lang', normalizeLanguage(lng))
  document.documentElement.lang = normalizeLanguage(lng)
})

document.documentElement.lang = initialLanguage

export default i18n
