import { normalizeLanguage } from '../i18n/routing'

export function pickLocalized<T extends object>(
  item: T,
  field: keyof T & string,
  language: string,
): string {
  const lang = normalizeLanguage(language)
  const record = item as Record<string, unknown>
  const base = record[field]
  const fallback = typeof base === 'string' ? base : ''

  if (lang === 'de') {
    const de = record[`${field}De`]
    return typeof de === 'string' && de ? de : fallback
  }

  if (lang === 'it') {
    const it = record[`${field}It`]
    return typeof it === 'string' && it ? it : fallback
  }

  return fallback
}
