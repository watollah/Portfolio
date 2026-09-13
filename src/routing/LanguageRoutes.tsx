import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getInitialLanguage,
  isSupportedLanguage,
  localizePath,
  normalizeLanguage,
  stripLanguagePrefix,
} from '../i18n/routing'

export function LanguageRoute() {
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (!lang || !isSupportedLanguage(lang)) {
      return
    }

    const normalized = normalizeLanguage(lang)
    if (i18n.language !== normalized) {
      i18n.changeLanguage(normalized)
    }
  }, [lang, i18n])

  if (!lang || !isSupportedLanguage(lang)) {
    const fallbackLang = normalizeLanguage(i18n.language)
    const target =
      localizePath(stripLanguagePrefix(location.pathname), fallbackLang) +
      location.search +
      location.hash

    return <Navigate to={target} replace />
  }

  return <Outlet />
}

export function RootRedirect() {
  const lang = getInitialLanguage()
  return <Navigate to={`/${lang}`} replace />
}

export function LegacyRedirect() {
  const location = useLocation()
  const { i18n } = useTranslation()
  const lang = normalizeLanguage(i18n.language)
  const target =
    localizePath(location.pathname, lang) + location.search + location.hash

  return <Navigate to={target} replace />
}
