import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const projectsRoot = join(root, 'Projects')
const publicRoot = join(root, 'public', 'projects')
const manifestPath = join(root, 'src', 'data', 'projects.manifest.json')

// Covers display in 4:3 cards; 1920×1440 supports ~960px cards at 2× DPR.
const COVER_WIDTH = 1920
const COVER_HEIGHT = 1440
const COVER_WIDTH_1X = 960
const COVER_HEIGHT_1X = 720
// Project detail content is up to ~1152 CSS px; 300 DPI ≈ (1152 / 96) × 300 px.
const DISPLAY_DPI = 300
const DISPLAY_CSS_PX = 1152
const DISPLAY_MAX_WIDTH = Math.round((DISPLAY_CSS_PX / 96) * DISPLAY_DPI)
const FULL_MAX_WIDTH = 8192
const PREVIEW_MAX_WIDTH = 640
const COVER_QUALITY = 85
const DISPLAY_QUALITY = 88
const FULL_QUALITY = 92
const PREVIEW_QUALITY = 82
const COVER_CANDIDATES = ['cover.png', 'cover.jpg', 'cover.jpeg', 'cover.webp']
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.txt',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
])
const IGNORED_DIRS = new Set(['_template', 'Sources', 'sources'])

function isIgnoredPath(file) {
  if (!file) {
    return false
  }

  return file.replace(/\\/g, '/').split('/').some((segment) => IGNORED_DIRS.has(segment))
}

function isImageFile(file) {
  return IMAGE_EXTENSIONS.has(extname(file).toLowerCase())
}

function isDocumentFile(file) {
  return DOCUMENT_EXTENSIONS.has(extname(file).toLowerCase())
}

function getDocumentKind(file) {
  const extension = extname(file).toLowerCase()
  if (extension === '.pdf') return 'pdf'
  if (['.doc', '.docx', '.rtf', '.txt'].includes(extension)) return 'document'
  if (['.ppt', '.pptx'].includes(extension)) return 'presentation'
  if (['.xls', '.xlsx'].includes(extension)) return 'spreadsheet'
  return 'file'
}

function titleFromFilename(file) {
  return basename(file, extname(file))
}

function readLocalizedField(item, field, lang) {
  const snake = `${field}_${lang}`
  const camel = `${field}${lang.charAt(0).toUpperCase()}${lang.slice(1)}`
  return item[snake] ?? item[camel]
}

function normalizeLocalizedText(item, field, fallback = '') {
  const value = item[field] ?? fallback
  return {
    [field]: value,
    [`${field}De`]: readLocalizedField(item, field, 'de') ?? value,
    [`${field}It`]: readLocalizedField(item, field, 'it') ?? value,
  }
}

function normalizeContext(raw) {
  const source = {
    ...raw,
    context: raw.context ?? raw.kontext ?? '',
    context_de: raw.context_de ?? raw.kontext_de,
    context_it: raw.context_it ?? raw.kontext_it,
    contextDe: raw.contextDe ?? raw.kontextDe,
    contextIt: raw.contextIt ?? raw.kontextIt,
  }

  return normalizeLocalizedText(source, 'context', '')
}

function normalizeLinks(rawLinks, legacyUrl) {
  const links = (rawLinks ?? []).map((link) => ({
    url: link.url ?? '',
    preview: link.preview ?? '',
    ...normalizeLocalizedText(link, 'title', link.url ?? 'Link'),
    ...normalizeLocalizedText(link, 'description', ''),
  })).filter((link) => link.url)

  if (links.length === 0 && legacyUrl) {
    links.push({
      url: legacyUrl,
      preview: '',
      title: 'Visit project',
      titleDe: 'Projekt besuchen',
      titleIt: 'Projekt besuchen',
      description: '',
      descriptionDe: '',
      descriptionIt: '',
    })
  }

  return links
}

function normalizeDocuments(rawDocuments) {
  return (rawDocuments ?? []).map((document) => ({
    file: document.file ?? '',
    preview: document.preview ?? '',
    ...normalizeLocalizedText(document, 'title', titleFromFilename(document.file ?? 'Document')),
    ...normalizeLocalizedText(document, 'description', ''),
  })).filter((document) => document.file)
}

const TEXT_POSITIONS = new Set(['top', 'bottom', 'left', 'right'])

function normalizeBlockFiles(block) {
  if (Array.isArray(block.files)) {
    return block.files.filter(Boolean)
  }

  if (block.file) {
    return [block.file]
  }

  return []
}

function normalizeMediaBlock(block, type) {
  const files = normalizeBlockFiles(block)
  const textPosition = TEXT_POSITIONS.has(block.textPosition) ? block.textPosition : 'bottom'
  const caption = block.text ?? block.caption ?? ''
  const localizedSource = {
    ...block,
    text: caption,
    text_de: block.text_de ?? block.caption_de,
    text_it: block.text_it ?? block.caption_it,
    textDe: block.textDe ?? block.captionDe,
    textIt: block.textIt ?? block.captionIt,
  }

  return {
    type,
    files,
    textPosition,
    ...normalizeLocalizedText(localizedSource, 'text', caption),
  }
}

function normalizeImageBlock(block) {
  return normalizeMediaBlock(block, 'image')
}

function normalizeCollageBlock(block) {
  return normalizeMediaBlock(block, 'collage')
}

function normalizeBlocks(raw) {
  if (Array.isArray(raw.blocks) && raw.blocks.length > 0) {
    return raw.blocks
      .map((block) => {
        if (block.type === 'text') {
          return {
            type: 'text',
            ...normalizeLocalizedText(block, 'text', ''),
          }
        }

        if (block.type === 'collage') {
          return normalizeCollageBlock(block)
        }

        return normalizeImageBlock(block)
      })
      .filter((block) => block.type === 'text' || block.files.length > 0)
  }

  return (raw.images ?? [])
    .map((image) =>
      normalizeImageBlock({
        files: normalizeBlockFiles(image),
        text: image.caption,
        textDe: image.captionDe,
        textPosition: image.textPosition,
      }),
    )
    .filter((block) => block.files.length > 0)
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findProjectDirs() {
  const dirs = []

  const softwareRoot = join(projectsRoot, 'Software')
  if (existsSync(softwareRoot)) {
    for (const entry of readdirSync(softwareRoot, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
        dirs.push(join(softwareRoot, entry.name))
      }
    }
  }

  const architectureRoot = join(projectsRoot, 'Architecture')
  if (existsSync(architectureRoot)) {
    for (const group of readdirSync(architectureRoot, { withFileTypes: true })) {
      if (!group.isDirectory() || group.name.startsWith('.') || IGNORED_DIRS.has(group.name)) {
        continue
      }

      const groupPath = join(architectureRoot, group.name)
      for (const entry of readdirSync(groupPath, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && !IGNORED_DIRS.has(entry.name)) {
          dirs.push(join(groupPath, entry.name))
        }
      }
    }
  }

  return dirs.sort()
}

function findCoverFile(projectDir) {
  for (const name of COVER_CANDIDATES) {
    if (existsSync(join(projectDir, name))) {
      return name
    }
  }

  return ''
}

function discoverRootImages(projectDir, coverFile) {
  const images = []

  for (const entry of readdirSync(projectDir, { withFileTypes: true })) {
    if (!entry.isFile() || !isImageFile(entry.name) || entry.name === coverFile) {
      continue
    }

    images.push({ file: entry.name })
  }

  return images
}

function createProjectJson(projectDir) {
  const folderName = basename(projectDir)
  const cover = findCoverFile(projectDir)
  const rootImages = discoverRootImages(projectDir, cover)
  const images = cover ? [{ file: cover }, ...rootImages] : rootImages

  return {
    id: slugify(folderName),
    featured: false,
    year: String(new Date().getFullYear()),
    title: folderName,
    title_de: folderName,
    title_it: folderName,
    context: '',
    context_de: '',
    context_it: '',
    description: '',
    description_de: '',
    description_it: '',
    tags: [],
    cover,
    banner: '',
    blocks: images.map((image) => ({
      type: 'image',
      files: [image.file],
      textPosition: 'bottom',
      text: '',
      text_de: '',
      text_it: '',
    })),
    links: [],
    documents: [],
  }
}

function normalizeAuthors(rawAuthors) {
  if (!Array.isArray(rawAuthors)) {
    return undefined
  }

  const authors = rawAuthors
    .map((author) => (typeof author === 'string' ? author.trim() : ''))
    .filter(Boolean)

  return authors.length > 0 ? authors : undefined
}

function ensureUniqueId(project, usedIds) {
  let id = project.id || slugify(project.title)
  if (!id) {
    id = 'project'
  }

  let uniqueId = id
  let suffix = 2
  while (usedIds.has(uniqueId)) {
    uniqueId = `${id}-${suffix}`
    suffix += 1
  }

  usedIds.add(uniqueId)
  return { ...project, id: uniqueId }
}

function loadProjectDefinition(projectDir, usedIds) {
  const jsonPath = join(projectDir, 'project.json')

  if (existsSync(jsonPath)) {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
    const folderName = basename(projectDir)
    const withDefaults = {
      id: raw.id ?? slugify(folderName),
      category: raw.category,
      featured: Boolean(raw.featured),
      year: raw.year ?? String(new Date().getFullYear()),
      ...normalizeContext(raw),
      ...normalizeLocalizedText(raw, 'title', raw.title ?? folderName),
      ...normalizeLocalizedText(raw, 'description', raw.description ?? ''),
      tags: raw.tags ?? [],
      cover: raw.cover ?? findCoverFile(projectDir),
      banner: raw.banner ?? '',
      blocks: normalizeBlocks(raw),
      links: normalizeLinks(raw.links, raw.url),
      documents: normalizeDocuments(raw.documents),
      authors: normalizeAuthors(raw.authors),
    }

    return ensureUniqueId(withDefaults, usedIds)
  }

  const created = createProjectJson(projectDir)
  const unique = ensureUniqueId(created, usedIds)
  writeFileSync(jsonPath, `${JSON.stringify(unique, null, 2)}\n`, 'utf8')
  console.log(`[sync-projects] Created ${relative(root, jsonPath)}`)

  return unique
}

function optimizedRelativePath(file, suffix = '') {
  return `${file.replace(/\\/g, '/').replace(/\.[^./\\]+$/, '')}${suffix}.jpg`
}

async function optimizeImage(sourcePath, targetPath, maxWidth, quality) {
  mkdirSync(dirname(targetPath), { recursive: true })

  await sharp(sourcePath)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .flatten({ background: '#fafaf8' })
    .jpeg({ quality, mozjpeg: true })
    .toFile(targetPath)
}

async function optimizeCoverImage(sourcePath, targetPath, width, height) {
  mkdirSync(dirname(targetPath), { recursive: true })

  await sharp(sourcePath)
    .rotate()
    .resize({
      width,
      height,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: true,
    })
    .flatten({ background: '#fafaf8' })
    .jpeg({ quality: COVER_QUALITY, mozjpeg: true })
    .toFile(targetPath)
}

async function syncCover(projectDir, destDir, file) {
  if (isIgnoredPath(file)) {
    return null
  }

  const sourcePath = join(projectDir, file)
  if (!existsSync(sourcePath)) {
    console.warn(`[sync-projects] Missing asset "${file}" in ${relative(root, projectDir)}`)
    return null
  }

  if (!isImageFile(file)) {
    console.warn(`[sync-projects] Skipping non-image asset "${file}"`)
    return null
  }

  const baseName = basename(file, extname(file))
  const coverFile = `${baseName}.jpg`
  const cover1xFile = `${baseName}-960.jpg`
  const coverPath = join(destDir, coverFile)
  const cover1xPath = join(destDir, cover1xFile)

  await optimizeCoverImage(sourcePath, coverPath, COVER_WIDTH, COVER_HEIGHT)
  await optimizeCoverImage(sourcePath, cover1xPath, COVER_WIDTH_1X, COVER_HEIGHT_1X)

  const metadata = await sharp(coverPath).metadata()
  const kb = Math.round(statSync(coverPath).size / 1024)
  const kb1x = Math.round(statSync(cover1xPath).size / 1024)
  console.log(
    `[sync-projects]   ${coverFile} -> ${metadata.width}x${metadata.height}, ${kb} KB (+ ${cover1xFile} ${kb1x} KB)`,
  )

  return {
    file: coverFile,
    file1x: cover1xFile,
    width: metadata.width ?? COVER_WIDTH,
    height: metadata.height ?? COVER_HEIGHT,
  }
}

async function syncAsset(projectDir, destDir, file, maxWidth, quality) {
  if (isIgnoredPath(file)) {
    return null
  }

  const sourcePath = join(projectDir, file)
  if (!existsSync(sourcePath)) {
    console.warn(`[sync-projects] Missing asset "${file}" in ${relative(root, projectDir)}`)
    return null
  }

  if (!isImageFile(file)) {
    console.warn(`[sync-projects] Skipping non-image asset "${file}"`)
    return null
  }

  const relativeOutput = optimizedRelativePath(file)
  const targetPath = join(destDir, relativeOutput)
  await optimizeImage(sourcePath, targetPath, maxWidth, quality)

  const metadata = await sharp(targetPath).metadata()
  const kb = Math.round(statSync(targetPath).size / 1024)
  console.log(
    `[sync-projects]   ${relativeOutput} -> ${metadata.width}x${metadata.height}, ${kb} KB`,
  )

  return relativeOutput
}

async function syncGalleryImage(projectDir, destDir, file) {
  if (isIgnoredPath(file)) {
    return null
  }

  const sourcePath = join(projectDir, file)
  if (!existsSync(sourcePath)) {
    console.warn(`[sync-projects] Missing asset "${file}" in ${relative(root, projectDir)}`)
    return null
  }

  if (!isImageFile(file)) {
    console.warn(`[sync-projects] Skipping non-image asset "${file}"`)
    return null
  }

  const sourceMeta = await sharp(sourcePath).metadata()
  const sourceMaxDim = Math.max(sourceMeta.width ?? 0, sourceMeta.height ?? 0)
  const displayRelative = optimizedRelativePath(file)
  const displayPath = join(destDir, displayRelative)

  if (sourceMaxDim <= DISPLAY_MAX_WIDTH) {
    await optimizeImage(sourcePath, displayPath, FULL_MAX_WIDTH, FULL_QUALITY)
    const metadata = await sharp(displayPath).metadata()
    const kb = Math.round(statSync(displayPath).size / 1024)
    console.log(
      `[sync-projects]   ${displayRelative} -> ${metadata.width}x${metadata.height}, ${kb} KB (display + full)`,
    )

    return {
      file: displayRelative,
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    }
  }

  await optimizeImage(sourcePath, displayPath, DISPLAY_MAX_WIDTH, DISPLAY_QUALITY)
  const displayMeta = await sharp(displayPath).metadata()
  const displayKb = Math.round(statSync(displayPath).size / 1024)

  const fullRelative = optimizedRelativePath(file, '-full')
  const fullPath = join(destDir, fullRelative)
  await optimizeImage(sourcePath, fullPath, FULL_MAX_WIDTH, FULL_QUALITY)
  const fullMeta = await sharp(fullPath).metadata()
  const fullKb = Math.round(statSync(fullPath).size / 1024)

  console.log(
    `[sync-projects]   ${displayRelative} -> ${displayMeta.width}x${displayMeta.height}, ${displayKb} KB (+ ${fullRelative} ${fullMeta.width}x${fullMeta.height}, ${fullKb} KB)`,
  )

  return {
    file: displayRelative,
    fullFile: fullRelative,
    width: displayMeta.width ?? 0,
    height: displayMeta.height ?? 0,
    fullWidth: fullMeta.width ?? 0,
    fullHeight: fullMeta.height ?? 0,
  }
}

function copyDocument(projectDir, destDir, file) {
  if (isIgnoredPath(file)) {
    return null
  }

  const sourcePath = join(projectDir, file)
  if (!existsSync(sourcePath)) {
    console.warn(`[sync-projects] Missing document "${file}" in ${relative(root, projectDir)}`)
    return null
  }

  if (!isDocumentFile(file)) {
    console.warn(`[sync-projects] Skipping unsupported document "${file}"`)
    return null
  }

  const relativeOutput = file.replace(/\\/g, '/')
  const targetPath = join(destDir, relativeOutput)
  mkdirSync(dirname(targetPath), { recursive: true })

  const sourceStat = statSync(sourcePath)
  try {
    if (existsSync(targetPath) && statSync(targetPath).size === sourceStat.size) {
      const kb = Math.round(sourceStat.size / 1024)
      console.log(`[sync-projects]   ${relativeOutput} -> document, ${kb} KB (unchanged)`)
      return relativeOutput
    }
  } catch (error) {
    if (error?.code !== 'EPERM') {
      throw error
    }
    console.warn(
      `[sync-projects]   ${relativeOutput} -> document locked, using existing copy (${Math.round(sourceStat.size / 1024)} KB)`,
    )
    return relativeOutput
  }

  try {
    cpSync(sourcePath, targetPath)
  } catch (error) {
    if (error?.code === 'EPERM') {
      console.warn(
        `[sync-projects]   ${relativeOutput} -> could not update (file locked), using existing copy (${Math.round(sourceStat.size / 1024)} KB)`,
      )
      return relativeOutput
    }
    throw error
  }

  const kb = Math.round(statSync(targetPath).size / 1024)
  console.log(`[sync-projects]   ${relativeOutput} -> document, ${kb} KB`)

  return relativeOutput
}

async function syncPreview(projectDir, destDir, previewFile) {
  if (!previewFile) return null
  return syncAsset(projectDir, destDir, previewFile, PREVIEW_MAX_WIDTH, PREVIEW_QUALITY)
}

function inferCategory(projectDir) {
  const relativePath = relative(projectsRoot, projectDir).replace(/\\/g, '/')
  if (relativePath.startsWith('Software/')) return 'software'
  if (relativePath.startsWith('Architecture/')) return 'architecture'
  return 'architecture'
}

function normalizeProject(project, projectDir) {
  return {
    ...project,
    category: project.category ?? inferCategory(projectDir),
    featured: Boolean(project.featured),
  }
}

function hasUsableCover(projectDir, project) {
  if (!project.cover || isIgnoredPath(project.cover)) return false
  const sourcePath = join(projectDir, project.cover)
  return existsSync(sourcePath) && isImageFile(project.cover)
}

function hasUsableBanner(projectDir, project) {
  if (!project.banner || isIgnoredPath(project.banner)) return false
  const sourcePath = join(projectDir, project.banner)
  return existsSync(sourcePath) && isImageFile(project.banner)
}

export async function syncProjects(options = {}) {
  const { quiet = false } = options
  const projectDirs = findProjectDirs()
  const manifest = []
  const usedIds = new Set()

  mkdirSync(publicRoot, { recursive: true })
  const syncedIds = new Set()

  for (const projectDir of projectDirs) {
    const raw = loadProjectDefinition(projectDir, usedIds)
    const project = normalizeProject(raw, projectDir)

    syncedIds.add(project.id)
    const destDir = join(publicRoot, project.id)
    mkdirSync(destDir, { recursive: true })

    const hasCover = hasUsableCover(projectDir, project)
    if (!quiet) {
      console.log(
        `[sync-projects] Syncing ${project.title} (${project.id})${hasCover ? '' : ' [no cover]'}`,
      )
    }

    let optimizedCover = null
    let coverSrcSet = ''
    let coverWidth = 0
    let coverHeight = 0
    if (hasCover) {
      const coverResult = await syncCover(projectDir, destDir, project.cover)
      if (coverResult) {
        optimizedCover = coverResult.file
        coverWidth = coverResult.width
        coverHeight = coverResult.height
        coverSrcSet = `./projects/${project.id}/${coverResult.file1x} 960w, ./projects/${project.id}/${coverResult.file} ${coverResult.width}w`
      }
    } else if (project.cover && !quiet) {
      console.warn(
        `[sync-projects]   Cover "${project.cover}" not found — using empty tile`,
      )
    }

    let optimizedBanner = null
    if (hasUsableBanner(projectDir, project)) {
      optimizedBanner = await syncAsset(
        projectDir,
        destDir,
        project.banner,
        DISPLAY_MAX_WIDTH,
        DISPLAY_QUALITY,
      )
    } else if (project.banner && !quiet) {
      console.warn(
        `[sync-projects]   Banner "${project.banner}" not found — falling back to cover`,
      )
    }

    const syncedBlocks = []
    for (const block of project.blocks) {
      if (block.type === 'text') {
        syncedBlocks.push(block)
        continue
      }

      const syncedImages = []
      for (const file of block.files) {
        const optimizedImage = await syncGalleryImage(projectDir, destDir, file)

        if (!optimizedImage) {
          continue
        }

        const imageAsset = {
          file: optimizedImage.file,
          url: `./projects/${project.id}/${optimizedImage.file}`,
        }

        if (optimizedImage.width > 0 && optimizedImage.height > 0) {
          imageAsset.width = optimizedImage.width
          imageAsset.height = optimizedImage.height
        }

        if (optimizedImage.fullFile) {
          imageAsset.fullFile = optimizedImage.fullFile
          imageAsset.fullUrl = `./projects/${project.id}/${optimizedImage.fullFile}`
          if (optimizedImage.fullWidth > 0 && optimizedImage.fullHeight > 0) {
            imageAsset.fullWidth = optimizedImage.fullWidth
            imageAsset.fullHeight = optimizedImage.fullHeight
          }
        }

        syncedImages.push(imageAsset)
      }

      if (syncedImages.length === 0) {
        continue
      }

      syncedBlocks.push({
        type: block.type === 'collage' ? 'collage' : 'image',
        images: syncedImages,
        text: block.text,
        textDe: block.textDe,
        textIt: block.textIt,
        textPosition: block.textPosition,
      })
    }

    const syncedLinks = []
    for (const link of project.links) {
      const previewFile = await syncPreview(projectDir, destDir, link.preview)
      syncedLinks.push({
        url: link.url,
        title: link.title,
        titleDe: link.titleDe,
        titleIt: link.titleIt,
        description: link.description,
        descriptionDe: link.descriptionDe,
        descriptionIt: link.descriptionIt,
        previewUrl: previewFile ? `./projects/${project.id}/${previewFile}` : '',
      })
    }

    const syncedDocuments = []
    for (const document of project.documents) {
      const copiedFile = copyDocument(projectDir, destDir, document.file)
      if (!copiedFile) {
        continue
      }

      const sourcePath = join(projectDir, document.file)
      const previewFile = await syncPreview(projectDir, destDir, document.preview)
      syncedDocuments.push({
        file: copiedFile,
        url: `./projects/${project.id}/${copiedFile}`,
        title: document.title,
        titleDe: document.titleDe,
        titleIt: document.titleIt,
        description: document.description,
        descriptionDe: document.descriptionDe,
        descriptionIt: document.descriptionIt,
        previewUrl: previewFile ? `./projects/${project.id}/${previewFile}` : '',
        kind: getDocumentKind(document.file),
        size: statSync(sourcePath).size,
      })
    }

    manifest.push({
      ...project,
      cover: optimizedCover ?? '',
      coverUrl: optimizedCover ? `./projects/${project.id}/${optimizedCover}` : '',
      coverSrcSet,
      coverWidth,
      coverHeight,
      banner: optimizedBanner ?? '',
      bannerUrl: optimizedBanner ? `./projects/${project.id}/${optimizedBanner}` : '',
      blocks: syncedBlocks,
      links: syncedLinks,
      documents: syncedDocuments,
    })
  }

  for (const entry of readdirSync(publicRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || syncedIds.has(entry.name)) {
      continue
    }
    rmSync(join(publicRoot, entry.name), { recursive: true, force: true })
  }

  manifest.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return b.year.localeCompare(a.year)
  })

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  if (!quiet) {
    console.log(
      `[sync-projects] Wrote ${manifest.length} projects to ${relative(root, manifestPath)}`,
    )
  }

  return manifest
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  syncProjects().catch((error) => {
    console.error('[sync-projects] Failed:', error)
    process.exit(1)
  })
}
