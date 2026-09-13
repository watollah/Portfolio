import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { AccessibilityPanel } from './AccessibilityPanel'
import { HeaderLogo } from './HeaderLogo'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLocalizedPath } from '../hooks/useLocalizedPath'
import './Header.css'

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const localize = useLocalizedPath()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const isActive = (path: string) => {
    const localizedPath = localize(path)
    return (
      location.pathname === localizedPath ||
      location.pathname.startsWith(`${localizedPath}/`)
    )
  }

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const navLinks = (
    <>
      <Link
        to={localize('/projects')}
        className={`header__link ${isActive('/projects') ? 'header__link--active' : ''}`}
        aria-current={isActive('/projects') ? 'page' : undefined}
        onClick={() => setMenuOpen(false)}
      >
        {t('nav.projects')}
      </Link>
      <Link
        to={localize('/resume')}
        className={`header__link ${isActive('/resume') ? 'header__link--active' : ''}`}
        aria-current={isActive('/resume') ? 'page' : undefined}
        onClick={() => setMenuOpen(false)}
      >
        {t('nav.resume')}
      </Link>
    </>
  )

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="header__backdrop"
          onClick={() => setMenuOpen(false)}
          aria-label={t('nav.closeMenu')}
          tabIndex={-1}
        />
      )}

      <header className={`header${menuOpen ? ' header--menu-open' : ''}`}>
      <div className="header__inner">
        <div className="header__start">
          <Link to={localize('/')} className="header__brand">
            <HeaderLogo />
            Hannes Watolla
          </Link>
        </div>

        <div className="header__actions">
          <nav className="header__links" aria-label="Main navigation">
            {navLinks}
          </nav>

          <div className="header__tools header__tools--desktop">
            <AccessibilityPanel />
            <LanguageSwitcher />
          </div>

          <button
            ref={toggleRef}
            type="button"
            className="header__menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="header-menu"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path d="M2 4.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          id="header-menu"
          className="header__menu"
          role="dialog"
          aria-label={t('nav.menu')}
        >
          <nav className="header__menu-nav" aria-label="Main navigation">
            {navLinks}
          </nav>
          <div className="header__menu-tools">
            <LanguageSwitcher variant="menu" onSwitch={() => setMenuOpen(false)} />
            <AccessibilityPanel variant="menu" />
          </div>
        </div>
      )}
    </header>
    </>
  )
}
