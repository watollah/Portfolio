import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ProfileIntro } from '../components/ProfileIntro'
import { education, experience, languages, publications, skills } from '../data/projects'
import { normalizeLanguage } from '../i18n/routing'
import { localizeResumeEntry } from '../utils/localizeResumeEntry'
import { localizedResumeText } from '../utils/resumeContent'
import '../components/ProjectResources.css'
import './Resume.css'

function publicationHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

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
  const lang = normalizeLanguage(i18n.language)
  const softwareSkills = skills.software[lang]

  return (
    <div className="page resume-page">
      <header className="resume-page__profile">
        <ProfileIntro variant="resume" showDownload />
      </header>

      <ResumeSection title={t('resume.experience')}>
        {experience.map((entry) => {
          const localized = localizeResumeEntry(lang, entry)
          return (
            <ResumeEntry
              key={entry.period + entry.title}
              period={localized.period}
              title={localized.title}
              organization={localized.organization}
              description={localized.description}
              grade={localized.grade}
              logo={localized.logo}
            />
          )
        })}
      </ResumeSection>

      <ResumeSection title={t('resume.education')}>
        {education.map((entry) => {
          const localized = localizeResumeEntry(lang, entry)
          return (
            <ResumeEntry
              key={entry.period + entry.title}
              period={localized.period}
              title={localized.title}
              organization={localized.organization}
              description={localized.description}
              grade={localized.grade}
              logo={localized.logo}
            />
          )
        })}
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
              {softwareSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </ResumeSection>

      <ResumeSection title={t('resume.languages')}>
        <ul className="languages-list">
          {languages.map((langEntry) => (
            <li key={langEntry.name}>
              <span>
                {localizedResumeText(
                  lang,
                  langEntry.name,
                  langEntry.nameDe,
                  langEntry.nameIt,
                )}
              </span>
              <span className="languages-list__level">
                {'levelKey' in langEntry && langEntry.levelKey
                  ? t(`resume.proficiency.${langEntry.levelKey}`)
                  : langEntry.level}
              </span>
            </li>
          ))}
        </ul>
      </ResumeSection>

      <ResumeSection title={t('resume.publications')}>
        <ul className="project-resources__links">
          {publications.map((publication) => (
            <li key={publication.url} className="project-resources__link-item">
              <a
                href={publication.url}
                className="project-resources__link"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="project-resources__link-title">{publication.title}</span>
                <span className="project-resources__link-description">{publication.description}</span>
                <span className="project-resources__link-meta">
                  {publicationHostname(publication.url)}
                  <span className="material-icons" aria-hidden="true">
                    open_in_new
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </ResumeSection>
    </div>
  )
}
