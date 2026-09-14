import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  defaultLanguage,
  detectBrowserLanguage,
  isPrefixedLanguage,
  localizePath,
  normalizeLanguage,
  stripLanguagePrefix,
} from '../i18n/routing'

function useSyncLanguage(lang: string) {
  const { i18n } = useTranslation()

  useEffect(() => {
    const normalized = normalizeLanguage(lang)
    if (normalizeLanguage(i18n.language) !== normalized) {
      void i18n.changeLanguage(normalized)
    }
    // Route language is the source of truth — do not depend on i18n or we revert mid-navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- i18n instance is stable
  }, [lang])
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
  const sessionKey = 'portfolio-home-lang-redirect'

  if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(sessionKey)) {
    sessionStorage.setItem(sessionKey, '1')
    const browserLang = detectBrowserLanguage()
    if (browserLang === 'en' || browserLang === 'it') {
      return <Navigate to={`/${browserLang}`} replace />
    }
  }

  return <Outlet />
}

export function DePrefixRedirect() {
  const location = useLocation()
  const target =
    stripLanguagePrefix(location.pathname) + location.search + location.hash

  return <Navigate to={target} replace />
}
