import manifest from './projects.manifest.json'
import type { Project } from '../types/project'

function resolveAssetUrl(path: string): string {
  const normalized = path.replace(/^\.\//, '')
  return `${import.meta.env.BASE_URL}${normalized}`
}

function resolveSrcSet(srcSet: string): string {
  return srcSet
    .split(',')
    .map((part) => {
      const [url, descriptor] = part.trim().split(/\s+/)
      return `${resolveAssetUrl(url)} ${descriptor}`
    })
    .join(', ')
}

export const projects: Project[] = (manifest as Project[]).map((project) => ({
    ...project,
    coverUrl: project.coverUrl ? resolveAssetUrl(project.coverUrl) : undefined,
    coverSrcSet: project.coverSrcSet ? resolveSrcSet(project.coverSrcSet) : undefined,
  bannerUrl: project.bannerUrl ? resolveAssetUrl(project.bannerUrl) : undefined,
  blocks: (project.blocks ?? []).map((block) => {
    if (block.type === 'text') {
      return block
    }

    return {
      ...block,
      images: block.images.map((image) => ({
        ...image,
        url: resolveAssetUrl(image.url),
      })),
    }
  }),
  links: (project.links ?? []).map((link) => ({
    ...link,
    previewUrl: link.previewUrl ? resolveAssetUrl(link.previewUrl) : undefined,
  })),
  documents: (project.documents ?? []).map((document) => ({
    ...document,
    url: resolveAssetUrl(document.url),
    previewUrl: document.previewUrl ? resolveAssetUrl(document.previewUrl) : undefined,
  })),
}))

export const featuredProjects = projects.filter((project) => project.featured)

export function getProjectById(id: string): Project | undefined {
  return projects.find((project) => project.id === id)
}

export interface ResumeEntry {
  period: string
  periodDe?: string
  title: string
  titleDe: string
  organization: string
  organizationDe: string
  description?: string
  descriptionDe?: string
  grade?: string
  gradeDe?: string
  logo?: string
}

export const experience: ResumeEntry[] = [
  {
    period: '2024 - 2026',
    title: 'Citizen Developer',
    titleDe: 'Citizen Developer',
    organization: 'STRABAG',
    organizationDe: 'STRABAG',
    logo: `${import.meta.env.BASE_URL}STRABAG.svg`,
    description:
      'Development of custom software solutions to digitize business processes. Including the design and development of an onboarding tool for Europe-wide deployment in the HR department.',
    descriptionDe:
      'Entwicklung von individuellen Softwarelösungen zur Digitalisierung von Unternehmensprozessen. Unter anderem Konzeption und Entwicklung eines Onboarding Tools zum europaweiten Einsatz für die HR-Abteilung.',
  },
  {
    period: '2018 - 2021',
    title: 'Student Research Assistant',
    titleDe: 'Hilfswissenschaftler',
    organization: 'German Aerospace Center (DLR)',
    organizationDe: 'Deutsches Zentrum für Luft- und Raumfahrt e.V.',
    logo: `${import.meta.env.BASE_URL}DLR.svg`,
    description:
      'Software development and research on a new onboard computer architecture for spacecraft as part of the ScOSA project.',
    descriptionDe:
      'Softwareentwicklung und Forschung an einer neuen Onboard-Computerarchitektur für Raumfahrzeuge im Rahmen des Projektes ScOSA.',
  },
]

export const education: ResumeEntry[] = [
  {
    period: '2024 - Present',
    periodDe: '2024 - Heute',
    title: 'MSc. Architecture',
    titleDe: 'MSc. Architektur',
    organization: 'RWTH Aachen',
    organizationDe: 'RWTH Aachen',
    logo: `${import.meta.env.BASE_URL}RWTH.svg`,
  },
  {
    period: '2021 - 2024',
    title: 'BSc. Architecture',
    titleDe: 'BSc. Architektur',
    organization: 'RWTH Aachen',
    organizationDe: 'RWTH Aachen',
    logo: `${import.meta.env.BASE_URL}RWTH.svg`,
    grade: 'Grade: 1.8',
    gradeDe: 'Note: 1,8',
  },
  {
    period: '2017',
    title: 'Abitur',
    titleDe: 'Abitur',
    organization: 'Gymnasium im Schloss',
    organizationDe: 'Gymnasium im Schloss',
    logo: `${import.meta.env.BASE_URL}GiS.svg`,
    grade: 'Grade: 1.8',
    gradeDe: 'Note: 1,8',
  },
]

export const skills = {
  architecture: ['Graphisoft Archicad', 'Affinity', 'Twinmotion'],
  software: [
    'Full-Stack Web Development',
    'Programmieren in Python, Java',
    'Git Version Control',
    'Microsoft Power-Platform',
  ],
}

export const languages = [
  { name: 'German', nameDe: 'Deutsch', levelKey: 'native' as const },
  { name: 'English', nameDe: 'Englisch', levelKey: 'fluent' as const },
  { name: 'Italian', nameDe: 'Italienisch', level: 'UNIcert I (B1)' },
]

export type { Project, ProjectBlock, ProjectCategory, ProjectCollageBlock, ProjectImage, ProjectTextPosition } from '../types/project'
