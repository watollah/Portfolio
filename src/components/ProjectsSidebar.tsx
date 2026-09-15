import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SectionHeader } from './SectionHeader'
import { projects } from '../data/projects'
import { pickLocalized } from '../utils/projectLocale'
import { useLocalizedPath } from '../hooks/useLocalizedPath'

interface ProjectsSidebarProps {
  activeProjectId?: string
}

export function ProjectsSidebar({ activeProjectId }: ProjectsSidebarProps) {
  const { t, i18n } = useTranslation()
  const localize = useLocalizedPath()

  const softwareProjects = projects.filter((p) => p.category === 'software')
  const architectureProjects = projects.filter((p) => p.category === 'architecture')

  const mobileHeaderLink = (
    <Link
      to={activeProjectId ? localize('/projects') : localize('/')}
      className="text-link"
      aria-label={
        activeProjectId ? t('projects.backToProjects') : t('nav.home')
      }
    >
      ← {t('projects.title')}
    </Link>
  )

  return (
    <aside className="projects-sidebar" aria-labelledby="projects-heading">
      {activeProjectId ? (
        <Link
          id="projects-heading"
          to={localize('/projects')}
          className="projects-sidebar__title projects-sidebar__title--back projects-sidebar__title--desktop"
          aria-label={t('projects.backToProjects')}
        >
          {t('projects.title')}
        </Link>
      ) : (
        <h1 id="projects-heading" className="projects-sidebar__title projects-sidebar__title--desktop">
          {t('projects.title')}
        </h1>
      )}
      <SectionHeader
        className="projects-sidebar__mobile-header"
        leadingAction={mobileHeaderLink}
      />
      <nav className="projects-sidebar__nav" aria-label={t('projects.title')}>
        <div className="projects-sidebar__group">
          <h2 className="projects-sidebar__heading">{t('projects.architecture')}</h2>
          <ul className="projects-sidebar__list">
            {architectureProjects.map((project) => {
              const isActive = project.id === activeProjectId

              return (
                <li key={project.id}>
                  <Link
                    to={localize(`/projects/${project.id}`)}
                    className={`projects-sidebar__link${isActive ? ' projects-sidebar__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pickLocalized(project, 'title', i18n.language)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="projects-sidebar__group">
          <h2 className="projects-sidebar__heading">{t('projects.software')}</h2>
          <ul className="projects-sidebar__list">
            {softwareProjects.map((project) => {
              const isActive = project.id === activeProjectId

              return (
                <li key={project.id}>
                  <Link
                    to={localize(`/projects/${project.id}`)}
                    className={`projects-sidebar__link${isActive ? ' projects-sidebar__link--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pickLocalized(project, 'title', i18n.language)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </aside>
  )
}
