import { useEffect, useRef } from 'react'
import logoSvg from '../assets/hw_animated.svg?raw'

const LOGO_ANIMATION_MS = 1870

export function HeaderLogo() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const settle = () => ref.current?.classList.add('header__brand-icon--settled')

    const startedAt = performance.now()
    const timer = window.setTimeout(settle, LOGO_ANIMATION_MS)

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      if (performance.now() - startedAt >= LOGO_ANIMATION_MS) {
        settle()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <span
      ref={ref}
      className="header__brand-icon"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  )
}
