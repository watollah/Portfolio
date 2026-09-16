import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useProjectCardOverlay } from '../context/ProjectCardOverlayContext'
import type { Project } from '../types/project'
import { pickLocalized } from '../utils/projectLocale'
import { useLocalizedPath } from '../hooks/useLocalizedPath'
import { useScrollReveal } from '../hooks/useScrollReveal'
import './ProjectCard.css'

interface ProjectCardProps {
  project: Project
  /** Eager-load cover and show without scroll-reveal delay (first tile on home, etc.). */
  priority?: boolean
}

const LONG_PRESS_MS = 450
const LONG_PRESS_MOVE_CANCEL_PX = 12

export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  const { i18n } = useTranslation()
  const title = pickLocalized(project, 'title', i18n.language)
  const description = pickLocalized(project, 'description', i18n.language)
  const localize = useLocalizedPath()
  const hasCover = Boolean(project.coverUrl)
  const { ref: cardRef, revealClassName } = useScrollReveal<HTMLAnchorElement>({
    initiallyVisible: priority,
  })
  const { revealedProjectId, setRevealedProjectId } = useProjectCardOverlay()
  const revealed = revealedProjectId === project.id

  const suppressNavigationRef = useRef(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const pressStartRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === 'mouse') return

    clearLongPressTimer()
    longPressTriggeredRef.current = false

    if (revealed) return

    pressStartRef.current = { x: event.clientX, y: event.clientY }

    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      longPressTriggeredRef.current = true
      suppressNavigationRef.current = true
      setRevealedProjectId(project.id)
    }, LONG_PRESS_MS)
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === 'mouse' || !longPressTimerRef.current) return

    const deltaX = Math.abs(event.clientX - pressStartRef.current.x)
    const deltaY = Math.abs(event.clientY - pressStartRef.current.y)
    if (deltaX > LONG_PRESS_MOVE_CANCEL_PX || deltaY > LONG_PRESS_MOVE_CANCEL_PX) {
      clearLongPressTimer()
    }
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === 'mouse') return
    clearLongPressTimer()
  }

  function handlePointerCancel() {
    clearLongPressTimer()
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
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
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
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
