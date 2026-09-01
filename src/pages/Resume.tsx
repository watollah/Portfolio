import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { education, experience, languages, skills } from '../data/projects'
import './Resume.css'

function ResumeSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="resume-section">
      <h2 className="resume-section__title">{title}</h2>
      {children}
    </section>
  )
}

function ResumeEntry({
  period,
  title,
  organization,
  description,
}: {
  period: string
  title: string
  organization: string
  description: string
}) {
  return (
    <article className="resume-entry">
      <time className="resume-entry__period">{period}</time>
      <div className="resume-entry__content">
        <h3>{title}</h3>
        <p className="resume-entry__org">{organization}</p>
        <p className="resume-entry__desc">{description}</p>
      </div>
    </article>
  )
}

export function Resume() {
  const { t, i18n } = useTranslation()
  const isDe = i18n.language === 'de'

  return (
    <div className="page resume-page">
      <header className="page__header">
        <h1>{t('resume.title')}</h1>
        <p>{t('resume.subtitle')}</p>
        <a href="/resume.pdf" className="btn btn--secondary resume-download" download>
          {t('resume.download')}
        </a>
      </header>

      <ResumeSection title={t('resume.experience')}>
        {experience.map((entry) => (
          <ResumeEntry
            key={entry.period + entry.title}
            period={entry.period}
            title={isDe ? entry.titleDe : entry.title}
            organization={isDe ? entry.organizationDe : entry.organization}
            description={isDe ? entry.descriptionDe : entry.description}
          />
        ))}
      </ResumeSection>

      <ResumeSection title={t('resume.education')}>
        {education.map((entry) => (
          <ResumeEntry
            key={entry.period + entry.title}
            period={entry.period}
            title={isDe ? entry.titleDe : entry.title}
            organization={isDe ? entry.organizationDe : entry.organization}
            description={isDe ? entry.descriptionDe : entry.description}
          />
        ))}
      </ResumeSection>

      <ResumeSection title={t('resume.skills')}>
        <div className="skills-grid">
          <div className="skills-group">
            <h3>{t('projects.architecture')}</h3>
            <ul>
              {skills.architecture.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="skills-group">
            <h3>{t('projects.software')}</h3>
            <ul>
              {skills.software.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </ResumeSection>

      <ResumeSection title={t('resume.languages')}>
        <ul className="languages-list">
          {languages.map((lang) => (
            <li key={lang.name}>
              <span>{isDe ? lang.nameDe : lang.name}</span>
              <span className="languages-list__level">{lang.level}</span>
            </li>
          ))}
        </ul>
      </ResumeSection>
    </div>
  )
}
