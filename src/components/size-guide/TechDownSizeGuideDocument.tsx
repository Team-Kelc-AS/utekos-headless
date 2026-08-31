import TechDownSizeGuideDocumentMdx from './techDownSizeGuideDocument.mdx'
import { sizeGuideMdxComponents } from './sizeGuideMdxComponents'

export function TechDownSizeGuideDocument() {
  return (
    <article className='size-guide-mdx font-sans text-foreground'>
      <TechDownSizeGuideDocumentMdx
        components={sizeGuideMdxComponents}
      />
    </article>
  )
}
