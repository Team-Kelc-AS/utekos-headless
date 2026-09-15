import type { MagazineBlock } from '../types'

type MagazineParagraphBlockProps = {
  block: Extract<MagazineBlock, { type: 'paragraph' }>
}

export function MagazineParagraphBlock({ block }: MagazineParagraphBlockProps) {
  return <p className='text-lg leading-[1.65] text-foreground sm:text-xl'>{block.text}</p>
}
