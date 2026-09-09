// Path: src/app/skreddersy-varmen/components/LandingPageProductCarouselPurchaseSection.tsx
import 'server-only'

import Image from 'next/image'
import TechDownTerraceImage from '@/assets/images/techdown/TechDown-Terrasse-2048x2720.webp'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { LandingPurchaseGallery } from './LandingPurchaseGallery'
import { PRODUCT_VARIANTS } from '@/api/constants'

const TECHDOWN_IMAGE_ALTS = [
  'Person som sitter på en terrasse i mørkeblå Utekos TechDown™.',
  'Mørkeblå Utekos TechDown™ i fullengdemodus sett skrått forfra.',
  'Mørkeblå Utekos TechDown™ i fullengdemodus sett bakfra.',
  'Mørkeblå Utekos TechDown™ sett forfra i oppjustert modus.'
] as const

export function LandingPageProductCarouselPurchaseSection() {
  const currentConfig = PRODUCT_VARIANTS['utekos-techdown']
  const galleryImages = [
    TechDownTerraceImage,
    ...currentConfig.images.slice(1)
  ]

  return (
    <div className='relative flex w-full flex-col items-center justify-center bg-jungle min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-svh min-[900px]:self-start min-[900px]:p-8 min-[1280px]:p-12 lg:top-20 xl:top-22.5'>
      <BrandBadge
        tone='promo'
        className='animate-in fade-in slide-in-from-left-2 absolute top-4 left-4 z-20 bg-primary px-4 py-1.5 font-utekos-text-medium text-xs tracking-normal text-primary-foreground shadow-lg duration-500 min-[900px]:top-8 min-[900px]:left-8 min-[1280px]:top-12 min-[1280px]:left-12'
      >
        <span className='whitespace-nowrap'>
          {currentConfig.badge}
        </span>
      </BrandBadge>

      <LandingPurchaseGallery
        slides={galleryImages.map((src, index) => (
          <div
            key={typeof src === 'string' ? src : src.src}
            className='relative aspect-4/5 md:aspect-3/4'
          >
            <div className='relative size-full overflow-hidden min-[900px]:rounded-2xl min-[900px]:shadow-2xl min-[900px]:ring-1 min-[900px]:ring-background/10'>
              <Image
                src={src}
                alt={
                  TECHDOWN_IMAGE_ALTS[index] ??
                  `${currentConfig.title} sett fra en ny vinkel.`
                }
                fill
                className='object-cover'
                sizes='(max-width: 899px) 100vw, 40vw'
                loading='lazy'
              />
            </div>
          </div>
        ))}
      />
    </div>
  )
}
