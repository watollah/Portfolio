const MIN_SETTLE_MS = 360
const MAX_SETTLE_MS = 640
const MS_PER_PX = 0.65

const activeAnimationByScroller = new WeakMap<HTMLElement, number>()

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  if (document.documentElement.getAttribute('data-motion') === 'reduced') return true
  if (document.documentElement.getAttribute('data-motion') === 'normal') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function settleDurationMs(distancePx: number) {
  return Math.min(MAX_SETTLE_MS, Math.max(MIN_SETTLE_MS, Math.abs(distancePx) * MS_PER_PX))
}

export function cancelCarouselScrollAnimation(scroller: HTMLElement) {
  const frameId = activeAnimationByScroller.get(scroller)
  if (frameId !== undefined) {
    cancelAnimationFrame(frameId)
    activeAnimationByScroller.delete(scroller)
  }
}

export function stopHorizontalScrollMomentum(scroller: HTMLElement) {
  const left = scroller.scrollLeft
  scroller.style.overflowX = 'hidden'
  scroller.scrollLeft = left
  scroller.style.overflowX = ''
}

export function animateScrollLeft(
  scroller: HTMLElement,
  targetLeft: number,
  durationMs?: number,
) {
  cancelCarouselScrollAnimation(scroller)

  if (prefersReducedMotion()) {
    scroller.scrollLeft = targetLeft
    return Promise.resolve()
  }

  const startLeft = scroller.scrollLeft
  const distance = targetLeft - startLeft
  if (Math.abs(distance) <= 1) {
    scroller.scrollLeft = targetLeft
    return Promise.resolve()
  }

  const duration = durationMs ?? settleDurationMs(distance)
  const startTime = performance.now()

  return new Promise<void>((resolve) => {
    function frame(now: number) {
      const progress = Math.min(1, (now - startTime) / duration)
      scroller.scrollLeft = startLeft + distance * progress
      if (progress < 1) {
        const id = requestAnimationFrame(frame)
        activeAnimationByScroller.set(scroller, id)
      } else {
        activeAnimationByScroller.delete(scroller)
        scroller.scrollLeft = targetLeft
        resolve()
      }
    }

    const id = requestAnimationFrame(frame)
    activeAnimationByScroller.set(scroller, id)
  })
}

export function supportsScrollEnd() {
  return typeof window !== 'undefined' && 'onscrollend' in window
}
