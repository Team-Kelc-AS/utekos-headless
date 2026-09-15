import type { ReactNode } from 'react'
import Image, { type StaticImageData } from 'next/image'
import comfyrobeSherpa from '@/assets/images/comfyrobe/Comfyrobe-Sherpa-1440-2160.webp'

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
  image: ProductLineImage | null
}

const productLineById = {
  techdown: {
    image: null
  },
  dun: {
    image: null
  },
  mikrofiber: {
    image: null
  },
  comfyrobe: {
    image: {
      src: comfyrobeSherpa,
      alt: 'Comfyrobe™ med SherpaCore-fôr',
      width: comfyrobeSherpa.width,
      height: comfyrobeSherpa.height
    }
  },
  konstruksjon: {
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
      className='my-12 overflow-hidden rounded-2xl border border-foreground/10 bg-jungle px-5 py-8 md:px-8'
    >
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
