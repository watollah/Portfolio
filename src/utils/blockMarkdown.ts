export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'break' }
  | { type: 'strong'; children: InlineNode[] }
  | { type: 'em'; children: InlineNode[] }
  | { type: 'del'; children: InlineNode[] }
  | { type: 'underline'; children: InlineNode[] }

export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'ul'; items: InlineNode[][] }
  | { type: 'ol'; items: InlineNode[][] }

type CloseMarker = '**' | '__' | '~~' | '*' | '_' | '</u>'

type FormatType = 'strong' | 'em' | 'del' | 'underline'

const UL_RE = /^[ \t]{0,3}[-*+][ \t]+(.*)$/
const OL_RE = /^[ \t]{0,3}\d{1,9}\.[ \t]+(.*)$/

const OPENERS: { marker: string; close: CloseMarker; type: FormatType }[] = [
  { marker: '**', close: '**', type: 'strong' },
  { marker: '__', close: '__', type: 'underline' },
  { marker: '~~', close: '~~', type: 'del' },
  { marker: '<u>', close: '</u>', type: 'underline' },
  { marker: '*', close: '*', type: 'em' },
  { marker: '_', close: '_', type: 'em' },
]

function isWhitespace(ch: string | undefined) {
  return ch !== undefined && /\s/.test(ch)
}

function isWordChar(ch: string | undefined) {
  return ch !== undefined && /[\p{L}\p{N}]/u.test(ch)
}

function canOpen(source: string, index: number, marker: string) {
  if (marker === '<u>') return true

  const after = source[index + marker.length]
  if (after === undefined || isWhitespace(after)) return false
  if (isWordChar(source[index - 1])) return false
  return true
}

function canClose(source: string, index: number, close: CloseMarker) {
  if (close === '</u>') return true
  if (isWhitespace(source[index - 1])) return false
  if (isWordChar(source[index + close.length])) return false
  return true
}

function matchClose(source: string, index: number, close: CloseMarker) {
  if (!source.startsWith(close, index)) return false
  return canClose(source, index, close)
}

function matchOpener(source: string, index: number) {
  for (const opener of OPENERS) {
    if (source.startsWith(opener.marker, index) && canOpen(source, index, opener.marker)) {
      return opener
    }
  }
  return null
}

function parseInlineUntil(
  source: string,
  start: number,
  close: CloseMarker | null,
): { nodes: InlineNode[]; index: number; closed: boolean } {
  const nodes: InlineNode[] = []
  let buffer = ''
  let index = start

  const flush = () => {
    if (!buffer) return
    nodes.push({ type: 'text', value: buffer })
    buffer = ''
  }

  while (index < source.length) {
    if (close && matchClose(source, index, close)) {
      const nestedLonger =
        (close === '*' && source.startsWith('**', index)) ||
        (close === '_' && source.startsWith('__', index))
      if (nestedLonger) {
        const opener = matchOpener(source, index)
        if (opener) {
          const inner = parseInlineUntil(source, index + opener.marker.length, opener.close)
          if (inner.closed) {
            flush()
            if (inner.nodes.length > 0) {
              nodes.push({ type: opener.type, children: inner.nodes })
            }
            index = inner.index
            continue
          }
        }
      }

      flush()
      return { nodes, index: index + close.length, closed: true }
    }

    const next = source[index + 1]
    if (source[index] === '\\' && next && '*_~<>\\'.includes(next)) {
      buffer += next
      index += 2
      continue
    }

    if (source[index] === '\n') {
      flush()
      nodes.push({ type: 'break' })
      index += 1
      continue
    }

    const opener = matchOpener(source, index)
    if (opener) {
      const inner = parseInlineUntil(source, index + opener.marker.length, opener.close)
      if (inner.closed) {
        flush()
        if (inner.nodes.length > 0) {
          nodes.push({ type: opener.type, children: inner.nodes })
        }
        index = inner.index
        continue
      }
    }

    buffer += source[index]
    index += 1
  }

  flush()
  return { nodes, index, closed: false }
}

function parseInline(source: string): InlineNode[] {
  return parseInlineUntil(source, 0, null).nodes
}

export function parseBlockMarkdown(source: string): BlockNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: BlockNode[] = []
  let index = 0

  while (index < lines.length) {
    if (lines[index].trim() === '') {
      index += 1
      continue
    }

    if (UL_RE.test(lines[index])) {
      const items: InlineNode[][] = []
      while (index < lines.length) {
        const match = lines[index].match(UL_RE)
        if (!match) break
        items.push(parseInline(match[1] ?? ''))
        index += 1
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (OL_RE.test(lines[index])) {
      const items: InlineNode[][] = []
      while (index < lines.length) {
        const match = lines[index].match(OL_RE)
        if (!match) break
        items.push(parseInline(match[1] ?? ''))
        index += 1
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim() !== '') {
      if (UL_RE.test(lines[index]) || OL_RE.test(lines[index])) break
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push({ type: 'paragraph', children: parseInline(paragraphLines.join('\n')) })
  }

  return blocks
}

function stripInline(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text') return node.value
      if (node.type === 'break') return ' '
      return stripInline(node.children)
    })
    .join('')
}

export function stripBlockMarkdown(source: string): string {
  return parseBlockMarkdown(source)
    .map((block) => {
      if (block.type === 'paragraph') return stripInline(block.children)
      return block.items.map(stripInline).filter(Boolean).join(', ')
    })
    .filter(Boolean)
    .join(' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}
