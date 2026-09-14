import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { localizePath, resolveLanguageFromPathname } from '../i18n/routing'

export function useLocalizedPath() {
  const { pathname } = useLocation()
  const currentLang = resolveLanguageFromPathname(pathname)

  return useCallback((path: string) => localizePath(path, currentLang), [currentLang])
}
