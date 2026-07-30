// Path: src/app/produkter/[handle]/ProductPageView/components/ProductPageAccordion.tsx
import { Activity, Info, Layers3, Ruler, TableProperties, WashingMachine, Waypoints } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import type { AccordionSectionData, ProductPageAccordionProps } from '@types'
import type {
  ProductAccordionSection,
  ProductAccordionSectionId
} from '@/db/data/products/product-page-content'
import { ProductDetailsAccordionSection } from './ProductDetailsAccordionSection'
import { ProductAccordionInteractionReporter } from './ProductAccordionInteractionReporter'

const sectionIcons = {
  materialer: Layers3,
  funksjoner: Activity,
  egenskaper: TableProperties,
  bruksomrader: Waypoints,
  passform: Ruler,
  vaskeanvisning: WashingMachine
} as const satisfies Record<ProductAccordionSectionId, LucideIcon>

function mapAccordionSection(section: ProductAccordionSection): AccordionSectionData {
  return {
    id: section.id,
    title: section.title,
    content: section,
    Icon: sectionIcons[section.id],
    color: 'var(--card-foreground)'
  }
}

export function ProductPageAccordion({
  product,
  sections,
  selectedVariant
}: ProductPageAccordionProps) {
  if (!sections || sections.length === 0) {
    return null
  }

  const sectionData = sections.map(mapAccordionSection)
  const containerId = `product-details-${product.handle}`

  return (
    <article
      id={containerId}
      className='relative overflow-hidden rounded-[1.75rem] py-6'
      aria-labelledby='product-details-heading'
    >
      <ProductAccordionInteractionReporter
        containerId={containerId}
        product={product}
        selectedVariant={selectedVariant}
      />
      <div className='mx-auto text-left'>
        <AnimatedBlock className='will-animate-fade-in-scale mb-6' delay='0s' threshold={0.3}>
          <BrandBadge tone='neutral' className='gap-2 text-left'>
            <Info className='size-5' aria-hidden='true' />
            <h2 id='product-details-heading' className='text-lg leading-[1.2] tracking-normal'>
              Produktdetaljer
            </h2>
          </BrandBadge>
        </AnimatedBlock>

        <div className='flex w-full flex-col'>
          {sectionData.map(section => (
            <ProductDetailsAccordionSection key={section.id} sectionData={section} />
          ))}
        </div>
      </div>
    </article>
  )
}
