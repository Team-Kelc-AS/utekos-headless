import type { MagazineBlock } from '../types'

type MagazineLeadBlockProps = {
  block: Extract<MagazineBlock, { type: 'lead' }>
}

export function MagazineLeadBlock({ block }: MagazineLeadBlockProps) {
  return (
    <p className='font-utekos-text-medium text-balance text-2xl leading-[1.32] text-foreground sm:text-3xl'>
      {block.text}
    </p>
  )
}
