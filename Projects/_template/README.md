# Project template

Copy this folder to start a new portfolio project. JSON does not support comments, so this file documents every field in `project.json`.

**Quick start**

1. Duplicate `Projects/_template/` to the correct category folder (see [Folder placement](#folder-placement)).
2. Rename the folder to your project title (e.g. `My Project`).
3. Edit `project.json`, add a cover image, and put assets next to it (or in subfolders).
4. Run `npm run sync:projects` (or your usual dev command) to publish assets and regenerate the site manifest.

The `_template` folder is **not** synced to the website.

---

## Folder placement

| Category       | Path |
|----------------|------|
| Software       | `Projects/Software/{ProjectName}/` |
| Architecture   | `Projects/Architecture/{Group}/{ProjectName}/` — e.g. `Bachelor/` or `Master/` |

Put source files (Affinity, raw exports, etc.) in a `Sources/` or `sources/` subfolder if you like — those folders are ignored by the sync script but files elsewhere can still be referenced by path.

---

## Top-level fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Recommended | URL slug for the project page (`hotel-viadukt`). If empty, derived from the folder name. Must be unique across all projects. |
| `category` | Optional | `"software"` or `"architecture"`. Usually omitted — inferred from the folder path. |
| `featured` | Optional | `true` to show on the home page “Selected Projects” section. Default: `false`. |
| `year` | Recommended | Display year (string), e.g. `"2025"`. Shown in the project subtitle. |
| `title` | Required | Project title in English. |
| `title_de` | Optional | German title. Falls back to `title`. |
| `title_it` | Optional | Italian title. Falls back to `title`. |
| `context` | Optional | Short context line in English (e.g. `"Master thesis"`, `"Research project at DLR"`). |
| `context_de` | Optional | German version of `context`. Falls back to `context` if omitted. |
| `context_it` | Optional | Italian version of `context`. Falls back to `context` if omitted. |

Legacy alias: `kontext` / `kontext_de` / `kontextDe` still work and map to `context`.
| `description` | Recommended | Short summary for project cards and SEO (English). |
| `description_de` | Optional | German summary. Falls back to `description`. |
| `description_it` | Optional | Italian summary. Falls back to `description`. |
| `tags` | Optional | Array of tag strings for filtering/display, e.g. `["Web App", "Master"]`. |
| `authors` | Optional | Array of author names, e.g. `["Hannes Watolla", "Co-Author"]`. Shown on the project detail page as “Created by: …”. Omit for solo work. |
| `cover` | Recommended | Cover image filename (relative to the project folder). Used on project tiles (4:3 crop) and as fallback banner. Supported: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`. If missing, the sync script looks for `cover.png`, `cover.jpg`, etc. |
| `banner` | Optional | Wide hero image on the project detail page. Same formats as `cover`. If empty or missing, the cover is used. |
| `blocks` | Recommended | Ordered content for the project detail page (images and text). See [Blocks](#blocks). |
| `links` | Optional | External links with optional previews. See [Links](#links). |
| `documents` | Optional | Downloadable files (PDF, Office, etc.). See [Documents](#documents). |

### Fields added by sync (do not edit)

These appear in `src/data/projects.manifest.json` after sync — never put them in your source `project.json`:

`coverUrl`, `coverSrcSet`, `coverWidth`, `coverHeight`, `bannerUrl`, and inside blocks/links/documents the resolved `url`, `previewUrl`, `kind`, `size` fields.

Use **`field_de`** and **`field_it`** suffixes for translations (e.g. `title_de`, `text_it`). The sync script also accepts legacy camelCase names (`titleDe`, `textDe`) for older project files.

---

## Blocks

`blocks` is an array of content sections shown top to bottom on the project page. Two block types are supported.

### Text block

Standalone paragraph with no image.

```json
{
  "type": "text",
  "text": "English paragraph.",
  "text_de": "Deutscher Absatz.",
  "text_it": "Paragrafo in italiano."
}
```

All of `text`, `text_de`, and `text_it` are optional in the file; empty text blocks are skipped on the site.

**Markdown** — `text` fields (text blocks and image/collage captions) support a small markdown subset:

| Style | Syntax |
|-------|--------|
| Bold | `**bold**` |
| Italic | `*italic*` or `_italic_` |
| Underline | `__underline__` or `<u>underline</u>` |
| Strikethrough | `~~strikethrough~~` |
| Unordered list | `- item` (also `*` or `+`) |
| Ordered list | `1. item` |

Blank lines start a new paragraph. A single line break inside a paragraph is kept as a line break. Escape a marker with a backslash (`\*` `\_` `\~`).

### Image block

One or more images with optional caption and layout.

```json
{
  "type": "image",
  "files": ["photo.jpg"],
  "textPosition": "bottom",
  "text": "Caption in English.",
  "text_de": "Bildunterschrift auf Deutsch.",
  "text_it": "Didascalia in italiano."
}
```

**Images**

- `"files": ["photo.jpg"]` — one image (displayed like a single image).
- `"files": ["a.jpg", "b.jpg"]` — carousel with previous/next when more than one image.

Always use `files` as an array. A single-item array shows one image without carousel controls.

**Caption fields**

- `text` / `text_de` / `text_it` — caption beside or below the image (locale-aware). Same markdown as text blocks.
- Legacy aliases: `caption`, `caption_de`, `captionDe`, etc. still work and map to `text`.

**`textPosition`** — caption placement relative to the image:

| Value | Layout |
|-------|--------|
| `"bottom"` | Caption below the image (default). |
| `"top"` | Caption above the image. |
| `"left"` | Caption left, image right. |
| `"right"` | Caption right, image left. |

Invalid values default to `"bottom"`.

Image paths are relative to the project folder (subfolders allowed). Supported formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`. Images are optimized to JPEG during sync.

Blocks with missing image files are dropped from the manifest (with a console warning).

### Collage block

Same fields as an image block, but multiple images are shown **side by side** instead of in a carousel.

```json
{
  "type": "collage",
  "files": ["photo-a.jpg", "photo-b.jpg"],
  "textPosition": "bottom",
  "text": "Caption in English.",
  "text_de": "Bildunterschrift auf Deutsch.",
  "text_it": "Didascalia in italiano."
}
```

Use `"type": "image"` when you want a carousel (prev/next). Use `"type": "collage"` when images should appear next to each other in one row (stacked vertically on small screens).

### Legacy `images` array (deprecated)

Older projects may use a top-level `images` array instead of `blocks`:

```json
"images": [
  { "files": ["photo.png"], "caption": "English", "captionDe": "Deutsch" }
]
```

Sync converts each entry to an image block with `textPosition: "bottom"`. Prefer `blocks` for new projects — it supports text-only sections, multi-image carousels, collages, and caption positioning.

---

## Links

External URLs shown in the project links section.

```json
{
  "url": "https://example.com",
  "title": "Live Demo",
  "title_de": "Live-Demo",
  "title_it": "Demo live",
  "description": "Optional short description.",
  "description_de": "Optionale kurze Beschreibung.",
  "description_it": "Descrizione breve opzionale.",
  "preview": "link-preview.png"
}
```

| Field | Description |
|-------|-------------|
| `url` | Required. Link target. Entries without `url` are removed. |
| `title` / `title_de` / `title_it` | Link label. Defaults to the URL if `title` is missing. |
| `description` / `description_de` / `description_it` | Optional subtitle text. |
| `preview` | Optional screenshot/image in the project folder; optimized for display. |

Legacy: a top-level `"url"` on the project (outside `links`) still works — if `links` is empty, sync creates a default “Visit project” link from it.

---

## Documents

Downloadable files copied as-is to the public project folder.

```json
{
  "file": "documents/thesis.pdf",
  "title": "Project Report",
  "title_de": "Projektbericht",
  "title_it": "Relazione di progetto",
  "description": "Optional description below the preview.",
  "description_de": "Optionale Beschreibung unter der Vorschau.",
  "description_it": "Descrizione opzionale sotto l'anteprima.",
  "preview": "documents/thesis-preview.png"
}
```

**Supported document extensions:** `.pdf`, `.doc`, `.docx`, `.rtf`, `.txt`, `.ppt`, `.pptx`, `.xls`, `.xlsx`

| Field | Description |
|-------|-------------|
| `file` | Required. Path relative to the project folder. |
| `title` / `title_de` / `title_it` | Display name. Defaults to the filename without extension. |
| `description` / `description_de` / `description_it` | Optional helper text. |
| `preview` | Optional preview image (same rules as link previews). |

---

## Minimal example

```json
{
  "id": "my-project",
  "featured": false,
  "year": "2025",
  "title": "My Project",
  "title_de": "Mein Projekt",
  "title_it": "Il mio progetto",
  "context": "Course project",
  "context_de": "Studienprojekt",
  "context_it": "Progetto di corso",
  "description": "One-line summary.",
  "description_de": "Kurzbeschreibung.",
  "description_it": "Riassunto breve.",
  "tags": ["Tag"],
  "authors": ["Your Name"],
  "cover": "cover.png",
  "banner": "",
  "blocks": [
    {
      "type": "image",
      "files": ["cover.png"],
      "textPosition": "bottom",
      "text": "Hero image.",
      "text_de": "Titelbild.",
      "text_it": "Immagine di copertina."
    }
  ],
  "links": [],
  "documents": []
}
```

See `project.json` in this folder for a fuller example with every block type and option.
