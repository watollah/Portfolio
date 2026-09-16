import type { ResumeEntry } from '../data/projects'
import type { SupportedLanguage } from '../i18n/routing'
import { localizedResumeText } from './resumeContent'

export function localizeResumeEntry(lang: SupportedLanguage, entry: ResumeEntry) {
  return {
    period: localizedResumeText(lang, entry.period, entry.periodDe, entry.periodIt),
    title: localizedResumeText(lang, entry.title, entry.titleDe, entry.titleIt),
    organization: localizedResumeText(
      lang,
      entry.organization,
      entry.organizationDe,
      entry.organizationIt,
    ),
    description: entry.description
      ? localizedResumeText(lang, entry.description, entry.descriptionDe, entry.descriptionIt)
      : undefined,
    grade: entry.grade
      ? localizedResumeText(lang, entry.grade, entry.gradeDe, entry.gradeIt)
      : undefined,
    logo: entry.logo,
  }
}
