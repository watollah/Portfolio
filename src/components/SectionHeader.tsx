import { type ReactNode } from 'react'
import './SectionHeader.css'

interface SectionHeaderProps {
  id?: string
  title?: string
  action?: ReactNode
  /** Single action aligned left (no title), e.g. mobile back link */
  leadingAction?: ReactNode
  className?: string
}

export function SectionHeader({
  id,
  title,
  action,
  leadingAction,
  className,
}: SectionHeaderProps) {
  if (leadingAction) {
    return (
      <header
        className={['section-header', 'section-header--leading-action', className]
          .filter(Boolean)
          .join(' ')}
      >
        {leadingAction}
      </header>
    )
  }

  return (
    <header className={['section-header', className].filter(Boolean).join(' ')}>
      <h2 id={id} className="section-header__title">
        {title}
      </h2>
      {action}
    </header>
  )
}
