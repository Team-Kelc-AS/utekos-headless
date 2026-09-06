import HavdypMaritimeBlueMdx from './havdypMaritimeBlue.mdx'
import { havdypColorGuideMdxComponents } from './havdypColorGuideMdxComponents'

export function HavdypColorGuideDocument() {
  return (
    <article className='color-guide-mdx grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 bg-primary font-sans text-foreground sm:gap-x-6'>
      <HavdypMaritimeBlueMdx components={havdypColorGuideMdxComponents} />
    </article>
  )
}
