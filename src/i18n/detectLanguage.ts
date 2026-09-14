export const SUPPORTED_LANGUAGES = ['de', 'en', 'it'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/** First matching browser language: de, en, or it; otherwise English. */
export function detectPreferredLanguage(): AppLanguage {
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
