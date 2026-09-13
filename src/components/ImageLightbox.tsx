import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './ImageLightbox.css'

export interface LightboxImage {
  url: string
  fullUrl?: string
  alt: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

interface ViewportTransform {
  scale: number
  x: number
  y: number
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const MIN_SCALE = 1
const MAX_SCALE = 5
const WHEEL_ZOOM_FACTOR = 1.12
const DOUBLE_CLICK_SCALE = 2

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

function CloseIcon() {
  return (
    <svg
      className="image-lightbox__close-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7.5 7.5 16.5 16.5M16.5 7.5 7.5 16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function NavIcon({ direction }: { direction: 'prev' | 'next' }) {
  return (
    <svg
      className="image-lightbox__nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={direction === 'prev' ? 'M14.5 5.5 8 12l6.5 6.5' : 'M9.5 5.5 16 12l-6.5 6.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface TouchPoint {
  clientX: number
  clientY: number
}

function getPinchDistance(first: TouchPoint, second: TouchPoint) {
  const dx = first.clientX - second.clientX
  const dy = first.clientY - second.clientY
  return Math.hypot(dx, dy)
}

function getPinchCenter(viewport: DOMRect, first: TouchPoint, second: TouchPoint) {
  const centerX = (first.clientX + second.clientX) / 2
  const centerY = (first.clientY + second.clientY) / 2
  return {
    x: centerX - viewport.left - viewport.width / 2,
    y: centerY - viewport.top - viewport.height / 2,
  }
}

export function ImageLightbox({ images, index, onIndexChange, onClose }: ImageLightboxProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef<ViewportTransform>({ scale: 1, x: 0, y: 0 })
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(
    null,
  )
  const pinchStartRef = useRef<{
    distance: number
    scale: number
    x: number
    y: number
    centerX: number
    centerY: number
  } | null>(null)

  const [transform, setTransform] = useState<ViewportTransform>({ scale: 1, x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [isFullResolution, setIsFullResolution] = useState(false)

  const total = images.length
  const hasMultiple = total > 1
  const current = images[index]
  const atStart = index <= 0
  const atEnd = index >= total - 1
  const isZoomed = transform.scale > 1

  const applyTransform = useCallback((next: ViewportTransform) => {
    const scale = clampScale(next.scale)
    const normalized =
      scale === MIN_SCALE ? { scale: MIN_SCALE, x: 0, y: 0 } : { ...next, scale }
    transformRef.current = normalized
    setTransform(normalized)
  }, [])

  const resetTransform = useCallback(() => {
    applyTransform({ scale: MIN_SCALE, x: 0, y: 0 })
  }, [applyTransform])

  const zoomAtPoint = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const viewport = viewportRef.current
      if (!viewport) return

      const rect = viewport.getBoundingClientRect()
      const pointerX = clientX - rect.left - rect.width / 2
      const pointerY = clientY - rect.top - rect.height / 2
      const current = transformRef.current
      const scale = clampScale(nextScale)

      if (scale === MIN_SCALE) {
        resetTransform()
        return
      }

      const scaleRatio = scale / current.scale
      applyTransform({
        scale,
        x: pointerX - (pointerX - current.x) * scaleRatio,
        y: pointerY - (pointerY - current.y) * scaleRatio,
      })
    },
    [applyTransform, resetTransform],
  )

  useEffect(() => {
    transformRef.current = { scale: 1, x: 0, y: 0 }
    setTransform({ scale: 1, x: 0, y: 0 })
    setIsPanning(false)
    panStartRef.current = null
    pinchStartRef.current = null
  }, [index, current?.url])

  useEffect(() => {
    if (!current) {
      setImageSrc('')
      setIsFullResolution(false)
      return
    }

    const displayUrl = current.url
    const fullUrl = current.fullUrl ?? current.url

    setImageSrc(displayUrl)
    setIsFullResolution(fullUrl === displayUrl)

    if (fullUrl === displayUrl) {
      return
    }

    let cancelled = false
    const loader = new Image()
    loader.onload = () => {
      if (cancelled) return
      setImageSrc(fullUrl)
      setIsFullResolution(true)
    }
    loader.src = fullUrl

    return () => {
      cancelled = true
    }
  }, [current])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    function handleWheel(event: WheelEvent) {
      event.preventDefault()
      const currentTransform = transformRef.current
      const factor = event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR
      zoomAtPoint(event.clientX, event.clientY, currentTransform.scale * factor)
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [zoomAtPoint, current?.url])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (transformRef.current.scale > MIN_SCALE) {
          resetTransform()
          return
        }
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        if (transformRef.current.scale > MIN_SCALE) {
          applyTransform({
            ...transformRef.current,
            x: transformRef.current.x + 40,
          })
          return
        }
        if (!atStart) onIndexChange(index - 1)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (transformRef.current.scale > MIN_SCALE) {
          applyTransform({
            ...transformRef.current,
            x: transformRef.current.x - 40,
          })
          return
        }
        if (!atEnd) onIndexChange(index + 1)
        return
      }

      if (event.key === 'ArrowUp' && transformRef.current.scale > MIN_SCALE) {
        event.preventDefault()
        applyTransform({
          ...transformRef.current,
          y: transformRef.current.y + 40,
        })
        return
      }

      if (event.key === 'ArrowDown' && transformRef.current.scale > MIN_SCALE) {
        event.preventDefault()
        applyTransform({
          ...transformRef.current,
          y: transformRef.current.y - 40,
        })
        return
      }

      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = getFocusableElements(dialog)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [applyTransform, atEnd, atStart, index, onClose, onIndexChange, resetTransform, total])

  function handleBackdropClick() {
    if (transformRef.current.scale > MIN_SCALE) {
      resetTransform()
      return
    }
    onClose()
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' && event.isPrimary === false) return
    if (transformRef.current.scale <= MIN_SCALE) return

    event.currentTarget.setPointerCapture(event.pointerId)
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
    }
    setIsPanning(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const panStart = panStartRef.current
    if (!panStart) return

    applyTransform({
      ...transformRef.current,
      x: panStart.originX + (event.clientX - panStart.x),
      y: panStart.originY + (event.clientY - panStart.y),
    })
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    panStartRef.current = null
    setIsPanning(false)
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !viewportRef.current) return

    event.preventDefault()
    const viewport = viewportRef.current.getBoundingClientRect()
    const firstTouch = event.touches[0]
    const secondTouch = event.touches[1]
    const distance = getPinchDistance(firstTouch, secondTouch)
    const center = getPinchCenter(viewport, firstTouch, secondTouch)

    if (!pinchStartRef.current) {
      pinchStartRef.current = {
        distance,
        scale: transformRef.current.scale,
        x: transformRef.current.x,
        y: transformRef.current.y,
        centerX: center.x,
        centerY: center.y,
      }
      return
    }

    const pinch = pinchStartRef.current
    const nextScale = clampScale(pinch.scale * (distance / pinch.distance))
    if (nextScale === MIN_SCALE) {
      resetTransform()
      return
    }

    const scaleRatio = nextScale / pinch.scale
    applyTransform({
      scale: nextScale,
      x: pinch.centerX - (pinch.centerX - pinch.x) * scaleRatio,
      y: pinch.centerY - (pinch.centerY - pinch.y) * scaleRatio,
    })
  }

  function handleTouchEnd() {
    pinchStartRef.current = null
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (transformRef.current.scale > MIN_SCALE) {
      resetTransform()
      return
    }
    zoomAtPoint(event.clientX, event.clientY, DOUBLE_CLICK_SCALE)
  }

  if (!current) {
    return null
  }

  const viewportClassName = [
    'image-lightbox__viewport',
    isZoomed ? 'image-lightbox__viewport--zoomed' : '',
    isPanning ? 'image-lightbox__viewport--panning' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return createPortal(
    <div
      ref={dialogRef}
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={current.alt || t('projects.viewFullscreen')}
    >
      <div
        className="image-lightbox__backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div className="image-lightbox__content">
        <button
          ref={closeRef}
          type="button"
          className="image-lightbox__close"
          onClick={onClose}
          aria-label={t('projects.closeImage')}
        >
          <CloseIcon />
        </button>
        {hasMultiple && (
          <>
            <button
              type="button"
              className="image-lightbox__nav image-lightbox__nav--prev"
              onClick={() => {
                if (!atStart) onIndexChange(index - 1)
              }}
              aria-label={t('projects.previousImage')}
              disabled={atStart}
            >
              <NavIcon direction="prev" />
            </button>
            <button
              type="button"
              className="image-lightbox__nav image-lightbox__nav--next"
              onClick={() => {
                if (!atEnd) onIndexChange(index + 1)
              }}
              aria-label={t('projects.nextImage')}
              disabled={atEnd}
            >
              <NavIcon direction="next" />
            </button>
          </>
        )}
        <div
          ref={viewportRef}
          className={viewportClassName}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={imageSrc || current.url}
            alt={current.alt}
            className={[
              'image-lightbox__image',
              isFullResolution ? 'image-lightbox__image--full' : 'image-lightbox__image--preview',
            ].join(' ')}
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
