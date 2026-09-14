import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/detectLanguage'
import { useAccessibility, type FontSize } from '../context/AccessibilityContext'
import './AccessibilityPanel.css'

export function AccessibilityPanel() {
  const { t, i18n } = useTranslation()
  const { fontSize, highContrast, reducedMotion, setFontSize, setHighContrast, setReducedMotion } =
    useAccessibility()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

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
  }, [open])

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small', label: t('a11y.fontSmall') },
    { value: 'medium', label: t('a11y.fontMedium') },
    { value: 'large', label: t('a11y.fontLarge') },
    { value: 'xlarge', label: t('a11y.fontXLarge') },
  ]

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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 8v4M8 20h8M10 14h4l1 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div ref={panelRef} className="a11y__panel" role="dialog" aria-label={t('a11y.title')}>
          <p className="a11y__heading">{t('a11y.title')}</p>

          <fieldset className="a11y__group">
            <legend>{t('a11y.language')}</legend>
            <div className="a11y__options">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`a11y__option ${i18n.language === lang ? 'a11y__option--active' : ''}`}
                  onClick={() => i18n.changeLanguage(lang)}
                  aria-pressed={i18n.language === lang}
                >
                  {t(`lang.${lang}`)}
                </button>
              ))}
            </div>
          </fieldset>

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
        </div>
      )}
    </div>
  )
}
