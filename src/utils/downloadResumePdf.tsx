import { pdf } from '@react-pdf/renderer'
import type { TFunction } from 'i18next'
import { profile, profilePhotoCutout } from '../data/profile'
import { education, experience, languages, skills } from '../data/projects'
import type { SupportedLanguage } from '../i18n/routing'
import { ResumePdfDocument } from '../pdf/ResumePdfDocument'
import { ensureResumePdfFonts } from '../pdf/registerResumeFonts'
import { cropResumeCutoutPhoto, imageUrlToDataUrl } from './imageDataUrl'
import { formatResumePdfDate } from './formatResumePdfDate'
import { localizeResumeEntry } from './localizeResumeEntry'
import { localizedResumeText } from './resumeContent'

function resumePdfFilename(documentTitle: string) {
  return `${documentTitle.replace(/\s+/g, '-')}-Hannes-Watolla.pdf`
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function withLogoDataUrls(
  entries: ReturnType<typeof localizeResumeEntry>[],
): Promise<
  Array<
    ReturnType<typeof localizeResumeEntry> & {
      logoDataUrl?: string
    }
  >
> {
  return Promise.all(
    entries.map(async (entry) => {
      if (!entry.logo) {
        return entry
      }

      const logoDataUrl = await imageUrlToDataUrl(entry.logo, 112)
      return { ...entry, logoDataUrl }
    }),
  )
}

export async function downloadResumePdf(lang: SupportedLanguage, t: TFunction) {
  ensureResumePdfFonts()

  const photoDataUrl = await cropResumeCutoutPhoto(profilePhotoCutout)

  const localizedExperience = await withLogoDataUrls(
    experience.map((entry) => localizeResumeEntry(lang, entry)),
  )
  const localizedEducation = await withLogoDataUrls(
    education.map((entry) => localizeResumeEntry(lang, entry)),
  )

  const languageRows = languages.map((langEntry) => ({
    name: localizedResumeText(lang, langEntry.name, langEntry.nameDe, langEntry.nameIt),
    level:
      'levelKey' in langEntry && langEntry.levelKey
        ? t(`resume.proficiency.${langEntry.levelKey}`)
        : (langEntry.level ?? ''),
  }))

  const labels = {
    documentTitle: t('resume.title'),
    experience: t('resume.experience'),
    education: t('resume.education'),
    skills: t('resume.skills'),
    languages: t('resume.languages'),
    architectureSkills: t('projects.architecture'),
    softwareSkills: t('projects.software'),
  }

  const blob = await pdf(
    <ResumePdfDocument
      name={profile.name}
      role={localizedResumeText(lang, profile.role, profile.roleDe, profile.roleIt)}
      bio={localizedResumeText(lang, profile.bio, profile.bioDe, profile.bioIt)}
      documentDate={formatResumePdfDate()}
      photoDataUrl={photoDataUrl}
      labels={labels}
      experience={localizedExperience}
      education={localizedEducation}
      architectureSkills={skills.architecture}
      softwareSkills={skills.software[lang]}
      languageRows={languageRows}
    />,
  ).toBlob()

  triggerBlobDownload(blob, resumePdfFilename(labels.documentTitle))
}
