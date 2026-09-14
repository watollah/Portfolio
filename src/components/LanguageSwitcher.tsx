import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  localizePath,
  normalizeLanguage,
  stripLanguagePrefix,
  type SupportedLanguage,
} from '../i18n/routing'
import './LanguageSwitcher.css'

const languages: {
  code: SupportedLanguage
  shortLabel: string
  nameKey: 'lang.de' | 'lang.en' | 'lang.it'
}[] = [
  { code: 'de', shortLabel: 'DEU', nameKey: 'lang.de' },
  { code: 'en', shortLabel: 'ENG', nameKey: 'lang.en' },
  { code: 'it', shortLabel: 'ITA', nameKey: 'lang.it' },
]

type LanguageSwitcherProps = {
  variant?: 'header' | 'menu'
  onSwitch?: () => void
}

export function LanguageSwitcher({ variant = 'header', onSwitch }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const currentCode = normalizeLanguage(i18n.language)
  const current = languages.find((language) => language.code === currentCode) ?? languages[1]

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function selectLanguage(code: SupportedLanguage) {
    const pathWithoutLanguage = stripLanguagePrefix(location.pathname)
    const nextPath = localizePath(pathWithoutLanguage, code) + location.search + location.hash

    navigate(nextPath)
    setOpen(false)
    onSwitch?.()
  }

  const dropdown = (
    <>
      <button
        ref={toggleRef}
        type="button"
        className="header__link lang-switcher__toggle"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.select')}
      >
        {current.shortLabel}
        <span className="lang-switcher__chevron material-icons" aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <ul className="lang-switcher__menu" role="listbox" aria-label={t('lang.select')}>
          {languages.map((language) => {
            const isActive = language.code === currentCode
            const languageName = t(language.nameKey)

            return (
              <li key={language.code} role="presentation">
                <button
                  type="button"
                  className={`lang-switcher__option${isActive ? ' lang-switcher__option--active' : ''}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectLanguage(language.code)}
                >
                  <span className="lang-switcher__option-name">{languageName}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )

  if (variant === 'menu') {
    return (
      <div
        ref={containerRef}
        className="lang-switcher lang-switcher--menu"
        role="group"
        aria-label={t('lang.select')}
      >
        <div className="lang-switcher__menu-row">
          <span className="header__link lang-switcher__menu-label">
            <span className="material-icons header__menu-icon" aria-hidden="true">
              language
            </span>
            {t('lang.label')}
          </span>
          <div className="lang-switcher__menu-dropdown">{dropdown}</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="lang-switcher">
      {dropdown}
    </div>
  )
}
