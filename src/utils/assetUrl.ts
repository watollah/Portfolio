import { getBasename } from './basename'

/** Public folder asset path, absolute from site root (GitHub Pages subpath or custom domain). */
export function resolveAssetUrl(path: string): string {
  if (!path) return path
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) return path

  const normalized = path.replace(/^\.\//, '').replace(/^\/+/, '')
  const base = getBasename().replace(/\/$/, '')
  return `${base}/${normalized}`
}
