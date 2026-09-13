import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router-dom'
import { ProjectBlocks } from '../components/ProjectBlocks'
import { ProjectResources } from '../components/ProjectResources'
import { getProjectById } from '../data/projects'
import { useLocalizedPath } from '../hooks/useLocalizedPath'
import { pickLocalized } from '../utils/projectLocale'
import './ProjectDetail.css'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const localize = useLocalizedPath()
  const project = id ? getProjectById(id) : undefined

  if (!project) {
    return <Navigate to={localize('/projects')} replace />
  }

  const title = pickLocalized(project, 'title', i18n.language)
  const description = pickLocalized(project, 'description', i18n.language)
  const context = pickLocalized(project, 'context', i18n.language)
  const subtitle = [project.year, context].filter(Boolean).join(', ')
  const bannerUrl = project.bannerUrl ?? project.coverUrl

  return (
    <article className="project-detail">
      <header className="project-detail__header">
        {bannerUrl ? (
          <div className="project-detail__banner">
            <img
              className="project-detail__banner-image"
              src={bannerUrl}
              alt=""
              decoding="async"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
            <h1 className="project-detail__banner-title">{title}</h1>
          </div>
        ) : (
          <h1 className="project-detail__banner-title project-detail__banner-title--fallback">{title}</h1>
        )}
        {subtitle && (
          <div className="project-detail__header-meta">
            <p className="project-detail__subtitle">{subtitle}</p>
          </div>
        )}
        {description && (
          <p className="project-detail__description project-caption-text">{description}</p>
        )}
        {project.tags.length > 0 && (
          <div className="project-detail__header-meta">
            <ul className="project-detail__tags" aria-label={t('projects.tags')}>
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <ProjectBlocks blocks={project.blocks} language={i18n.language} ariaLabel={title} />

      <ProjectResources links={project.links} documents={project.documents} language={i18n.language} />

      {project.authors && project.authors.length > 0 && (
        <p className="project-detail__authors project-caption-text">
          {t('projects.createdBy', { authors: project.authors.join(', ') })}
        </p>
      )}
    </article>
  )
}
