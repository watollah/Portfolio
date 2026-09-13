import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Project } from '../types/project'
import { pickLocalized } from '../utils/projectLocale'
import { useLocalizedPath } from '../hooks/useLocalizedPath'
import './ProjectCard.css'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { i18n } = useTranslation()
  const title = pickLocalized(project, 'title', i18n.language)
  const description = pickLocalized(project, 'description', i18n.language)
  const localize = useLocalizedPath()
  const hasCover = Boolean(project.coverUrl)

  return (
    <Link
      id={project.id}
      to={localize(`/projects/${project.id}`)}
      className={`project-card${hasCover ? '' : ' project-card--no-cover'}`}
    >
      {hasCover ? (
        <img
          className="project-card__image"
          src={project.coverUrl}
          srcSet={project.coverSrcSet}
          alt=""
          loading="lazy"
          decoding="async"
          width={project.coverWidth}
          height={project.coverHeight}
          sizes="(max-width: 640px) 100vw, (max-width: 1152px) 50vw, 560px"
        />
      ) : (
        <div className="project-card__placeholder" aria-hidden="true" />
      )}
      <div className="project-card__overlay">
        <span className="project-card__year">{project.year}</span>
        <h3 className="project-card__title">{title}</h3>
        {description ? (
          <p className="project-card__description">{description}</p>
        ) : null}
      </div>
    </Link>
  )
}
