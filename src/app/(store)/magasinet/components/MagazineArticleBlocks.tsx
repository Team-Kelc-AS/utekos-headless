import type { MagazineBlock } from '../types'
import { MagazineBlockRenderer } from './MagazineBlockRenderer'

type MagazineArticleBlocksProps = {
  blocks: MagazineBlock[]
}

export function MagazineArticleBlocks({ blocks }: MagazineArticleBlocksProps) {
  return (
    <div className='space-y-8'>
      {blocks.map((block, index) => (
        <MagazineBlockRenderer key={`${block.type}-${index}`} block={block} />
      ))}
    </div>
  )
}
