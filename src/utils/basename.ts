/** Detect GitHub Pages project-site subpath (/Portfolio) vs custom domain root. */
export function getBasename(): string {
  const firstSegment = window.location.pathname.split('/').filter(Boolean)[0]
  return firstSegment === 'Portfolio' ? '/Portfolio' : '/'
}
