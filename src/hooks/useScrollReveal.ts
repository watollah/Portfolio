import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  if (document.documentElement.getAttribute('data-motion') === 'reduced') return true
  if (document.documentElement.getAttribute('data-motion') === 'normal') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (prefersReducedMotion()) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      {
        root: null,
        rootMargin: '0px 0px -6% 0px',
        threshold: 0.06,
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const revealClassName = visible ? 'scroll-reveal scroll-reveal--visible' : 'scroll-reveal'

  return { ref, visible, revealClassName }
}
