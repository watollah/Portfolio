import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, isAbsolute, join, relative, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { syncProjects } from './scripts/sync-projects.mjs'

const projectsRoot = resolve('Projects')
const generatedProjectsRoot = resolve('public/projects')

const PROJECT_ASSET_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.rtf': 'application/rtf',
  '.txt': 'text/plain',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

function serveGeneratedProjectAssets() {
  return function generatedProjectAssetsMiddleware(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }

    const urlPath = decodeURIComponent((req.url ?? '').split('?')[0] ?? '')
    if (!urlPath.startsWith('/projects/')) {
      next()
      return
    }

    const relativeUrl = urlPath.slice('/projects/'.length)
    if (!relativeUrl || relativeUrl.endsWith('/')) {
      next()
      return
    }

    const filePath = resolve(join(generatedProjectsRoot, relativeUrl))
    const relativePath = relative(generatedProjectsRoot, filePath)
    if (!relativePath || isAbsolute(relativePath) || relativePath.startsWith('..')) {
      next()
      return
    }

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      next()
      return
    }

    res.setHeader(
      'Content-Type',
      PROJECT_ASSET_MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    )

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    createReadStream(filePath).pipe(res)
  }
}

function isProjectsPath(filePath: string) {
  const normalized = resolve(filePath).replace(/\\/g, '/')
  const rootPath = projectsRoot.replace(/\\/g, '/')
  return normalized.startsWith(rootPath) && !normalized.includes('/_template/')
}

function projectsSyncPlugin() {
  let syncing = false
  let queued = false
  let debounceTimer

  async function runSync(server) {
    if (syncing) {
      queued = true
      return
    }

    syncing = true
    try {
      await syncProjects({ quiet: true })
      server.ws.send({ type: 'full-reload', path: '*' })
    } catch (error) {
      console.error('[projects-sync] Failed:', error)
    } finally {
      syncing = false
      if (queued) {
        queued = false
        void runSync(server)
      }
    }
  }

  function scheduleSync(server) {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void runSync(server)
    }, 400)
  }

  return {
    name: 'projects-sync',
    configureServer(server) {
      server.middlewares.use(serveGeneratedProjectAssets())
      server.watcher.add(projectsRoot)
      server.watcher.on('all', (_event, filePath) => {
        if (!isProjectsPath(filePath)) {
          return
        }
        scheduleSync(server)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), projectsSyncPlugin()],
  base: './',
})
