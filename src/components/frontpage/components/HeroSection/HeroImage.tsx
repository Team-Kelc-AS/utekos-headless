import { cn } from '@/lib/utils/className'
import heroLgImage from '@/assets/images/gallery/utekos-brand-1400x735.webp'
import heroXlImage from '@/assets/images/gallery/utekos_1400_788.webp'
import heroSixteenTenImage from '@public/Hero-iPad.webp'
import heroMobileImage from '@public/TechDown_1.webp'
import Image, {
  getImageProps,
  type StaticImageData
} from 'next/image'

const HERO_ALT =
  'Utekos TechDown i mørk blå, vist i helfigur.'

const HERO_SIZES =
  '(min-width: 1152px) 1152px, (min-width: 640px) calc(100vw - 2rem), calc(100vw - 2rem)'

function getHeroSrcSet(src: StaticImageData) {
  const {
    props: { srcSet }
  } = getImageProps({
    src,
    alt: HERO_ALT,
    fill: true,
    sizes: HERO_SIZES
  })

  return srcSet
}

export function HeroImage() {
  const heroXlSrcSet = getHeroSrcSet(heroXlImage)
  const heroLgSrcSet = getHeroSrcSet(heroLgImage)
  const heroSixteenTenSrcSet = getHeroSrcSet(
    heroSixteenTenImage
  )

  return (
    <div
      className={cn(
        'group relative mx-auto mb-0 w-full max-w-sm overflow-hidden rounded-2xl border border-foreground/12 shadow-none sm:mb-12 sm:max-w-6xl sm:shadow-[0_28px_70px_-44px_color-mix(in_oklab,var(--card)_80%,transparent)] lg:mb-16'
      )}
    >
      <div className='relative aspect-1080/1704 rounded-2xl transition-transform duration-300 motion-safe:group-hover:scale-[1.01] sm:aspect-16/10 lg:aspect-video xl:aspect-video'>
        <picture className='block size-full'>
          <source
            media='(min-width: 1280px)'
            srcSet={heroXlSrcSet}
            sizes={HERO_SIZES}
          />

          <source
            media='(min-width: 1024px)'
            srcSet={heroLgSrcSet}
            sizes={HERO_SIZES}
          />

          <source
            media='(min-width: 640px)'
            srcSet={heroSixteenTenSrcSet}
            sizes={HERO_SIZES}
          />

          <Image
            src={heroMobileImage}
            alt={HERO_ALT}
            fill
            sizes={HERO_SIZES}
            loading='eager'
            fetchPriority='high'
            decoding='async'
            className='object-cover object-center'
          />
        </picture>
      </div>
    </div>
  )
}