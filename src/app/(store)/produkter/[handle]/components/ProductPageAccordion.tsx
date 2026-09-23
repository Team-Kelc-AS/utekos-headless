import {
  Activity,
  Info,
  Layers3,
  Ruler,
  TableProperties,
  WashingMachine,
  Waypoints
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import type {
  AccordionSectionData,
  ProductPageAccordionProps
} from '@types'
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

type SelectedVariant = ProductPageAccordionProps['selectedVariant']

type WeightSpecifications = {
  fillWeight: string
  totalWeight: string
}

function getTechDownWeightSpecifications(
  variant: SelectedVariant
): WeightSpecifications | null {
  const size = variant.selectedOptions.find(
    option => option.name === 'Størrelse'
  )?.value

  switch (size) {
    case 'Liten':
      return {
        fillWeight: '520 g',
        totalWeight: '1300 g'
      }
    case 'Middels':
      return {
        fillWeight: '620 g',
        totalWeight: '1400 g'
      }
    case 'Stor':
      return {
        fillWeight: '720 g',
        totalWeight: '1500 g'
      }
    default:
      // Større og ukjente størrelser har ingen bekreftede vektdata.
      return null
  }
}

function withSelectedVariantWeights(
  section: ProductAccordionSection,
  productHandle: string,
  selectedVariant: SelectedVariant
): ProductAccordionSection {
  if (
    productHandle !== 'utekos-techdown' ||
    section.id !== 'materialer'
  ) {
    return section
  }

  const weights = getTechDownWeightSpecifications(
    selectedVariant
  )

  if (!weights) {
    return section
  }

  return {
    ...section,
    groups: section.groups.map((group, index) => {
      if (index !== 0) return group

      return {
        ...group,
        rows: [
          ...(group.rows ?? []),
          {
            label: 'Fyllvekt',
            value: weights.fillWeight
          },
          {
            label: 'Totalvekt',
            value: weights.totalWeight
          }
        ]
      }
    })
  }
}

function mapAccordionSection(
  section: ProductAccordionSection
): AccordionSectionData {
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

  const sectionData = sections.map(section =>
    mapAccordionSection(
      withSelectedVariantWeights(
        section,
        product.handle,
        selectedVariant
      )
    )
  )

  const containerId = `product-details-${product.handle}`

  return (
    <article
      id={containerId}
      className='relative order-3 overflow-hidden rounded-[1.75rem] py-2 md:col-start-1 md:row-start-2 md:py-0 xl:py-6'
      aria-labelledby='product-details-heading'
    >
      <ProductAccordionInteractionReporter
        containerId={containerId}
        product={product}
        selectedVariant={selectedVariant}
      />

      <div className='mx-auto text-left'>
        <AnimatedBlock
          className='will-animate-fade-in-scale mb-6'
          delay='0s'
          threshold={0.3}
        >
          <BrandBadge
            tone='neutral'
            className='gap-2 bg-jungle text-left'
          >
            <Info className='size-5' aria-hidden='true' />
            <h2
              id='product-details-heading'
              className='text-lg leading-[1.2] tracking-normal'
            >
              Produktdetaljer
            </h2>
          </BrandBadge>
        </AnimatedBlock>

        <div className='flex w-full flex-col'>
          {sectionData.map(section => (
            <ProductDetailsAccordionSection
              key={section.id}
              sectionData={section}
            />
          ))}
        </div>
      </div>
    </article>
  )
}