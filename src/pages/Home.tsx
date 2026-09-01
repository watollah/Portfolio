import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import './Home.css'

export function Home() {
  const { t } = useTranslation()

  return (
    <section className="hero">
      <div className="hero__content">
        <h1 className="hero__title">{t('hero.title')}</h1>
        <p className="hero__subtitle">{t('hero.subtitle')}</p>
        <div className="hero__actions">
          <Link to="/projects" className="btn btn--primary">
            {t('nav.projects')}
          </Link>
          <Link to="/resume" className="btn btn--secondary">
            {t('nav.resume')}
          </Link>
        </div>
      </div>
      <div className="hero__line" aria-hidden="true" />
    </section>
  )
}
