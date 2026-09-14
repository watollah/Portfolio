import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { education, experience, languages, skills } from '../data/projects'
import {
  resumeEntryDescription,
  resumeEntryOrganization,
  resumeEntryTitle,
} from '../i18n/localizedContent'
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
  const locale = i18n.language

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
            title={resumeEntryTitle(entry, locale)}
            organization={resumeEntryOrganization(entry, locale)}
            description={resumeEntryDescription(entry, locale)}
          />
        ))}
      </ResumeSection>

      <ResumeSection title={t('resume.education')}>
        {education.map((entry) => (
          <ResumeEntry
            key={entry.period + entry.title}
            period={entry.period}
            title={resumeEntryTitle(entry, locale)}
            organization={resumeEntryOrganization(entry, locale)}
            description={resumeEntryDescription(entry, locale)}
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
          {languages.map((language) => (
            <li key={language.name}>
              <span>
                {locale.startsWith('de')
                  ? language.nameDe
                  : locale.startsWith('it')
                    ? language.nameIt
                    : language.name}
              </span>
              <span className="languages-list__level">
                {locale.startsWith('it') ? language.levelIt : language.level}
              </span>
            </li>
          ))}
        </ul>
      </ResumeSection>
    </div>
  )
}
