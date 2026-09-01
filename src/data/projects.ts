export type ProjectCategory = 'software' | 'architecture'

export interface Project {
  id: string
  category: ProjectCategory
  title: string
  titleDe: string
  description: string
  descriptionDe: string
  year: string
  tags: string[]
  url?: string
  image?: string
}

export const projects: Project[] = [
  {
    id: 'portfolio-site',
    category: 'software',
    title: 'Portfolio Website',
    titleDe: 'Portfolio-Website',
    description:
      'A minimalist portfolio built with React, TypeScript, and Vite. Features internationalization and accessibility controls.',
    descriptionDe:
      'Eine minimalistische Portfolio-Website mit React, TypeScript und Vite. Mit Internationalisierung und Barrierefreiheitsoptionen.',
    year: '2026',
    tags: ['React', 'TypeScript', 'Vite'],
    url: '#',
  },
  {
    id: 'urban-residence',
    category: 'architecture',
    title: 'Urban Residence',
    titleDe: 'Städtische Wohnanlage',
    description:
      'A contemporary residential concept emphasizing natural light, sustainable materials, and flexible living spaces.',
    descriptionDe:
      'Ein zeitgenössisches Wohnkonzept mit Fokus auf Tageslicht, nachhaltige Materialien und flexible Wohnräume.',
    year: '2025',
    tags: ['Residential', 'Sustainable', 'Concept'],
  },
  {
    id: 'task-manager',
    category: 'software',
    title: 'Task Management App',
    titleDe: 'Aufgabenverwaltung',
    description:
      'A clean, focused productivity application with offline support and intuitive task organization.',
    descriptionDe:
      'Eine übersichtliche Produktivitätsanwendung mit Offline-Unterstützung und intuitiver Aufgabenorganisation.',
    year: '2025',
    tags: ['Web App', 'PWA', 'UI/UX'],
  },
  {
    id: 'cultural-center',
    category: 'architecture',
    title: 'Cultural Center',
    titleDe: 'Kulturzentrum',
    description:
      'Public building design integrating exhibition spaces, community areas, and landscape architecture.',
    descriptionDe:
      'Entwurf eines öffentlichen Gebäudes mit Ausstellungsräumen, Gemeinschaftsbereichen und Landschaftsarchitektur.',
    year: '2024',
    tags: ['Public', 'Cultural', 'Landscape'],
  },
]

export interface ResumeEntry {
  period: string
  title: string
  titleDe: string
  organization: string
  organizationDe: string
  description: string
  descriptionDe: string
}

export const experience: ResumeEntry[] = [
  {
    period: '2024 — Present',
    title: 'Architect & Developer',
    titleDe: 'Architekt & Entwickler',
    organization: 'Freelance',
    organizationDe: 'Freiberuflich',
    description: 'Independent work in architectural design and software development.',
    descriptionDe: 'Selbstständige Tätigkeit in Architektur und Softwareentwicklung.',
  },
]

export const education: ResumeEntry[] = [
  {
    period: '2020 — 2024',
    title: 'Architecture Studies',
    titleDe: 'Architekturstudium',
    organization: 'University',
    organizationDe: 'Universität',
    description: 'Focus on sustainable design and digital fabrication.',
    descriptionDe: 'Schwerpunkt nachhaltiges Design und digitale Fertigung.',
  },
]

export const skills = {
  architecture: ['AutoCAD', 'Revit', 'Rhino', 'SketchUp', 'Adobe Creative Suite'],
  software: ['TypeScript', 'React', 'Node.js', 'Python', 'Git'],
}

export const languages = [
  { name: 'German', nameDe: 'Deutsch', level: 'Native' },
  { name: 'English', nameDe: 'Englisch', level: 'Fluent' },
]
