import heroSixteenNineImage from '@public/Skreddersy-Varmen-16x9.png'
import heroSixteenTenImage from '@public/SSV-16-10.webp'
import { cn } from '@/lib/utils/className'

const heroMobileImage = {
  src: '/TechDown.700x775.webp',
  width: 700,
  height: 775
} as const

const heroImageProps = {
  alt: 'To kvinner i Utekos TechDown sitter på en terassen og nyter ost og vin.',
  decoding: 'async',
  fetchPriority: 'high',
  loading: 'eager',
  sizes: '(min-width: 1152px) 1152px, (min-width: 640px) calc(100vw - 2rem), 100vw'
} as const

export function HeroImage() {
  return (
    <div
      className={cn(
        'group relative mx-auto mb-7 w-full max-w-none overflow-hidden rounded-none border-0 shadow-none sm:mb-10 sm:max-w-6xl sm:rounded-2xl sm:border sm:border-foreground/12 sm:shadow-[0_28px_70px_-44px_color-mix(in_oklab,var(--card)_80%,transparent)] sm:dark:border-dark-foreground/12'
      )}
    >
      <div
        className='relative aspect-[700/775] transition-transform duration-300 motion-safe:group-hover:scale-[1.01] sm:aspect-16/10 lg:aspect-video'
        suppressHydrationWarning
      >
        <picture className='block size-full'>
          <source
            media='(min-width: 1024px)'
            srcSet={`${heroSixteenNineImage.src} ${heroSixteenNineImage.width}w`}
          />
          <source
            media='(min-width: 640px)'
            srcSet={`${heroSixteenTenImage.src} ${heroSixteenTenImage.width}w`}
          />
          <source
            srcSet={`${heroMobileImage.src} ${heroMobileImage.width}w`}
          />
          <img
            alt={heroImageProps.alt}
            src={heroMobileImage.src}
            srcSet={`${heroMobileImage.src} ${heroMobileImage.width}w`}
            sizes={heroImageProps.sizes}
            loading={heroImageProps.loading}
            decoding={heroImageProps.decoding}
            fetchPriority={heroImageProps.fetchPriority}
            width={heroMobileImage.width}
            height={heroMobileImage.height}
            className='block size-full object-cover object-[50%_45%]'
          />
        </picture>
      </div>
    </div>
  )
}
