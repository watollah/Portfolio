import type { SupportedLanguage } from '../i18n/routing'

export function localizedResumeText(
  lang: SupportedLanguage,
  en: string,
  de?: string,
  it?: string,
): string {
  if (lang === 'de') return de ?? en
  if (lang === 'it') return it ?? en
  return en
}
