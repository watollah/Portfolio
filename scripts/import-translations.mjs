import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const inputPath = join(root, 'translations.retranslated.json')

function setAtPath(obj, dotPath, value) {
  const keys = dotPath.split('.')
  let cur = obj
  for (let i = 0; i < keys.length - 1; i += 1) {
    if (cur[keys[i]] === undefined) cur[keys[i]] = {}
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = value
}

function preferLocalizedKey(obj, field, lang) {
  const snake = `${field}_${lang}`
  const camel = `${field}${lang.charAt(0).toUpperCase()}${lang.slice(1)}`
  if (Object.prototype.hasOwnProperty.call(obj, snake)) return snake
  if (Object.prototype.hasOwnProperty.call(obj, camel)) return camel
  return snake
}

function setLocalized(obj, field, lang, value) {
  if (lang === 'en') {
    obj[field] = value
    return
  }
  obj[preferLocalizedKey(obj, field, lang)] = value
}

function stripTypeScript(literal) {
  return literal
    .replace(/\s+as const/g, '')
    .replace(/:\s*ResumeEntry\[\]/g, '')
    .replace(/:\s*Publication\[\]/g, '')
}

function loadTsArrays(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const prepared = src.replace(/resolveAssetUrl\((['"])([^'"]+)\1\)/g, (_, quote, assetPath) => {
    return `${quote}__LOGO__${assetPath}__LOGO__${quote}`
  })

  function extractArray(name) {
    const re = new RegExp(`export const ${name}(?::[^=]+)?\\s*=\\s*(\\[[\\s\\S]*?\\n\\])`)
    const match = prepared.match(re)
    if (!match) throw new Error(`Could not parse ${name}`)
    return new Function(`return ${stripTypeScript(match[1])}`)()
  }

  function extractSkills() {
    const match = prepared.match(/export const skills = (\{[\s\S]*?\n\})\s*(?:satisfies|export)/)
    if (!match) throw new Error('Could not parse skills')
    return new Function(`return ${stripTypeScript(match[1])}`)()
  }

  return {
    src,
    experience: extractArray('experience'),
    education: extractArray('education'),
    skills: extractSkills(),
    languages: extractArray('languages'),
    publications: extractArray('publications'),
  }
}

function tsString(value) {
  return JSON.stringify(value)
}

function serializeResumeEntry(entry, indent) {
  const inner = `${indent}  `
  const lines = [`${indent}{`]
  const order = [
    'period',
    'periodDe',
    'periodIt',
    'title',
    'titleDe',
    'titleIt',
    'organization',
    'organizationDe',
    'organizationIt',
    'logo',
    'description',
    'descriptionDe',
    'descriptionIt',
    'grade',
    'gradeDe',
    'gradeIt',
  ]

  for (const key of order) {
    if (entry[key] === undefined) continue
    if (key === 'logo') {
      const raw = String(entry[key])
      const logoMatch = raw.match(/^__LOGO__(.+)__LOGO__$/)
      const path = logoMatch ? logoMatch[1] : raw
      lines.push(`${inner}logo: resolveAssetUrl(${tsString(path)}),`)
      continue
    }
    const value = entry[key]
    if (typeof value === 'string' && value.includes('\n')) {
      lines.push(`${inner}${key}:\n${inner}  ${tsString(value)},`)
    } else {
      lines.push(`${inner}${key}: ${tsString(value)},`)
    }
  }

  lines.push(`${indent}}`)
  return lines.join('\n')
}

function serializeResumeArray(name, entries) {
  const body = entries.map((entry) => serializeResumeEntry(entry, '  ')).join(',\n')
  return `export const ${name}: ResumeEntry[] = [\n${body},\n]`
}

function serializeSkills(skills) {
  const arch = skills.architecture.map((item) => `    ${tsString(item)},`).join('\n')
  const langs = ['en', 'de', 'it']
  const softwareBlocks = langs
    .map((lang) => {
      const items = skills.software[lang].map((item) => `      ${tsString(item)},`).join('\n')
      return `    ${lang}: [\n${items}\n    ],`
    })
    .join('\n')

  return `export const skills = {
  architecture: [
${arch}
  ],
  software: {
${softwareBlocks}
  },
} satisfies {
  architecture: string[]
  software: Record<'en' | 'de' | 'it', string[]>
}`
}

function serializeLanguages(languages) {
  const body = languages
    .map((entry) => {
      const parts = []
      parts.push(`name: ${tsString(entry.name)}`)
      if (entry.nameDe) parts.push(`nameDe: ${tsString(entry.nameDe)}`)
      if (entry.nameIt) parts.push(`nameIt: ${tsString(entry.nameIt)}`)
      if (entry.levelKey) parts.push(`levelKey: ${tsString(entry.levelKey)} as const`)
      if (entry.level) parts.push(`level: ${tsString(entry.level)}`)
      return `  { ${parts.join(', ')} }`
    })
    .join(',\n')
  return `export const languages = [\n${body},\n]`
}

function replaceExportBlock(src, pattern, replacement) {
  const re = new RegExp(pattern)
  if (!re.test(src)) throw new Error(`Could not find block: ${pattern}`)
  return src.replace(re, replacement)
}

function applyResumeTranslations(data, byId) {
  const resumeFields = ['period', 'title', 'organization', 'description', 'grade']

  for (const [listName, list] of [
    ['experience', data.experience],
    ['education', data.education],
  ]) {
    list.forEach((item, index) => {
      for (const field of resumeFields) {
        const row = byId.get(`${listName}[${index}].${field}`)
        if (!row) continue
        if (row.en) item[field] = row.en
        if (row.it) item[`${field}It`] = row.it
      }
    })
  }

  for (let index = 0; index < data.skills.software.en.length; index += 1) {
    const row = byId.get(`skills.software[${index}]`)
    if (!row) continue
    if (row.en) data.skills.software.en[index] = row.en
    if (row.it) data.skills.software.it[index] = row.it
  }

  data.skills.architecture.forEach((_, index) => {
    const row = byId.get(`skills.architecture[${index}]`)
    if (!row?.en) return
    data.skills.architecture[index] = row.en
  })

  data.languages.forEach((item, index) => {
    const nameRow = byId.get(`languages[${index}].name`)
    if (nameRow?.en) item.name = nameRow.en
    if (nameRow?.it) item.nameIt = nameRow.it
    const levelRow = byId.get(`languages[${index}].level`)
    if (levelRow?.en) item.level = levelRow.en
  })

  data.publications.forEach((item, index) => {
    const titleRow = byId.get(`publications[${index}].title`)
    const descRow = byId.get(`publications[${index}].description`)
    if (titleRow?.en) item.title = titleRow.en
    if (descRow?.en) item.description = descRow.en
  })
}

function applyProjectEntry(project, entry) {
  const id = entry.id

  const top = id.match(/^projects\.([^.]+)\.(title|description|context)$/)
  if (top) {
    if (entry.en) setLocalized(project, top[2], 'en', entry.en)
    if (entry.it) setLocalized(project, top[2], 'it', entry.it)
    return
  }

  const blockText = id.match(/^projects\.([^.]+)\.blocks\[(\d+)\]\.text$/)
  if (blockText) {
    const block = project.blocks?.[Number(blockText[2])]
    if (!block) return
    if (entry.en) setLocalized(block, 'text', 'en', entry.en)
    if (entry.it) setLocalized(block, 'text', 'it', entry.it)
    return
  }

  const imageText = id.match(/^projects\.([^.]+)\.blocks\[(\d+)\]\.images\[(\d+)\]\.text$/)
  if (imageText) {
    const block = project.blocks?.[Number(imageText[2])]
    const image = block?.images?.[Number(imageText[3])]
    if (!image) return
    if (entry.en) setLocalized(image, 'text', 'en', entry.en)
    if (entry.it) setLocalized(image, 'text', 'it', entry.it)
    return
  }

  const linkField = id.match(/^projects\.([^.]+)\.links\[(\d+)\]\.(title|description)$/)
  if (linkField) {
    const link = project.links?.[Number(linkField[2])]
    if (!link) return
    if (entry.en) setLocalized(link, linkField[3], 'en', entry.en)
    if (entry.it) setLocalized(link, linkField[3], 'it', entry.it)
    return
  }

  const docField = id.match(/^projects\.([^.]+)\.documents\[(\d+)\]\.(title|description)$/)
  if (docField) {
    const document = project.documents?.[Number(docField[2])]
    if (!document) return
    if (entry.en) setLocalized(document, docField[3], 'en', entry.en)
    if (entry.it) setLocalized(document, docField[3], 'it', entry.it)
  }
}

function main() {
  const payload = JSON.parse(readFileSync(inputPath, 'utf8'))
  const byId = new Map(payload.entries.map((entry) => [entry.id, entry]))

  const resumeById = new Map()
  for (const entry of payload.entries) {
    if (!entry.id.startsWith('resume.')) continue
    resumeById.set(entry.id.replace(/^resume\./, ''), entry)
  }

  const enPath = join(root, 'src/i18n/locales/en.json')
  const itPath = join(root, 'src/i18n/locales/it.json')
  const enLocale = JSON.parse(readFileSync(enPath, 'utf8'))
  const itLocale = JSON.parse(readFileSync(itPath, 'utf8'))
  for (const entry of payload.entries) {
    if (!entry.id.startsWith('ui.')) continue
    const key = entry.id.slice('ui.'.length)
    if (entry.en) setAtPath(enLocale, key, entry.en)
    if (entry.it) setAtPath(itLocale, key, entry.it)
  }
  writeFileSync(enPath, `${JSON.stringify(enLocale, null, 2)}\n`, 'utf8')
  writeFileSync(itPath, `${JSON.stringify(itLocale, null, 2)}\n`, 'utf8')

  const profilePath = join(root, 'src/data/profile.ts')
  let profileSrc = readFileSync(profilePath, 'utf8')
  const profileMatch = profileSrc.match(/export const profile = (\{[\s\S]*?\n\})/)
  if (!profileMatch) throw new Error('Could not parse profile')
  const profile = new Function(`return ${profileMatch[1]}`)()
  const profileRole = byId.get('profile.role')
  const profileBio = byId.get('profile.bio')
  if (profileRole?.en) profile.role = profileRole.en
  if (profileRole?.it) profile.roleIt = profileRole.it
  if (profileBio?.en) profile.bio = profileBio.en
  if (profileBio?.it) profile.bioIt = profileBio.it
  const profileBlock = `export const profile = {
  name: ${tsString(profile.name)},
  role: ${tsString(profile.role)},
  roleDe: ${tsString(profile.roleDe)},
  roleIt: ${tsString(profile.roleIt)},
  bio: ${tsString(profile.bio)},
  bioDe:
    ${tsString(profile.bioDe)},
  bioIt:
    ${tsString(profile.bioIt)},
}`
  profileSrc = profileSrc.replace(/export const profile = \{[\s\S]*?\n\}/, profileBlock)
  writeFileSync(profilePath, profileSrc, 'utf8')

  const projectsTsPath = join(root, 'src/data/projects.ts')
  const resumeData = loadTsArrays(projectsTsPath)
  applyResumeTranslations(resumeData, resumeById)

  let projectsSrc = resumeData.src
  projectsSrc = replaceExportBlock(
    projectsSrc,
    'export const experience(?:: ResumeEntry\\[\\])?\\s*=\\s*\\[[\\s\\S]*?\\n\\]',
    serializeResumeArray('experience', resumeData.experience),
  )
  projectsSrc = replaceExportBlock(
    projectsSrc,
    'export const education(?:: ResumeEntry\\[\\])?\\s*=\\s*\\[[\\s\\S]*?\\n\\]',
    serializeResumeArray('education', resumeData.education),
  )
  projectsSrc = replaceExportBlock(
    projectsSrc,
    'export const skills = \\{[\\s\\S]*?\\} satisfies \\{[\\s\\S]*?\\}',
    serializeSkills(resumeData.skills),
  )
  projectsSrc = replaceExportBlock(
    projectsSrc,
    'export const languages = \\[[\\s\\S]*?\\n\\]',
    serializeLanguages(resumeData.languages),
  )
  writeFileSync(projectsTsPath, projectsSrc, 'utf8')

  const projectFiles = new Map()
  for (const entry of payload.entries) {
    if (!entry.id.startsWith('projects.')) continue
    const projectId = entry.id.match(/^projects\.([^.]+)\./)?.[1]
    if (!projectId || !entry.sourceFile) continue
    const filePath = join(root, entry.sourceFile)
    if (!projectFiles.has(filePath)) {
      projectFiles.set(filePath, JSON.parse(readFileSync(filePath, 'utf8')))
    }
    applyProjectEntry(projectFiles.get(filePath), entry)
  }

  for (const [filePath, project] of projectFiles) {
    writeFileSync(filePath, `${JSON.stringify(project, null, 2)}\n`, 'utf8')
  }

  console.log(`[import-translations] Applied ${payload.entries.length} entries from translations.retranslated.json`)
}

main()
