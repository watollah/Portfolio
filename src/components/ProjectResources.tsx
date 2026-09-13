import { useTranslation } from 'react-i18next'
import { SectionHeader } from './SectionHeader'
import type { ProjectDocument, ProjectLink } from '../types/project'
import { pickLocalized } from '../utils/projectLocale'
import './ProjectResources.css'

interface ProjectResourcesProps {
  links: ProjectLink[]
  documents: ProjectDocument[]
  language: string
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatFileSize(bytes: number, locale: string) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString(locale, { maximumFractionDigits: 1 })} KB`
  }
  return `${(bytes / (1024 * 1024)).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`
}

function LinkItem({ link, language }: { link: ProjectLink; language: string }) {
  const title = pickLocalized(link, 'title', language)
  const description = pickLocalized(link, 'description', language)
  const hostname = getHostname(link.url)

  return (
    <li className="project-resources__link-item">
      <a
        href={link.url}
        className="project-resources__link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="project-resources__link-title">{title}</span>
        {description && <span className="project-resources__link-description">{description}</span>}
        <span className="project-resources__link-meta">
          {hostname}
          <span className="material-icons" aria-hidden="true">
            open_in_new
          </span>
        </span>
      </a>
    </li>
  )
}

function DocumentCard({ document, language }: { document: ProjectDocument; language: string }) {
  const { t, i18n } = useTranslation()
  const title = pickLocalized(document, 'title', language)
  const description = pickLocalized(document, 'description', language)
  const sizeLabel = formatFileSize(document.size, i18n.language)
  const showPdfEmbed = document.kind === 'pdf' && !document.previewUrl

  return (
    <a href={document.url} className="resource-card resource-card--document" target="_blank" rel="noopener noreferrer">
      <div className="resource-card__preview">
        {document.previewUrl ? (
          <img className="resource-card__preview-image" src={document.previewUrl} alt="" loading="lazy" />
        ) : showPdfEmbed ? (
          <>
            <embed
              className="resource-card__pdf-embed"
              src={`${document.url}#page=1&view=FitH&toolbar=0&navpanes=0`}
              type="application/pdf"
              aria-hidden="true"
            />
            <div className="resource-card__preview-fallback resource-card__preview-fallback--pdf resource-card__preview-fallback--mobile">
              <span className="material-icons" aria-hidden="true">
                picture_as_pdf
              </span>
              <span className="resource-card__file-type">PDF</span>
            </div>
          </>
        ) : (
          <div className={`resource-card__preview-fallback resource-card__preview-fallback--${document.kind}`}>
            <span className="material-icons" aria-hidden="true">
              {document.kind === 'pdf' ? 'picture_as_pdf' : 'description'}
            </span>
            <span className="resource-card__file-type">{document.kind.toUpperCase()}</span>
          </div>
        )}
        <span className="resource-card__badge">{t('projects.resourceDocument')}</span>
      </div>
      <div className="resource-card__body">
        <h3 className="resource-card__title">{title}</h3>
        {description && <p className="resource-card__description">{description}</p>}
        <span className="resource-card__action">
          {document.kind.toUpperCase()} · {sizeLabel}
          <span className="material-icons" aria-hidden="true">
            download
          </span>
        </span>
      </div>
    </a>
  )
}

export function ProjectResources({ links, documents, language }: ProjectResourcesProps) {
  const { t } = useTranslation()

  if (links.length === 0 && documents.length === 0) {
    return null
  }

  return (
    <section className="project-resources" aria-label={t('projects.resources')}>
      {documents.length > 0 && (
        <div className="project-resources__section">
          <SectionHeader title={t('projects.documents')} />
          <div className="project-resources__grid">
            {documents.map((document) => (
              <DocumentCard key={document.url} document={document} language={language} />
            ))}
          </div>
        </div>
      )}
      {links.length > 0 && (
        <div className="project-resources__section">
          <SectionHeader title={t('projects.links')} />
          <ul className="project-resources__links">
            {links.map((link) => (
              <LinkItem key={link.url} link={link} language={language} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
