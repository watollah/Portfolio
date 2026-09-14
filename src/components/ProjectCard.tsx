import { useTranslation } from 'react-i18next'
import { projectDescription, projectTitle } from '../i18n/localizedContent'
import type { Project } from '../data/projects'
import './ProjectCard.css'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { i18n, t } = useTranslation()

  const title = projectTitle(project, i18n.language)
  const description = projectDescription(project, i18n.language)

  const content = (
    <>
      <div className="project-card__meta">
        <span className="project-card__year">{project.year}</span>
      </div>
      <h3 className="project-card__title">{title}</h3>
      <p className="project-card__description">{description}</p>
      <ul className="project-card__tags" aria-label="Technologies">
        {project.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      {project.url && (
        <span className="project-card__link">{t('projects.viewProject')} →</span>
      )}
    </>
  )

  if (project.url) {
    return (
      <a
        href={project.url}
        className="project-card"
        target={project.url.startsWith('http') ? '_blank' : undefined}
        rel={project.url.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    )
  }

  return <article className="project-card project-card--static">{content}</article>
}
