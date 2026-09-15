import Image from 'next/image'
import type { MagazineBlock } from '../types'

type MagazineImageBlockProps = {
  block: Extract<MagazineBlock, { type: 'image' }>
}

export function MagazineImageBlock({
  block
}: MagazineImageBlockProps) {
  return (
    <figure className='my-14 overflow-hidden rounded-lg border border-background/10 bg-foreground shadow-[0_24px_70px_-54px_color-mix(in_oklch,var(--background)_65%,transparent)]'>
      <Image
        src={block.src}
        alt={block.alt}
        width={block.width}
        height={block.height}
        sizes='(max-width: 768px) calc(100vw - 32px), (max-width: 1200px) 760px, 760px'
        className={
          block.width === block.height ?
            'aspect-square h-auto w-full object-cover'
          : 'h-auto w-full object-cover'
        }
        {...(block.priority ? { priority: true } : {})}
      />
      {block.caption && (
        <figcaption className='leading-text-paragraph px-5 py-4 text-sm text-background/80'>
          {block.caption}
        </figcaption>
      )}
    </figure>
  )
}
