import type { MagazineBlock } from '../types'
import { MagazineCalloutBlock } from './MagazineCalloutBlock'

type MagazineCustomSectionBlockProps = {
  block: Extract<MagazineBlock, { type: 'customSection' }>
}

export function MagazineCustomSectionBlock({ block }: MagazineCustomSectionBlockProps) {
  return (
    <MagazineCalloutBlock
      block={{
        type: 'callout',
        tone: 'quiet',
        title: block.title ?? 'Redaksjonell seksjon',
        text: `Custom section "${block.id}" er registrert, men mangler en renderer.`
      }}
    />
  )
}
