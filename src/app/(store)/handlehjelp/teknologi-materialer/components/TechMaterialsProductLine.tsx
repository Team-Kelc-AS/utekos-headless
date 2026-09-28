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

type ProductLinePresentation = { image: ProductLineImage | null }

const productLineById = {
  techdown: { image: null },
  dun: { image: null },
  mikrofiber: { image: null },
  comfyrobe: {
    image: {
      src: comfyrobeSherpa,
      alt: 'Comfyrobe™ med SherpaCore-fôr',
      width: comfyrobeSherpa.width,
      height: comfyrobeSherpa.height
    }
  },
  konstruksjon: { image: null }
} as const satisfies Record<
  TechMaterialsProductLineId,
  ProductLinePresentation
>

function productLinePresentation(
  line: TechMaterialsProductLineId
) {
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
      className='my-12 overflow-hidden rounded-2xl border border-foreground/10 bg-jungle px-6 py-9 md:px-10 md:py-10'
    >
      {presentation.image ?
        <div className='mb-6 flex justify-center'>
          <Image
            src={presentation.image.src}
            alt={presentation.image.alt}
            width={presentation.image.width}
            height={presentation.image.height}
            sizes='(min-width: 48rem) 28rem, calc(100vw - 2.5rem)'
            className='h-auto max-h-[42rem] w-auto max-w-full'
          />
        </div>
      : null}
      {children}
    </section>
  )
}
