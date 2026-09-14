import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import de from './locales/de.json'
import it from './locales/it.json'
import { detectPreferredLanguage, SUPPORTED_LANGUAGES } from './detectLanguage'

const STORAGE_KEY = 'portfolio-lang'

function readSavedLanguage(): string | null {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  const code = saved.split('-')[0]?.toLowerCase()
  return SUPPORTED_LANGUAGES.includes(code as (typeof SUPPORTED_LANGUAGES)[number]) ? code : null
}

const initialLanguage = readSavedLanguage() ?? detectPreferredLanguage()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
    it: { translation: it },
  },
  lng: initialLanguage,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

i18n.on('languageChanged', (lng) => {
  const code = lng.split('-')[0]?.toLowerCase()
  if (SUPPORTED_LANGUAGES.includes(code as (typeof SUPPORTED_LANGUAGES)[number])) {
    localStorage.setItem(STORAGE_KEY, code)
    document.documentElement.lang = code
  }
})

document.documentElement.lang = initialLanguage

export default i18n
