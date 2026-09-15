import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface ProjectCardOverlayContextValue {
  revealedProjectId: string | null
  setRevealedProjectId: (projectId: string | null) => void
}

const ProjectCardOverlayContext = createContext<ProjectCardOverlayContextValue | null>(
  null,
)

export function ProjectCardOverlayProvider({ children }: { children: ReactNode }) {
  const [revealedProjectId, setRevealedProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (!revealedProjectId) return

    function handlePointerDown(event: PointerEvent) {
      const card = (event.target as Element | null)?.closest('.project-card') as
        | HTMLElement
        | null
      if (card?.id === revealedProjectId) return
      setRevealedProjectId(null)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [revealedProjectId])

  const value = useMemo(
    () => ({ revealedProjectId, setRevealedProjectId }),
    [revealedProjectId],
  )

  return (
    <ProjectCardOverlayContext.Provider value={value}>
      {children}
    </ProjectCardOverlayContext.Provider>
  )
}

export function useProjectCardOverlay() {
  const context = useContext(ProjectCardOverlayContext)
  if (!context) {
    throw new Error('useProjectCardOverlay must be used within ProjectCardOverlayProvider')
  }
  return context
}
