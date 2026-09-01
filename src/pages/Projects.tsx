import { useTranslation } from 'react-i18next'
import { ProjectCard } from '../components/ProjectCard'
import { projects } from '../data/projects'
import './Projects.css'

export function Projects() {
  const { t } = useTranslation()

  const softwareProjects = projects.filter((p) => p.category === 'software')
  const architectureProjects = projects.filter((p) => p.category === 'architecture')

  return (
    <div className="page projects-page">
      <header className="page__header">
        <h1>{t('projects.title')}</h1>
        <p>{t('projects.subtitle')}</p>
      </header>

      <section className="projects-section" aria-labelledby="software-heading">
        <h2 id="software-heading" className="projects-section__title">
          {t('projects.software')}
        </h2>
        <div className="projects-grid">
          {softwareProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="projects-section" aria-labelledby="architecture-heading">
        <h2 id="architecture-heading" className="projects-section__title">
          {t('projects.architecture')}
        </h2>
        <div className="projects-grid">
          {architectureProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </div>
  )
}
