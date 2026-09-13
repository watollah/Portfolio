import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ProfileIntro } from '../components/ProfileIntro'
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
  grade,
  logo,
}: {
  period: string
  title: string
  organization: string
  description?: string
  grade?: string
  logo?: string
}) {
  return (
    <article className="resume-entry">
      <time className="resume-entry__period">{period}</time>
      <div className="resume-entry__content">
        <div className="resume-entry__identity">
          {logo && (
            <img
              className="resume-entry__logo"
              src={logo}
              alt=""
              aria-hidden="true"
            />
          )}
          <div className="resume-entry__labels">
            <h3>{title}</h3>
            <div className="resume-entry__meta">
              <p className="resume-entry__org">{organization}</p>
              {grade && <p className="resume-entry__grade">{grade}</p>}
            </div>
          </div>
        </div>
        {description && <p className="resume-entry__desc">{description}</p>}
      </div>
    </article>
  )
}

export function Resume() {
  const { t, i18n } = useTranslation()
  const isDe = i18n.language === 'de'

  return (
    <div className="page resume-page">
      <header className="resume-page__profile">
        <ProfileIntro variant="resume" showDownload />
      </header>

      <ResumeSection title={t('resume.experience')}>
        {experience.map((entry) => (
          <ResumeEntry
            key={entry.period + entry.title}
            period={isDe && entry.periodDe ? entry.periodDe : entry.period}
            title={isDe ? entry.titleDe : entry.title}
            organization={isDe ? entry.organizationDe : entry.organization}
            description={isDe ? entry.descriptionDe : entry.description}
            grade={isDe ? entry.gradeDe ?? entry.grade : entry.grade}
            logo={entry.logo}
          />
        ))}
      </ResumeSection>

      <ResumeSection title={t('resume.education')}>
        {education.map((entry) => (
          <ResumeEntry
            key={entry.period + entry.title}
            period={isDe && entry.periodDe ? entry.periodDe : entry.period}
            title={isDe ? entry.titleDe : entry.title}
            organization={isDe ? entry.organizationDe : entry.organization}
            description={isDe ? entry.descriptionDe : entry.description}
            grade={isDe ? entry.gradeDe ?? entry.grade : entry.grade}
            logo={entry.logo}
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
              <span className="languages-list__level">
                {'levelKey' in lang && lang.levelKey
                  ? t(`resume.proficiency.${lang.levelKey}`)
                  : lang.level}
              </span>
            </li>
          ))}
        </ul>
      </ResumeSection>
    </div>
  )
}
