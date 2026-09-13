import { useTranslation } from 'react-i18next'
import { ProjectCard } from '../components/ProjectCard'
import { SectionHeader } from '../components/SectionHeader'
import { projects } from '../data/projects'

export function Projects() {
  const { t } = useTranslation()

  const softwareProjects = projects.filter((p) => p.category === 'software')
  const architectureProjects = projects.filter((p) => p.category === 'architecture')

  return (
    <>
      <section className="projects-section" aria-labelledby="architecture-heading">
        <SectionHeader id="architecture-heading" title={t('projects.architecture')} />
        <div className="projects-grid">
          {architectureProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="projects-section" aria-labelledby="software-heading">
        <SectionHeader id="software-heading" title={t('projects.software')} />
        <div className="projects-grid">
          {softwareProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </>
  )
}
