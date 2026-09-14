import type { AppLanguage } from './detectLanguage'
import type { Project, ResumeEntry } from '../data/projects'

function normalizeLanguage(lang: string): AppLanguage {
  const code = lang.split('-')[0]?.toLowerCase()
  if (code === 'de' || code === 'en' || code === 'it') return code
  return 'en'
}

export function projectTitle(project: Project, lang: string): string {
  const code = normalizeLanguage(lang)
  if (code === 'de') return project.titleDe
  return project.title
}

export function projectDescription(project: Project, lang: string): string {
  const code = normalizeLanguage(lang)
  if (code === 'de') return project.descriptionDe
  return project.description
}

export function resumeEntryTitle(entry: ResumeEntry, lang: string): string {
  const code = normalizeLanguage(lang)
  if (code === 'de') return entry.titleDe
  return entry.title
}

export function resumeEntryOrganization(entry: ResumeEntry, lang: string): string {
  const code = normalizeLanguage(lang)
  if (code === 'de') return entry.organizationDe
  return entry.organization
}

export function resumeEntryDescription(entry: ResumeEntry, lang: string): string {
  const code = normalizeLanguage(lang)
  if (code === 'de') return entry.descriptionDe
  return entry.description
}
