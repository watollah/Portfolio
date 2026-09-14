export const supportedLanguages = ['de', 'en', 'it'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const defaultLanguage: SupportedLanguage = 'de'

/** Languages that use a URL prefix (`/en`, `/it`). German uses unprefixed paths. */
export const prefixedLanguages = ['en', 'it'] as const
export type PrefixedLanguage = (typeof prefixedLanguages)[number]

export function isSupportedLanguage(code: string | null | undefined): code is SupportedLanguage {
  return supportedLanguages.includes(code as SupportedLanguage)
}

export function isPrefixedLanguage(code: string | null | undefined): code is PrefixedLanguage {
  return prefixedLanguages.includes(code as PrefixedLanguage)
}

export function normalizeLanguage(code: string | null | undefined): SupportedLanguage {
  if (code?.startsWith('de')) return 'de'
  if (code?.startsWith('it')) return 'it'
  return 'en'
}

export function detectBrowserLanguage(): SupportedLanguage {
  const candidates =
    typeof navigator !== 'undefined' && navigator.languages?.length
      ? navigator.languages
      : typeof navigator !== 'undefined' && navigator.language
        ? [navigator.language]
        : []

  for (const raw of candidates) {
    const code = raw.split('-')[0]?.toLowerCase()
    if (code === 'de' || code === 'en' || code === 'it') {
      return code
    }
  }

  return 'en'
}

export function getLanguageFromPathname(pathname: string): SupportedLanguage | null {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  if (first === 'en' || first === 'it') {
    return first
  }

  if (first === 'de') {
    return 'de'
  }

  return null
}

export function resolveLanguageFromPathname(pathname: string): SupportedLanguage {
  return getLanguageFromPathname(pathname) ?? defaultLanguage
}

export function stripLanguagePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) {
    return '/'
  }

  const first = segments[0]
  if (first === 'de' || first === 'en' || first === 'it') {
    const rest = segments.slice(1)
    return rest.length > 0 ? `/${rest.join('/')}` : '/'
  }

  return pathname || '/'
}

export function localizePath(path: string, lang: SupportedLanguage): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const pathWithoutLanguage = stripLanguagePrefix(normalizedPath)

  if (lang === defaultLanguage) {
    return pathWithoutLanguage
  }

  if (pathWithoutLanguage === '/') {
    return `/${lang}`
  }

  return `/${lang}${pathWithoutLanguage}`
}

export function getInitialLanguage(): SupportedLanguage {
  const urlLang = getLanguageFromPathname(window.location.pathname)
  if (urlLang) {
    return urlLang
  }

  const savedLang = localStorage.getItem('portfolio-lang')
  if (isSupportedLanguage(savedLang)) {
    return savedLang
  }

  return detectBrowserLanguage()
}
