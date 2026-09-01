import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { AccessibilityPanel } from './AccessibilityPanel'
import './Header.css'

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__brand">
          Hannes Watolla
        </Link>

        <nav className="header__nav" aria-label="Main navigation">
          <Link
            to="/projects"
            className={`header__link ${isActive('/projects') ? 'header__link--active' : ''}`}
          >
            {t('nav.projects')}
          </Link>
          <Link
            to="/resume"
            className={`header__link ${isActive('/resume') ? 'header__link--active' : ''}`}
          >
            {t('nav.resume')}
          </Link>
          <AccessibilityPanel />
        </nav>
      </div>
    </header>
  )
}
