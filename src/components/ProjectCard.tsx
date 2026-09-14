import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Project } from '../types/project'
import { pickLocalized } from '../utils/projectLocale'
import { useLocalizedPath } from '../hooks/useLocalizedPath'
import { useScrollReveal } from '../hooks/useScrollReveal'
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
  const { ref: cardRef, revealClassName } = useScrollReveal<HTMLAnchorElement>()
  const [revealed, setRevealed] = useState(false)
  const suppressNavigationRef = useRef(false)

  useEffect(() => {
    if (!revealed) return

    function handlePointerDownOutside(event: PointerEvent) {
      if (cardRef.current?.contains(event.target as Node)) return
      setRevealed(false)
    }

    document.addEventListener('pointerdown', handlePointerDownOutside)
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside)
  }, [revealed])

  function handlePointerDown(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === 'mouse') return

    if (!revealed) {
      suppressNavigationRef.current = true
      setRevealed(true)
    }
  }

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (suppressNavigationRef.current) {
      event.preventDefault()
      suppressNavigationRef.current = false
    }
  }

  return (
    <Link
      ref={cardRef}
      id={project.id}
      to={localize(`/projects/${project.id}`)}
      className={[
        'project-card',
        revealClassName,
        hasCover ? '' : 'project-card--no-cover',
        revealed ? 'project-card--revealed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <span
        className={`project-card__media${hasCover ? '' : ' project-card__media--no-cover'}`}
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
      </span>
    </Link>
  )
}
