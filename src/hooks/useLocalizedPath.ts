import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { localizePath, normalizeLanguage } from '../i18n/routing'

export function useLocalizedPath() {
  const { lang } = useParams<{ lang?: string }>()
  const { i18n } = useTranslation()
  const currentLang = normalizeLanguage(lang ?? i18n.language)

  return useCallback((path: string) => localizePath(path, currentLang), [currentLang])
}
