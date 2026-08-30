import type { ReactNode } from 'react'
import Image, { type StaticImageData } from 'next/image'
import coffeUtekos from '@/assets/images/inspiration/coffe_utekos.webp'
import frontpageKateLinn from '@/assets/images/about/frontpage-kate-linn.webp'
import comfyrobeSherpa from '@/assets/images/comfyrobe/Comfyrobe-Sherpa-1440-2160.webp'
import { cn } from '@/lib/utils/className'

export const TECH_MATERIALS_PRODUCT_LINES = [
  'techdown',
  'dun',
  'mikrofiber',
  'comfyrobe',
  'konstruksjon'
] as const

export type TechMaterialsProductLineId =
  (typeof TECH_MATERIALS_PRODUCT_LINES)[number]

type ProductLineImage = {
  src: string | StaticImageData
  alt: string
  width: number
  height: number
}

type ProductLinePresentation = {
  name: string
  stripeClassName: string
  image: ProductLineImage | null
}

const productLineById = {
  techdown: {
    name: 'TechDown',
    stripeClassName: 'bg-secondary',
    image: {
      src: '/og-kate-linn-kikkert-master.png',
      alt: 'Utekos TechDown brukt ved sjøen i norsk vær',
      width: 1200,
      height: 630
    }
  },
  dun: {
    name: 'Dun',
    stripeClassName: 'bg-primary',
    image: {
      src: coffeUtekos,
      alt: 'Utekos Dun brukt på hytten en kald og tørr kveld',
      width: coffeUtekos.width,
      height: coffeUtekos.height
    }
  },
  mikrofiber: {
    name: 'Mikrofiber',
    stripeClassName: 'bg-cyan-400',
    image: {
      src: frontpageKateLinn,
      alt: 'Utekos Mikrofiber brukt som lett komfortplagg ute',
      width: frontpageKateLinn.width,
      height: frontpageKateLinn.height
    }
  },
  comfyrobe: {
    name: 'Comfyrobe',
    stripeClassName: 'bg-light-teal',
    image: {
      src: comfyrobeSherpa,
      alt: 'Comfyrobe™ med SherpaCore-fôr',
      width: comfyrobeSherpa.width,
      height: comfyrobeSherpa.height
    }
  },
  konstruksjon: {
    name: 'Konstruksjon',
    stripeClassName: 'bg-very-peri',
    image: null
  }
} as const satisfies Record<
  TechMaterialsProductLineId,
  ProductLinePresentation
>

function productLinePresentation(line: TechMaterialsProductLineId) {
  switch (line) {
    case 'techdown':
      return productLineById.techdown
    case 'dun':
      return productLineById.dun
    case 'mikrofiber':
      return productLineById.mikrofiber
    case 'comfyrobe':
      return productLineById.comfyrobe
    case 'konstruksjon':
      return productLineById.konstruksjon
    default: {
      const exhaustive: never = line
      throw new Error(`Ukjent produktlinje: ${exhaustive}`)
    }
  }
}

export function TechMaterialsProductLine({
  line,
  children
}: {
  line: TechMaterialsProductLineId
  children: ReactNode
}) {
  const presentation = productLinePresentation(line)

  return (
    <section
      data-product-line={line}
      className='relative my-12 overflow-hidden rounded-2xl border border-foreground/10 bg-jungle px-5 py-8 pl-7 md:px-8'
    >
      <div
        aria-hidden='true'
        className={cn(
          'absolute inset-y-0 left-0 w-1.5',
          presentation.stripeClassName
        )}
      />
      <p className='mb-4 font-utekos-text-medium text-sm tracking-[0.12em] text-foreground uppercase'>
        {presentation.name}
      </p>
      {presentation.image ?
        <div className='mb-6 overflow-hidden rounded-xl'>
          <Image
            src={presentation.image.src}
            alt={presentation.image.alt}
            width={presentation.image.width}
            height={presentation.image.height}
            sizes='(min-width: 80rem) 48rem, 100vw'
            className='aspect-4/3 h-auto w-full object-cover'
          />
        </div>
      : null}
      {children}
    </section>
  )
}
