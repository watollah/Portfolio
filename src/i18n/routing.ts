export const supportedLanguages = ['de', 'en', 'it'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export function isSupportedLanguage(code: string | null | undefined): code is SupportedLanguage {
  return supportedLanguages.includes(code as SupportedLanguage)
}

export function normalizeLanguage(code: string | null | undefined): SupportedLanguage {
  if (code?.startsWith('de')) return 'de'
  if (code?.startsWith('it')) return 'it'
  return 'en'
}

export function detectBrowserLanguage(): SupportedLanguage {
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith('de')) return 'de'
  if (nav.startsWith('it')) return 'it'
  return 'en'
}

export function getLanguageFromPathname(pathname: string): SupportedLanguage | null {
  const segments = pathname.split('/').filter(Boolean)

  for (const segment of segments) {
    if (isSupportedLanguage(segment)) {
      return segment
    }
  }

  return null
}

export function stripLanguagePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length > 0 && isSupportedLanguage(segments[0])) {
    const rest = segments.slice(1)
    return rest.length > 0 ? `/${rest.join('/')}` : '/'
  }

  return pathname || '/'
}

export function localizePath(path: string, lang: SupportedLanguage): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const pathWithoutLanguage = stripLanguagePrefix(normalizedPath)

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
