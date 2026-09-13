import { type ReactNode } from 'react'
import './SectionHeader.css'

interface SectionHeaderProps {
  id?: string
  title: string
  action?: ReactNode
}

export function SectionHeader({ id, title, action }: SectionHeaderProps) {
  return (
    <header className="section-header">
      <h2 id={id} className="section-header__title">
        {title}
      </h2>
      {action}
    </header>
  )
}
