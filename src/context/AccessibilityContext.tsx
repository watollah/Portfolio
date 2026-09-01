import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge'

interface AccessibilitySettings {
  fontSize: FontSize
  highContrast: boolean
  reducedMotion: boolean
}

interface AccessibilityContextValue extends AccessibilitySettings {
  setFontSize: (size: FontSize) => void
  setHighContrast: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
}

const STORAGE_KEY = 'portfolio-a11y'

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
}

function loadSettings(): AccessibilitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) }
  } catch {
    /* ignore */
  }
  return defaultSettings
}

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement
  root.dataset.fontSize = settings.fontSize
  root.dataset.contrast = settings.highContrast ? 'high' : 'normal'
  root.dataset.motion = settings.reducedMotion ? 'reduced' : 'normal'
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings)

  useEffect(() => {
    applySettings(settings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const setFontSize = useCallback((fontSize: FontSize) => {
    setSettings((s) => ({ ...s, fontSize }))
  }, [])

  const setHighContrast = useCallback((highContrast: boolean) => {
    setSettings((s) => ({ ...s, highContrast }))
  }, [])

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setSettings((s) => ({ ...s, reducedMotion }))
  }, [])

  return (
    <AccessibilityContext.Provider
      value={{ ...settings, setFontSize, setHighContrast, setReducedMotion }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider')
  return ctx
}
