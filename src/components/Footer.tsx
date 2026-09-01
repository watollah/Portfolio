import { useTranslation } from 'react-i18next'
import './Footer.css'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>{t('footer.copyright', { year })}</p>
      </div>
    </footer>
  )
}

export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to content
    </a>
  )
}
