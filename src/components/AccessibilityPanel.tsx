import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccessibility, type FontSize } from '../context/AccessibilityContext'
import './AccessibilityPanel.css'

type AccessibilityPanelProps = {
  variant?: 'popover' | 'menu'
}

function AccessibilityControls({ showHeading = true }: { showHeading?: boolean }) {
  const { t } = useTranslation()
  const { fontSize, highContrast, reducedMotion, setFontSize, setHighContrast, setReducedMotion } =
    useAccessibility()

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: t('a11y.fontSmall') },
    { value: 'medium', label: t('a11y.fontMedium') },
    { value: 'large', label: t('a11y.fontLarge') },
    { value: 'xlarge', label: t('a11y.fontXLarge') },
  ]

  return (
    <>
      {showHeading && <p className="a11y__heading">{t('a11y.title')}</p>}

      <fieldset className="a11y__group">
        <legend>{t('a11y.fontSize')}</legend>
        <div className="a11y__options">
          {fontSizes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`a11y__option ${fontSize === value ? 'a11y__option--active' : ''}`}
              onClick={() => setFontSize(value)}
              aria-pressed={fontSize === value}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="a11y__checkbox">
        <input
          type="checkbox"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
        />
        {t('a11y.highContrast')}
      </label>

      <label className="a11y__checkbox">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(e) => setReducedMotion(e.target.checked)}
        />
        {t('a11y.reducedMotion')}
      </label>
    </>
  )
}

export function AccessibilityPanel({ variant = 'popover' }: AccessibilityPanelProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (variant === 'menu' || !open) return

    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, variant])

  if (variant === 'menu') {
    return (
      <div className="a11y a11y--menu">
        <button
          type="button"
          className="header__link a11y__menu-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="a11y-menu-panel"
        >
          <span className="material-icons header__menu-icon" aria-hidden="true">
            accessibility
          </span>
          {t('a11y.title')}
        </button>

        {open && (
          <div id="a11y-menu-panel" className="a11y__menu-panel" role="region" aria-label={t('a11y.title')}>
            <AccessibilityControls showHeading={false} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="a11y">
      <button
        ref={buttonRef}
        type="button"
        className="a11y__toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? t('a11y.close') : t('a11y.open')}
      >
        <span className="material-icons" aria-hidden="true">
          accessibility
        </span>
      </button>

      {open && (
        <div ref={panelRef} className="a11y__panel" role="dialog" aria-label={t('a11y.title')}>
          <AccessibilityControls />
        </div>
      )}
    </div>
  )
}
