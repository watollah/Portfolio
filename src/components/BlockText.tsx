import type { ReactNode } from 'react'
import { parseBlockMarkdown, type BlockNode, type InlineNode } from '../utils/blockMarkdown'

interface BlockTextProps {
  text: string
  className?: string
  as?: 'div' | 'figcaption'
}

function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.type) {
      case 'text':
        return node.value
      case 'break':
        return <br key={index} />
      case 'strong':
        return <strong key={index}>{renderInline(node.children)}</strong>
      case 'em':
        return <em key={index}>{renderInline(node.children)}</em>
      case 'del':
        return <del key={index}>{renderInline(node.children)}</del>
      case 'underline':
        return <u key={index}>{renderInline(node.children)}</u>
    }
  })
}

function renderBlock(block: BlockNode, index: number) {
  if (block.type === 'paragraph') {
    return <p key={index}>{renderInline(block.children)}</p>
  }

  const List = block.type === 'ul' ? 'ul' : 'ol'
  return (
    <List key={index}>
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex}>{renderInline(item)}</li>
      ))}
    </List>
  )
}

export function BlockText({ text, className, as: Component = 'div' }: BlockTextProps) {
  const blocks = parseBlockMarkdown(text)

  return <Component className={className}>{blocks.map(renderBlock)}</Component>
}
