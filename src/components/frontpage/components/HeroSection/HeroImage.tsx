import { cn } from '@/lib/utils/className'
import heroLargeImage from '@public/TechDown_32.jpg'
import heroSixteenTenImage from '@public/Hero-iPad.webp'
import heroMobileImage from '@public/TechDown_1.webp'
import { HeroExploreButton } from './HeroExploreButton'
import Image, {
  getImageProps,
  type StaticImageData
} from 'next/image'

const HERO_ALT =
  'To personer i Utekos TechDown i hengekøye i skogen, med kaffekopper.'

const HERO_SIZES =
  '(min-width: 640px) calc(100vw - 1.5rem), calc(100vw - 1rem)'

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
  const heroLargeSrcSet = getHeroSrcSet(heroLargeImage)
  const heroSixteenTenSrcSet = getHeroSrcSet(
    heroSixteenTenImage
  )

  return (
    <div
      className={cn(
        'group relative mx-auto mb-0 w-full max-w-sm overflow-hidden rounded-2xl border border-foreground/12 shadow-none sm:mb-5 sm:max-w-none sm:shadow-[0_28px_70px_-44px_color-mix(in_oklab,var(--card)_80%,transparent)] lg:mb-6'
      )}
    >
      <div className='relative aspect-1080/1704 rounded-2xl transition-transform duration-300 motion-safe:group-hover:scale-[1.01] sm:aspect-16/10 lg:aspect-video xl:aspect-video'>
        <picture className='block size-full'>
          <source
            media='(min-width: 1024px)'
            srcSet={heroLargeSrcSet}
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

        <div
          className={cn(
            'absolute top-1/4 left-1/2 z-10 hidden w-max -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-5 px-4 sm:flex'
          )}
        >
          <p
            className={cn(
              'pointer-events-none flex flex-col items-start gap-0 text-left font-sans text-4xl leading-none font-extrabold text-foreground uppercase drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.72)] md:text-5xl lg:text-6xl xl:text-7xl'
            )}
          >
            <span>Juster.</span>
            <span>Form.</span>
            <span className='text-primary'>Nyt.</span>
          </p>
          <HeroExploreButton />
        </div>
      </div>
    </div>
  )
}