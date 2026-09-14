import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ProjectBlock,
  ProjectCollageBlock,
  ProjectImageBlock,
  ProjectTextPosition,
} from '../types/project'
import { stripBlockMarkdown } from '../utils/blockMarkdown'
import { pickLocalized } from '../utils/projectLocale'
import {
  animateScrollLeft,
  cancelCarouselScrollAnimation,
  stopHorizontalScrollMomentum,
  supportsScrollEnd,
} from '../utils/carouselSettleScroll'
import { BlockText } from './BlockText'
import { ImageLightbox, type LightboxImage } from './ImageLightbox'
import { ScrollReveal } from './ScrollReveal'
import './ProjectBlocks.css'

interface ProjectBlocksProps {
  blocks: ProjectBlock[]
  language: string
  ariaLabel: string
}

function collectLightboxImages(blocks: ProjectBlock[], language: string): LightboxImage[] {
  const images: LightboxImage[] = []

  for (const block of blocks) {
    if (block.type === 'text') continue

    const blockText = pickLocalized(block, 'text', language)

    for (const image of block.images) {
      const imageText =
        block.type === 'collage' ? pickLocalized(image, 'text', language) : ''
      images.push({
        url: image.url,
        fullUrl: image.fullUrl,
        alt: stripBlockMarkdown(imageText || blockText || ''),
      })
    }
  }

  return images
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  if (document.documentElement.getAttribute('data-motion') === 'reduced') return true
  if (document.documentElement.getAttribute('data-motion') === 'normal') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type ImageDimensions = { width: number; height: number }

function fitContain(naturalWidth: number, naturalHeight: number, maxWidth: number, maxHeight: number) {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: 0, height: 0 }
  }

  const scale = Math.min(1, maxWidth / naturalWidth, maxHeight / naturalHeight)
  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  }
}

function resolveCssLengthToPx(element: HTMLElement, value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return Number.POSITIVE_INFINITY

  const probe = document.createElement('div')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.height = trimmed
  element.appendChild(probe)
  const px = probe.getBoundingClientRect().height
  element.removeChild(probe)
  return px
}

function computeCarouselMetrics(
  dimensions: ImageDimensions[],
  parentMaxWidth: number,
  maxHeightCap: number,
): { width: number; height: number } | null {
  if (dimensions.length === 0 || parentMaxWidth <= 0) return null

  const fittedAtParent = dimensions.map(({ width, height }) =>
    fitContain(width, height, parentMaxWidth, maxHeightCap),
  )
  const carouselWidth = Math.max(...fittedAtParent.map((size) => size.width))
  const carouselHeight = Math.min(
    ...dimensions.map(({ width, height }) =>
      fitContain(width, height, carouselWidth, maxHeightCap).height,
    ),
  )

  return { width: carouselWidth, height: carouselHeight }
}

const TOUCH_AXIS_LOCK_PX = 10

function loadImageDimensions(url: string): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      resolve({ width: 0, height: 0 })
    }
    image.src = url
  })
}

function CarouselButton({
  direction,
  onClick,
  ariaLabel,
  disabled,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`project-block__carousel-btn project-block__carousel-btn--${direction}`}
      onClick={(event) => {
        event.stopPropagation()
        if (disabled) {
          event.preventDefault()
          return
        }
        onClick()
      }}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
    >
      <svg
        className="project-block__carousel-btn-icon"
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
    </button>
  )
}

function BlockCarousel({
  block,
  alt,
  onOpenLightbox,
  lightboxUrl,
}: {
  block: ProjectImageBlock
  alt: string
  onOpenLightbox: (url: string) => void
  lightboxUrl?: string
}) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [carouselSize, setCarouselSize] = useState<{ width: number; height: number } | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const pointerStartRef = useRef({ x: 0, scroll: 0, dragged: false })
  const touchStartRef = useRef({ x: 0, y: 0 })
  const touchAxisRef = useRef<'x' | 'y' | null>(null)
  const scrollAnimatingRef = useRef(false)
  const userScrollingRef = useRef(false)
  const syncScrollToIndexRef = useRef(false)
  const total = block.images.length
  const current = block.images[index]
  const hasMultiple = total > 1
  const canGoPrevious = hasMultiple && index > 0
  const canGoNext = hasMultiple && index < total - 1
  indexRef.current = index

  function scrollToIndex(nextIndex: number, instant = false) {
    const scroller = scrollerRef.current
    if (!scroller) return

    const clamped = Math.max(0, Math.min(total - 1, nextIndex))
    const targetLeft = clamped * scroller.clientWidth

    syncScrollToIndexRef.current = true
    if (instant || prefersReducedMotion()) {
      cancelCarouselScrollAnimation(scroller)
      scroller.scrollLeft = targetLeft
      setIndex((currentIndex) => (currentIndex === clamped ? currentIndex : clamped))
      return
    }

    scrollAnimatingRef.current = true
    void animateScrollLeft(scroller, targetLeft).finally(() => {
      scrollAnimatingRef.current = false
    })
  }

  function alignScrollerToNearestSlide() {
    const scroller = scrollerRef.current
    if (
      !scroller ||
      scrollAnimatingRef.current ||
      touchAxisRef.current === 'y' ||
      userScrollingRef.current
    ) {
      return
    }

    const width = scroller.clientWidth
    if (width === 0) return

    const targetIndex = Math.min(total - 1, Math.max(0, Math.round(scroller.scrollLeft / width)))
    const targetLeft = targetIndex * width

    if (Math.abs(scroller.scrollLeft - targetLeft) <= 1) {
      setIndex((currentIndex) => (currentIndex === targetIndex ? currentIndex : targetIndex))
      return
    }

    scrollAnimatingRef.current = true
    void animateScrollLeft(scroller, targetLeft).finally(() => {
      scrollAnimatingRef.current = false
      setIndex((currentIndex) => (currentIndex === targetIndex ? currentIndex : targetIndex))
    })
  }

  function applyTouchAxisLock(axis: 'x' | 'y' | null) {
    const scroller = scrollerRef.current
    if (!scroller) return

    if (axis === 'y') {
      scroller.style.touchAction = 'pan-y'
    } else if (axis === 'x') {
      scroller.style.touchAction = 'pan-x'
    } else {
      scroller.style.removeProperty('touch-action')
    }
  }

  useLayoutEffect(() => {
    if (!hasMultiple) return

    const carouselEl = carouselRef.current
    const blocksRootEl = carouselEl?.closest('.project-blocks') as HTMLElement | null
    if (!carouselEl || !blocksRootEl) return

    const carousel = carouselEl
    const blocksRoot = blocksRootEl

    let cancelled = false
    const dimensionsPromise = Promise.all(
      block.images.map((image) => loadImageDimensions(image.url)),
    )

    function getMaxHeightCap() {
      const raw = getComputedStyle(blocksRoot).getPropertyValue('--project-image-max-height')
      return resolveCssLengthToPx(blocksRoot, raw)
    }

    async function measure() {
      const dimensions = await dimensionsPromise
      if (cancelled) return

      const parentMaxWidth = carousel.clientWidth
      if (parentMaxWidth <= 0) return

      const metrics = computeCarouselMetrics(dimensions, parentMaxWidth, getMaxHeightCap())
      if (!metrics) return

      setCarouselSize((current) =>
        current?.width === metrics.width && current?.height === metrics.height ? current : metrics,
      )
    }

    void measure()

    const resizeObserver = new ResizeObserver(() => {
      void measure()
    })
    resizeObserver.observe(carousel)

    return () => {
      cancelled = true
      resizeObserver.disconnect()
    }
  }, [block.images, hasMultiple])

  useLayoutEffect(() => {
    if (!hasMultiple) return

    const scroller = scrollerRef.current
    if (!scroller) return

    const scrollerEl = scroller

    function snapToCurrent(instant: boolean) {
      const width = scrollerEl.clientWidth
      if (width === 0) return

      const left = indexRef.current * width
      if (Math.abs(scrollerEl.scrollLeft - left) <= 1) return
      if (instant || prefersReducedMotion()) {
        scrollerEl.scrollLeft = left
        return
      }

      scrollAnimatingRef.current = true
      void animateScrollLeft(scrollerEl, left).finally(() => {
        scrollAnimatingRef.current = false
      })
    }

    if (syncScrollToIndexRef.current) {
      syncScrollToIndexRef.current = false
      snapToCurrent(true)
    }

    const resizeObserver = new ResizeObserver(() => {
      snapToCurrent(true)
    })
    resizeObserver.observe(scroller)

    return () => resizeObserver.disconnect()
  }, [hasMultiple, index, total])

  useLayoutEffect(() => {
    if (!lightboxUrl || !hasMultiple) return

    const nextIndex = block.images.findIndex((image) => image.url === lightboxUrl)
    if (nextIndex < 0) return

    scrollToIndex(nextIndex, true)
  }, [block.images, hasMultiple, lightboxUrl])

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
  }, [hasMultiple, total])

  function showPrevious() {
    scrollToIndex(index - 1, true)
  }

  function showNext() {
    scrollToIndex(index + 1, true)
  }

  function openLightbox(url: string) {
    onOpenLightbox(url)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current
    if (scroller) {
      userScrollingRef.current = true
      cancelCarouselScrollAnimation(scroller)
      scrollAnimatingRef.current = false
    }
    pointerStartRef.current = {
      x: event.clientX,
      scroll: scroller?.scrollLeft ?? 0,
      dragged: false,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (Math.abs(event.clientX - pointerStartRef.current.x) > 8) {
      pointerStartRef.current.dragged = true
    }
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    if (!touch) return

    const scroller = scrollerRef.current
    if (scroller) {
      userScrollingRef.current = true
      cancelCarouselScrollAnimation(scroller)
      scrollAnimatingRef.current = false
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchAxisRef.current = null
    applyTouchAxisLock(null)
  }

  function handleTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (touchAxisRef.current !== null) return

    const touch = event.touches[0]
    if (!touch) return

    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x)
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y)
    if (deltaX < TOUCH_AXIS_LOCK_PX && deltaY < TOUCH_AXIS_LOCK_PX) return

    touchAxisRef.current = deltaY > deltaX ? 'y' : 'x'
    applyTouchAxisLock(touchAxisRef.current)
  }

  function handleTouchEnd() {
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
    if (!scroller || !userScrollingRef.current) return

    stopHorizontalScrollMomentum(scroller)
    if (!supportsScrollEnd()) {
      userScrollingRef.current = false
      alignScrollerToNearestSlide()
    }
  }

  function handleSlideClick(event: MouseEvent<HTMLButtonElement>, url: string) {
    const scroller = scrollerRef.current
    const pointer = pointerStartRef.current
    if (
      pointer.dragged ||
      (scroller && Math.abs(scroller.scrollLeft - pointer.scroll) > 4)
    ) {
      event.preventDefault()
      return
    }

    openLightbox(url)
  }

  return (
    <div className="project-block__carousel" ref={carouselRef}>
      <div
        className={`project-block__media${hasMultiple ? ' project-block__media--carousel' : ''}`}
        style={
          carouselSize
            ? {
                width: carouselSize.width,
                height: carouselSize.height,
                maxWidth: '100%',
              }
            : undefined
        }
      >
        {hasMultiple ? (
          <>
            <div
              ref={scrollerRef}
              className="project-block__carousel-scroller"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handleScrollerPointerRelease}
              onPointerCancel={handleScrollerPointerRelease}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {block.images.map((image, imageIndex) => {
                const isActive = imageIndex === index

                return (
                  <button
                    key={image.url}
                    type="button"
                    className="project-block__image-btn project-block__carousel-slide"
                    onClick={(event) => handleSlideClick(event, image.url)}
                    aria-label={t('projects.viewFullscreen')}
                  >
                    <img
                      src={image.url}
                      alt={isActive ? alt : ''}
                      aria-hidden={isActive ? undefined : true}
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      sizes="(max-width: 1152px) 100vw, 1152px"
                    />
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <button
            type="button"
            className="project-block__image-btn"
            onClick={() => openLightbox(current.url)}
            aria-label={t('projects.viewFullscreen')}
          >
            <img
              src={current.url}
              alt={alt}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
          </button>
        )}
        {hasMultiple && (
          <>
            <CarouselButton
              direction="prev"
              onClick={showPrevious}
              ariaLabel={t('projects.previousImage')}
              disabled={!canGoPrevious}
            />
            <CarouselButton
              direction="next"
              onClick={showNext}
              ariaLabel={t('projects.nextImage')}
              disabled={!canGoNext}
            />
          </>
        )}
      </div>
    </div>
  )
}

function CollageBlock({
  block,
  language,
  onOpenLightbox,
}: {
  block: ProjectCollageBlock
  language: string
  onOpenLightbox: (url: string) => void
}) {
  const { t } = useTranslation()
  const text = pickLocalized(block, 'text', language)
  const position: ProjectTextPosition = block.textPosition ?? 'bottom'
  const positionClass = `project-block--text-${position}`

  return (
    <figure className={`project-block project-block--collage ${positionClass}`}>
      <div className="project-block__layout">
        <div className="project-block__collage">
          {block.images.map((image) => {
            const imageText = pickLocalized(image, 'text', language)

            return (
              <figure key={image.url} className="project-block__collage-item-wrap">
                <button
                  type="button"
                  className="project-block__collage-item project-block__image-btn"
                  onClick={() => onOpenLightbox(image.url)}
                  aria-label={t('projects.viewFullscreen')}
                >
                  <img
                    src={image.url}
                    alt={stripBlockMarkdown(imageText || text || '')}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 1152px) 50vw, 576px"
                  />
                </button>
                {imageText && (
                  <BlockText
                    as="figcaption"
                    className="project-block__collage-caption"
                    text={imageText}
                  />
                )}
              </figure>
            )
          })}
        </div>
        {text && (
          <BlockText as="figcaption" className="project-block__text" text={text} />
        )}
      </div>
    </figure>
  )
}

function ImageBlock({
  block,
  language,
  onOpenLightbox,
  lightboxUrl,
}: {
  block: ProjectImageBlock
  language: string
  onOpenLightbox: (url: string) => void
  lightboxUrl?: string
}) {
  const text = pickLocalized(block, 'text', language)
  const position: ProjectTextPosition = block.textPosition ?? 'bottom'
  const positionClass = `project-block--text-${position}`

  return (
    <figure className={`project-block project-block--image ${positionClass}`}>
      <div className="project-block__layout">
        <BlockCarousel
          block={block}
          alt={stripBlockMarkdown(text || '')}
          onOpenLightbox={onOpenLightbox}
          lightboxUrl={lightboxUrl}
        />
        {text && (
          <BlockText as="figcaption" className="project-block__text" text={text} />
        )}
      </div>
    </figure>
  )
}

export function ProjectBlocks({ blocks, language, ariaLabel }: ProjectBlocksProps) {
  const lightboxImages = useMemo(
    () => collectLightboxImages(blocks, language),
    [blocks, language],
  )
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const lightboxUrl =
    lightboxIndex !== null ? lightboxImages[lightboxIndex]?.url : undefined

  function openLightbox(url: string) {
    const nextIndex = lightboxImages.findIndex((image) => image.url === url)
    if (nextIndex >= 0) {
      setLightboxIndex(nextIndex)
    }
  }

  function handleLightboxIndexChange(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= lightboxImages.length) return
    setLightboxIndex(nextIndex)
  }

  if (blocks.length === 0) {
    return null
  }

  return (
    <section className="project-blocks" aria-label={ariaLabel}>
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          const text = pickLocalized(block, 'text', language)
          if (!text) return null

          return (
            <ScrollReveal key={`text-${index}`}>
              <div className="project-block project-block--text-only">
                <BlockText className="project-block__text" text={text} />
              </div>
            </ScrollReveal>
          )
        }

        if (block.type === 'collage') {
          if (block.images.length === 0) {
            return null
          }

          return (
            <ScrollReveal key={`collage-${block.images[0]?.url ?? index}`}>
              <CollageBlock
                block={block}
                language={language}
                onOpenLightbox={openLightbox}
              />
            </ScrollReveal>
          )
        }

        if (block.images.length === 0) {
          return null
        }

        return (
          <ScrollReveal key={`image-${block.images[0]?.url ?? index}`}>
            <ImageBlock
              block={block}
              language={language}
              onOpenLightbox={openLightbox}
              lightboxUrl={lightboxUrl}
            />
          </ScrollReveal>
        )
      })}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={lightboxImages}
          index={lightboxIndex}
          onIndexChange={handleLightboxIndexChange}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  )
}
