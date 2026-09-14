import type { ReactNode } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'

interface ScrollRevealProps {
  className?: string
  children: ReactNode
}

export function ScrollReveal({ className, children }: ScrollRevealProps) {
  const { ref, revealClassName } = useScrollReveal<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={[revealClassName, className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
