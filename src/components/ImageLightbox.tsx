import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  animateScrollLeft,
  cancelCarouselScrollAnimation,
  stopHorizontalScrollMomentum,
  supportsScrollEnd,
} from '../utils/carouselSettleScroll'
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
const TOUCH_AXIS_LOCK_PX = 10

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
        d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5"
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

function LightboxSlideImage({
  image,
  isActive,
  transform,
  isZoomed,
}: {
  image: LightboxImage
  isActive: boolean
  transform: ViewportTransform
  isZoomed: boolean
}) {
  const previewUrl = image.url
  const fullUrl = image.fullUrl ?? image.url
  const hasHigherRes = fullUrl !== previewUrl
  const shouldLoadFull = isActive && isZoomed && hasHigherRes

  const [fullLoaded, setFullLoaded] = useState(false)
  const [usePreviewFallback, setUsePreviewFallback] = useState(false)

  useEffect(() => {
    if (!shouldLoadFull) {
      setFullLoaded(false)
      setUsePreviewFallback(false)
      return
    }

    let cancelled = false
    setFullLoaded(false)
    setUsePreviewFallback(false)

    const loader = new Image()
    const finish = () => {
      if (!cancelled) setFullLoaded(true)
    }
    loader.onload = finish
    loader.onerror = () => {
      if (!cancelled) {
        setUsePreviewFallback(true)
        setFullLoaded(true)
      }
    }
    loader.src = fullUrl
    if (loader.complete) {
      finish()
    }

    return () => {
      cancelled = true
    }
  }, [fullUrl, shouldLoadFull])

  if (!isActive) {
    return (
      <img
        src={previewUrl}
        alt=""
        aria-hidden={true}
        className="image-lightbox__image"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    )
  }

  const src =
    shouldLoadFull && fullLoaded && !usePreviewFallback ? fullUrl : previewUrl

  return (
    <img
      src={src}
      alt={image.alt}
      className="image-lightbox__image"
      style={{
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
      }}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  )
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
  const scrollerRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(index)
  const scrollAnimatingRef = useRef(false)
  const userScrollingRef = useRef(false)
  const touchStartRef = useRef({ x: 0, y: 0 })
  const touchAxisRef = useRef<'x' | 'y' | null>(null)
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

  const total = images.length
  indexRef.current = index
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

  const alignScrollerToNearestSlide = useCallback(() => {
    const scroller = scrollerRef.current
    if (
      !scroller ||
      !hasMultiple ||
      scrollAnimatingRef.current ||
      isZoomed ||
      userScrollingRef.current
    ) {
      return
    }

    const width = scroller.clientWidth
    if (width === 0) return

    const targetIndex = Math.min(total - 1, Math.max(0, Math.round(scroller.scrollLeft / width)))
    const targetLeft = targetIndex * width

    if (Math.abs(scroller.scrollLeft - targetLeft) <= 1) {
      if (targetIndex !== indexRef.current) {
        onIndexChange(targetIndex)
      }
      return
    }

    scrollAnimatingRef.current = true
    void animateScrollLeft(scroller, targetLeft).finally(() => {
      scrollAnimatingRef.current = false
      if (targetIndex !== indexRef.current) {
        onIndexChange(targetIndex)
      }
    })
  }, [hasMultiple, isZoomed, onIndexChange, total])

  const applyTouchAxisLock = useCallback((axis: 'x' | 'y' | null) => {
    const scroller = scrollerRef.current
    if (!scroller) return

    if (axis === 'x') {
      scroller.style.touchAction = 'pan-x'
    } else {
      scroller.style.removeProperty('touch-action')
    }
  }, [])

  useLayoutEffect(() => {
    if (
      !hasMultiple ||
      isZoomed ||
      userScrollingRef.current ||
      scrollAnimatingRef.current
    ) {
      return
    }

    const scroller = scrollerRef.current
    if (!scroller) return

    const targetLeft = index * scroller.clientWidth
    if (Math.abs(scroller.scrollLeft - targetLeft) > 1) {
      scroller.scrollLeft = targetLeft
    }
  }, [hasMultiple, index, isZoomed])

  useLayoutEffect(() => {
    if (!hasMultiple) return

    const scroller = scrollerRef.current
    if (!scroller) return

    function handleScrollEnd() {
      userScrollingRef.current = false
      alignScrollerToNearestSlide()
    }

    if (supportsScrollEnd()) {
      scroller.addEventListener('scrollend', handleScrollEnd)
    }

    return () => {
      if (supportsScrollEnd()) {
        scroller.removeEventListener('scrollend', handleScrollEnd)
      }
    }
  }, [alignScrollerToNearestSlide, hasMultiple])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]')
    if (!meta) return

    const previousContent = meta.getAttribute('content') ?? ''
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
    )

    return () => {
      meta.setAttribute('content', previousContent)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    function preventBrowserZoom(event: TouchEvent) {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    function preventGestureZoom(event: Event) {
      event.preventDefault()
    }

    dialog.addEventListener('touchstart', preventBrowserZoom, { passive: false })
    dialog.addEventListener('touchmove', preventBrowserZoom, { passive: false })
    dialog.addEventListener('gesturestart', preventGestureZoom)
    dialog.addEventListener('gesturechange', preventGestureZoom)
    dialog.addEventListener('gestureend', preventGestureZoom)

    return () => {
      dialog.removeEventListener('touchstart', preventBrowserZoom)
      dialog.removeEventListener('touchmove', preventBrowserZoom)
      dialog.removeEventListener('gesturestart', preventGestureZoom)
      dialog.removeEventListener('gesturechange', preventGestureZoom)
      dialog.removeEventListener('gestureend', preventGestureZoom)
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

  function beginCarouselScrollInteraction() {
    if (isZoomed) return

    const scroller = scrollerRef.current
    if (scroller) {
      userScrollingRef.current = true
      cancelCarouselScrollAnimation(scroller)
      scrollAnimatingRef.current = false
    }
  }

  function handleCarouselTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (isZoomed) return

    const touch = event.touches[0]
    if (!touch) return

    beginCarouselScrollInteraction()
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchAxisRef.current = null
    applyTouchAxisLock(null)
  }

  function handleScrollerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isZoomed || event.pointerType === 'touch') return
    beginCarouselScrollInteraction()
  }

  function handleCarouselTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (isZoomed || touchAxisRef.current !== null) return

    const touch = event.touches[0]
    if (!touch) return

    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
    if (deltaX < TOUCH_AXIS_LOCK_PX && deltaY < TOUCH_AXIS_LOCK_PX) return

    touchAxisRef.current = deltaY > deltaX ? 'y' : 'x'
    applyTouchAxisLock(touchAxisRef.current)
  }

  function handleCarouselTouchEnd() {
    if (isZoomed) return

    const scroller = scrollerRef.current
    const axis = touchAxisRef.current

    if (axis === 'y' && scroller) {
      const width = scroller.clientWidth
      if (width > 0) {
        scroller.scrollLeft = indexRef.current * width
      }
      userScrollingRef.current = false
    } else if (axis === 'x' && scroller) {
      stopHorizontalScrollMomentum(scroller)
      if (!supportsScrollEnd()) {
        userScrollingRef.current = false
        alignScrollerToNearestSlide()
      }
    } else {
      userScrollingRef.current = false
    }

    touchAxisRef.current = null
    applyTouchAxisLock(null)
  }

  function handleScrollerPointerRelease() {
    const scroller = scrollerRef.current
    if (!scroller || !userScrollingRef.current || isZoomed) return

    stopHorizontalScrollMomentum(scroller)
    if (!supportsScrollEnd()) {
      userScrollingRef.current = false
      alignScrollerToNearestSlide()
    }
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
          <div className="image-lightbox__nav-group">
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
          </div>
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
          {hasMultiple ? (
            <div
              ref={scrollerRef}
              className={[
                'image-lightbox__scroller',
                isZoomed ? 'image-lightbox__scroller--zoomed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onPointerDown={handleScrollerPointerDown}
              onPointerUp={handleScrollerPointerRelease}
              onPointerCancel={handleScrollerPointerRelease}
              onTouchStart={handleCarouselTouchStart}
              onTouchMove={handleCarouselTouchMove}
              onTouchEnd={handleCarouselTouchEnd}
              onTouchCancel={handleCarouselTouchEnd}
            >
              {images.map((image, imageIndex) => (
                <div key={image.url} className="image-lightbox__slide">
                  <LightboxSlideImage
                    image={image}
                    isActive={imageIndex === index}
                    transform={transform}
                    isZoomed={isZoomed}
                  />
                </div>
              ))}
            </div>
          ) : (
            <LightboxSlideImage
              image={current}
              isActive
              transform={transform}
              isZoomed={isZoomed}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
