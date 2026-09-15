import type { MagazineBlock } from '../types'
import { MagazineCalloutBlock } from './MagazineCalloutBlock'
import { MagazineComparisonBlock } from './MagazineComparisonBlock'
import { MagazineCtaBlock } from './MagazineCtaBlock'
import { MagazineCustomSectionBlock } from './MagazineCustomSectionBlock'
import { MagazineFaqBlock } from './MagazineFaqBlock'
import { MagazineFeatureGridBlock } from './MagazineFeatureGridBlock'
import { MagazineHeadingBlock } from './MagazineHeadingBlock'
import { MagazineImageBlock } from './MagazineImageBlock'
import { MagazineLeadBlock } from './MagazineLeadBlock'
import { MagazineParagraphBlock } from './MagazineParagraphBlock'
import { MagazineStepListBlock } from './MagazineStepListBlock'

type MagazineBlockRendererProps = {
  block: MagazineBlock
}

export function MagazineBlockRenderer({ block }: MagazineBlockRendererProps) {
  switch (block.type) {
    case 'lead':
      return <MagazineLeadBlock block={block} />
    case 'paragraph':
      return <MagazineParagraphBlock block={block} />
    case 'heading':
      return <MagazineHeadingBlock block={block} />
    case 'image':
      return <MagazineImageBlock block={block} />
    case 'callout':
      return <MagazineCalloutBlock block={block} />
    case 'cta':
      return <MagazineCtaBlock block={block} />
    case 'featureGrid':
      return <MagazineFeatureGridBlock block={block} />
    case 'stepList':
      return <MagazineStepListBlock block={block} />
    case 'comparison':
      return <MagazineComparisonBlock block={block} />
    case 'faq':
      return <MagazineFaqBlock block={block} />
    case 'customSection':
      return <MagazineCustomSectionBlock block={block} />
  }
}
