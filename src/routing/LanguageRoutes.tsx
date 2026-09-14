import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  defaultLanguage,
  getInitialLanguage,
  isPrefixedLanguage,
  localizePath,
  normalizeLanguage,
  stripLanguagePrefix,
} from '../i18n/routing'

function useSyncLanguage(lang: string) {
  const { i18n } = useTranslation()

  useEffect(() => {
    const normalized = normalizeLanguage(lang)
    if (i18n.language !== normalized) {
      i18n.changeLanguage(normalized)
    }
  }, [lang, i18n])
}

/** German content at unprefixed URLs (`/`, `/projects`, …). */
export function DefaultLanguageLayout() {
  useSyncLanguage(defaultLanguage)
  return <Outlet />
}

/** English and Italian under `/en` and `/it`. */
export function PrefixedLanguageRoute() {
  const { lang } = useParams<{ lang: string }>()
  const location = useLocation()
  const { i18n } = useTranslation()

  const normalizedLang = lang ? normalizeLanguage(lang) : defaultLanguage
  useSyncLanguage(isPrefixedLanguage(lang) ? lang! : normalizedLang)

  if (lang === defaultLanguage) {
    const target =
      stripLanguagePrefix(location.pathname) + location.search + location.hash
    return <Navigate to={target} replace />
  }

  if (!lang || !isPrefixedLanguage(lang)) {
    const fallbackLang = normalizeLanguage(i18n.language)
    const target =
      localizePath(stripLanguagePrefix(location.pathname), fallbackLang) +
      location.search +
      location.hash

    return <Navigate to={target} replace />
  }

  return <Outlet />
}

export function HomeEntry() {
  const lang = getInitialLanguage()

  if (lang === 'en' || lang === 'it') {
    return <Navigate to={`/${lang}`} replace />
  }

  return <Outlet />
}

export function DePrefixRedirect() {
  const location = useLocation()
  const target =
    stripLanguagePrefix(location.pathname) + location.search + location.hash

  return <Navigate to={target} replace />
}
