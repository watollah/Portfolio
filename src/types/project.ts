export type ProjectCategory = 'software' | 'architecture'

export type ProjectTextPosition = 'top' | 'bottom' | 'left' | 'right'

export interface ProjectBlockImageAsset {
  file: string
  url: string
  fullUrl?: string
  width?: number
  height?: number
  fullWidth?: number
  fullHeight?: number
  text?: string
  textDe?: string
  textIt?: string
}

export interface ProjectImageBlock {
  type: 'image'
  images: ProjectBlockImageAsset[]
  text?: string
  textDe?: string
  textIt?: string
  textPosition: ProjectTextPosition
}

export interface ProjectCollageBlock {
  type: 'collage'
  images: ProjectBlockImageAsset[]
  text?: string
  textDe?: string
  textIt?: string
  textPosition: ProjectTextPosition
}

export interface ProjectTextBlock {
  type: 'text'
  text: string
  textDe: string
  textIt?: string
}

export type ProjectBlock = ProjectImageBlock | ProjectCollageBlock | ProjectTextBlock

/** @deprecated Use blocks on project detail pages. Kept for legacy manifests. */
export interface ProjectImage {
  file: string
  url: string
  caption?: string
  captionDe?: string
}

export interface ProjectLink {
  url: string
  title: string
  titleDe: string
  titleIt?: string
  description?: string
  descriptionDe?: string
  descriptionIt?: string
  previewUrl?: string
}

export interface ProjectDocument {
  file: string
  url: string
  title: string
  titleDe: string
  titleIt?: string
  description?: string
  descriptionDe?: string
  descriptionIt?: string
  previewUrl?: string
  kind: string
  size: number
}

export interface Project {
  id: string
  category: ProjectCategory
  featured?: boolean
  title: string
  titleDe: string
  titleIt?: string
  description: string
  descriptionDe: string
  descriptionIt?: string
  year: string
  context: string
  contextDe: string
  contextIt?: string
  tags: string[]
  cover: string
  coverUrl?: string
  coverSrcSet?: string
  coverWidth?: number
  coverHeight?: number
  banner?: string
  bannerUrl?: string
  blocks: ProjectBlock[]
  links: ProjectLink[]
  documents: ProjectDocument[]
  authors?: string[]
}
