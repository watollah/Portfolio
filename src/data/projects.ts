import manifest from './projects.manifest.json'
import type { Project } from '../types/project'
import { resolveAssetUrl } from '../utils/assetUrl'

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
        fullUrl: image.fullUrl ? resolveAssetUrl(image.fullUrl) : undefined,
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
  periodIt?: string
  title: string
  titleDe?: string
  titleIt?: string
  organization: string
  organizationDe?: string
  organizationIt?: string
  description?: string
  descriptionDe?: string
  descriptionIt?: string
  grade?: string
  gradeDe?: string
  gradeIt?: string
  logo?: string
}

export const experience: ResumeEntry[] = [
  {
    period: "2024 - 2026",
    title: "Citizen Developer",
    titleDe: "Citizen Developer",
    titleIt: "Citizen Developer",
    organization: "STRABAG AG",
    organizationDe: "STRABAG AG",
    organizationIt: "STRABAG AG",
    logo: resolveAssetUrl("STRABAG.svg"),
    description: "Development of custom software solutions to digitize business processes, including the conception and development of an onboarding tool for Europe-wide use by the HR department.",
    descriptionDe: "Entwicklung von individuellen Softwarelösungen zur Digitalisierung von Unternehmensprozessen. Unter anderem Konzeption und Entwicklung eines Onboarding Tools zum europaweiten Einsatz für die HR-Abteilung.",
    descriptionIt: "Sviluppo di soluzioni software su misura per digitalizzare i processi aziendali, tra cui la concezione e lo sviluppo di uno strumento di onboarding destinato all’impiego in tutta Europa da parte del reparto HR.",
  },
  {
    period: "2018 - 2021",
    title: "Research Assistant",
    titleDe: "Hilfswissenschaftler",
    titleIt: "Assistente alla ricerca",
    organization: "German Aerospace Center (DLR)",
    organizationDe: "Deutsches Zentrum für Luft- und Raumfahrt e.V.",
    organizationIt: "Centro aerospaziale tedesco (DLR)",
    logo: resolveAssetUrl("DLR.svg"),
    description: "Software development and research on a new on-board computer architecture for spacecraft as part of the ScOSA project.",
    descriptionDe: "Softwareentwicklung und Forschung an einer neuen Onboard-Computerarchitektur für Raumfahrzeuge im Rahmen des Projektes ScOSA.",
    descriptionIt: "Sviluppo software e ricerca su una nuova architettura di computer di bordo per veicoli spaziali nell’ambito del progetto ScOSA.",
  },
]

export const education: ResumeEntry[] = [
  {
    period: "2024 - Present",
    periodDe: "2024 - Heute",
    periodIt: "2024 - oggi",
    title: "MSc Architecture",
    titleDe: "MSc. Architektur",
    titleIt: "MSc in Architettura",
    organization: "RWTH Aachen",
    organizationDe: "RWTH Aachen",
    organizationIt: "RWTH Aachen",
    logo: resolveAssetUrl("RWTH.svg"),
  },
  {
    period: "2021 - 2024",
    title: "BSc Architecture",
    titleDe: "BSc. Architektur",
    titleIt: "BSc in Architettura",
    organization: "RWTH Aachen",
    organizationDe: "RWTH Aachen",
    organizationIt: "RWTH Aachen",
    logo: resolveAssetUrl("RWTH.svg"),
    grade: "Grade: 1.8",
    gradeDe: "Note: 1,8",
    gradeIt: "Voto: 1,8",
  },
  {
    period: "2017",
    title: "Abitur",
    titleDe: "Abitur",
    titleIt: "Abitur",
    organization: "Gymnasium im Schloss",
    organizationDe: "Gymnasium im Schloss",
    organizationIt: "Gymnasium im Schloss",
    logo: resolveAssetUrl("GiS.svg"),
    grade: "Grade: 1.8",
    gradeDe: "Note: 1,8",
    gradeIt: "Voto: 1,8",
  },
]

export const skills = {
  architecture: [
    "Graphisoft Archicad",
    "Affinity",
    "Twinmotion",
  ],
  software: {
    en: [
      "Full-stack web development",
      "Programming: Python, Java",
      "Version control with Git",
      "Microsoft Power Platform",
    ],
    de: [
      "Full-Stack-Webentwicklung",
      "Programmieren in Python, Java",
      "Git-Versionskontrolle",
      "Microsoft Power Platform",
    ],
    it: [
      "Sviluppo web full stack",
      "Programmazione: Python, Java",
      "Controllo di versione con Git",
      "Microsoft Power Platform",
    ],
  },
} satisfies {
  architecture: string[]
  software: Record<'en' | 'de' | 'it', string[]>
}

export const languages = [
  { name: "German", nameDe: "Deutsch", nameIt: "Tedesco", levelKey: "native" as const },
  { name: "English", nameDe: "Englisch", nameIt: "Inglese", levelKey: "fluent" as const },
  { name: "Italian", nameDe: "Italienisch", nameIt: "Italiano", level: "UNIcert I (B1)" },
]

export interface Publication {
  url: string
  title: string
  description: string
}

export const publications: Publication[] = [
  {
    url: 'https://drive.google.com/file/d/19R7hk9-AhSusKHWMCDcsA9knFblBLET2/view?usp=sharing',
    title:
      'Entwicklung eines digitalen Werkzeuges für die Tragwerkslehre - Der digitale Cremonaplan',
    description: '2024, Hannes Watolla',
  },
  {
    url: 'https://link.springer.com/article/10.1007/s12567-021-00371-7',
    title:
      'ScOSA system software: the reliable and scalable middleware for a heterogeneous and distributed on-board computer architecture',
    description: '2021, DLR',
  },
  {
    url: 'https://dl.acm.org/doi/10.1145/3419804.3420266',
    title: 'Model-Based Reconfiguration Planning for a Distributed On-board Computer',
    description: '2020, DLR',
  },
]

export type { Project, ProjectBlock, ProjectCategory, ProjectCollageBlock, ProjectImage, ProjectTextPosition } from '../types/project'
