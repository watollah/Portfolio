import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const outPath = join(root, 'translations.export.json')

function flattenObject(obj, prefix = '') {
  const entries = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenObject(value, path))
    } else if (typeof value === 'string') {
      entries.push([path, value])
    }
  }
  return entries
}

function pushEntry(entries, entry) {
  entries.push({
    id: entry.id,
    category: entry.category,
    path: entry.path,
    en: entry.en ?? '',
    de: entry.de ?? '',
    it: entry.it ?? '',
    ...(entry.notes ? { notes: entry.notes } : {}),
    ...(entry.sourceFile ? { sourceFile: entry.sourceFile } : {}),
  })
}

function triFromBase(base, de, it) {
  return {
    en: typeof base === 'string' ? base : '',
    de: typeof de === 'string' ? de : '',
    it: typeof it === 'string' ? it : '',
  }
}

function loadUiStrings() {
  const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'))
  const de = JSON.parse(readFileSync(join(root, 'src/i18n/locales/de.json'), 'utf8'))
  const it = JSON.parse(readFileSync(join(root, 'src/i18n/locales/it.json'), 'utf8'))

  const enFlat = new Map(flattenObject(en))
  const deFlat = new Map(flattenObject(de))
  const itFlat = new Map(flattenObject(it))
  const keys = [...new Set([...enFlat.keys(), ...deFlat.keys(), ...itFlat.keys()])].sort()

  return keys.map((key) => ({
    id: `ui.${key}`,
    category: 'ui',
    path: `src/i18n/locales/{en,de,it}.json → ${key}`,
    en: enFlat.get(key) ?? '',
    de: deFlat.get(key) ?? '',
    it: itFlat.get(key) ?? '',
  }))
}

function loadProfileStrings() {
  const src = readFileSync(join(root, 'src/data/profile.ts'), 'utf8')
  const match = src.match(/export const profile = (\{[\s\S]*?\n\})/)
  if (!match) {
    throw new Error('Could not parse profile from src/data/profile.ts')
  }
  const profile = new Function(`return ${match[1]}`)()

  const fields = [
    ['role', 'profile.role'],
    ['bio', 'profile.bio'],
  ]

  return fields.map(([field, path]) => ({
    id: `profile.${field}`,
    category: 'profile',
    path: `src/data/profile.ts → profile.${field}`,
    sourceFile: 'src/data/profile.ts',
    ...triFromBase(profile[field], profile[`${field}De`], profile[`${field}It`]),
  }))
}

function stripTypeScript(literal) {
  return literal
    .replace(/\s+as const/g, '')
    .replace(/:\s*ResumeEntry\[\]/g, '')
    .replace(/:\s*Publication\[\]/g, '')
}

function loadResumeData() {
  const src = readFileSync(join(root, 'src/data/projects.ts'), 'utf8')
  const cleaned = src
    .replace(/resolveAssetUrl\([^)]+\)/g, "''")
    .replace(/\s+satisfies\s*\{[\s\S]*?\}\s*$/m, '')

  function extractArray(name) {
    const re = new RegExp(`export const ${name}(?::[^=]+)?\\s*=\\s*(\\[[\\s\\S]*?\\n\\])`)
    const match = cleaned.match(re)
    if (!match) {
      throw new Error(`Could not parse ${name} from src/data/projects.ts`)
    }
    return new Function(`return ${stripTypeScript(match[1])}`)()
  }

  function extractSkills() {
    const match = cleaned.match(/export const skills = (\{[\s\S]*?\n\})\s*(?:satisfies|export)/)
    if (!match) {
      throw new Error('Could not parse skills from src/data/projects.ts')
    }
    return new Function(`return ${stripTypeScript(match[1])}`)()
  }

  return {
    experience: extractArray('experience'),
    education: extractArray('education'),
    skills: extractSkills(),
    languages: extractArray('languages'),
    publications: extractArray('publications'),
  }
}

function exportResumeEntries(data, entries) {
  const resumeFields = ['period', 'title', 'organization', 'description', 'grade']

  for (const [listName, list] of [
    ['experience', data.experience],
    ['education', data.education],
  ]) {
    list.forEach((item, index) => {
      for (const field of resumeFields) {
        if (item[field] === undefined && item[`${field}De`] === undefined && item[`${field}It`] === undefined) {
          continue
        }
        pushEntry(entries, {
          id: `resume.${listName}[${index}].${field}`,
          category: 'resume',
          path: `src/data/projects.ts → ${listName}[${index}].${field}`,
          sourceFile: 'src/data/projects.ts',
          ...triFromBase(item[field], item[`${field}De`], item[`${field}It`]),
        })
      }
    })
  }

  data.skills.architecture.forEach((skill, index) => {
    pushEntry(entries, {
      id: `resume.skills.architecture[${index}]`,
      category: 'resume',
      path: `src/data/projects.ts → skills.architecture[${index}]`,
      sourceFile: 'src/data/projects.ts',
      en: skill,
      de: skill,
      it: skill,
      notes: 'Tool names; same in all languages unless you localize product names.',
    })
  })

  const softwareCount = Math.max(
    data.skills.software.en.length,
    data.skills.software.de.length,
    data.skills.software.it.length,
  )
  for (let index = 0; index < softwareCount; index += 1) {
    pushEntry(entries, {
      id: `resume.skills.software[${index}]`,
      category: 'resume',
      path: `src/data/projects.ts → skills.software[${index}]`,
      sourceFile: 'src/data/projects.ts',
      en: data.skills.software.en[index] ?? '',
      de: data.skills.software.de[index] ?? '',
      it: data.skills.software.it[index] ?? '',
    })
  }

  data.languages.forEach((item, index) => {
    pushEntry(entries, {
      id: `resume.languages[${index}].name`,
      category: 'resume',
      path: `src/data/projects.ts → languages[${index}].name`,
      sourceFile: 'src/data/projects.ts',
      ...triFromBase(item.name, item.nameDe, item.nameIt),
    })
    if (item.level) {
      pushEntry(entries, {
        id: `resume.languages[${index}].level`,
        category: 'resume',
        path: `src/data/projects.ts → languages[${index}].level`,
        sourceFile: 'src/data/projects.ts',
        en: item.level,
        de: item.level,
        it: item.level,
        notes: 'Certification label; localize if desired.',
      })
    }
  })

  data.publications.forEach((item, index) => {
    pushEntry(entries, {
      id: `resume.publications[${index}].title`,
      category: 'resume',
      path: `src/data/projects.ts → publications[${index}].title`,
      sourceFile: 'src/data/projects.ts',
      en: item.title,
      de: '',
      it: '',
      notes: 'Currently English only on the site; add de/it to translate publication titles.',
    })
    pushEntry(entries, {
      id: `resume.publications[${index}].description`,
      category: 'resume',
      path: `src/data/projects.ts → publications[${index}].description`,
      sourceFile: 'src/data/projects.ts',
      en: item.description,
      de: '',
      it: '',
      notes: 'Currently English only on the site.',
    })
  })
}

function findProjectJsonById(projectsRoot, id) {
  const stack = [projectsRoot]
  while (stack.length) {
    const dir = stack.pop()
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) {
        if (name === '_template' || name === 'node_modules') continue
        stack.push(full)
        continue
      }
      if (name !== 'project.json') continue
      try {
        const raw = JSON.parse(readFileSync(full, 'utf8'))
        if (raw.id === id) {
          return relative(root, full).replace(/\\/g, '/')
        }
      } catch {
        // ignore invalid json
      }
    }
  }
  return undefined
}

function exportProjectStrings(manifest, entries) {
  const projectsRoot = join(root, 'Projects')
  const idToSource = new Map()

  for (const project of manifest) {
    if (!idToSource.has(project.id)) {
      idToSource.set(project.id, findProjectJsonById(projectsRoot, project.id))
    }
    const sourceFile = idToSource.get(project.id)
    const basePath = `projects.${project.id}`

    for (const field of ['title', 'description', 'context']) {
      pushEntry(entries, {
        id: `${basePath}.${field}`,
        category: 'project',
        path: `project.json + manifest → ${field}`,
        sourceFile,
        ...triFromBase(project[field], project[`${field}De`], project[`${field}It`]),
      })
    }

    project.blocks?.forEach((block, blockIndex) => {
      const blockPath = `${basePath}.blocks[${blockIndex}]`

      if (block.text !== undefined || block.textDe !== undefined || block.textIt !== undefined) {
        pushEntry(entries, {
          id: `${blockPath}.text`,
          category: 'project',
          path: `${blockPath} (${block.type}) → text`,
          sourceFile,
          ...triFromBase(block.text, block.textDe, block.textIt),
        })
      }

      block.images?.forEach((image, imageIndex) => {
        if (image.text === undefined && image.textDe === undefined && image.textIt === undefined) {
          return
        }
        pushEntry(entries, {
          id: `${blockPath}.images[${imageIndex}].text`,
          category: 'project',
          path: `${blockPath}.images[${imageIndex}] → text`,
          sourceFile,
          ...triFromBase(image.text, image.textDe, image.textIt),
        })
      })
    })

    project.links?.forEach((link, linkIndex) => {
      for (const field of ['title', 'description']) {
        if (link[field] === undefined && link[`${field}De`] === undefined && link[`${field}It`] === undefined) {
          continue
        }
        pushEntry(entries, {
          id: `${basePath}.links[${linkIndex}].${field}`,
          category: 'project',
          path: `${basePath}.links[${linkIndex}] → ${field}`,
          sourceFile,
          ...triFromBase(link[field], link[`${field}De`], link[`${field}It`]),
        })
      }
    })

    project.documents?.forEach((document, docIndex) => {
      for (const field of ['title', 'description']) {
        if (
          document[field] === undefined &&
          document[`${field}De`] === undefined &&
          document[`${field}It`] === undefined
        ) {
          continue
        }
        pushEntry(entries, {
          id: `${basePath}.documents[${docIndex}].${field}`,
          category: 'project',
          path: `${basePath}.documents[${docIndex}] → ${field}`,
          sourceFile,
          ...triFromBase(document[field], document[`${field}De`], document[`${field}It`]),
        })
      }
    })
  }
}

function main() {
  const entries = []

  for (const row of loadUiStrings()) {
    pushEntry(entries, row)
  }
  for (const row of loadProfileStrings()) {
    pushEntry(entries, row)
  }

  const resumeData = loadResumeData()
  exportResumeEntries(resumeData, entries)

  const manifest = JSON.parse(readFileSync(join(root, 'src/data/projects.manifest.json'), 'utf8'))
  exportProjectStrings(manifest, entries)

  const nonEmptyEntries = entries.filter((entry) => entry.en || entry.de || entry.it)

  const payload = {
    formatVersion: 1,
    generatedAt: new Date().toISOString(),
    languages: ['en', 'de', 'it'],
    instructions: [
      'Each entry has stable id and path fields for re-import into the portfolio.',
      'en is the default English string; de and it map to *De and *It fields in code (or locale JSON for ui.*).',
      'Markdown formatting in project text (**, *, etc.) should be preserved.',
      'i18next interpolation placeholders such as {{year}} and {{authors}} must stay unchanged.',
      'After translation, return this file with de/it filled in; empty strings mean missing translation on the site today.',
    ],
    stats: {
      total: nonEmptyEntries.length,
      byCategory: nonEmptyEntries.reduce((acc, row) => {
        acc[row.category] = (acc[row.category] ?? 0) + 1
        return acc
      }, {}),
    },
    entries: nonEmptyEntries,
  }

  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`[export-translations] Wrote ${nonEmptyEntries.length} entries to ${relative(root, outPath)}`)
}

main()
