import { SizeGuideSectionShell } from './SizeGuideSectionShell'
import type { SizeGuideSectionSurface } from './SizeGuideSectionShell'
import { LazyFeaturedProductCarousel } from '@/components/ProductCard/LazyFeaturedProductCarousel'
import { cn } from '@/lib/utils/className'

export async function BackToShopCta({
  className,
  surface = 'background'
}: {
  className?: string
  surface?: SizeGuideSectionSurface
} = {}) {
  return (
    <SizeGuideSectionShell
      id='size-guide-cta'
      surface={surface}
      ariaLabelledby='size-guide-cta-heading'
      className={cn(
        'mt-4 mb-12 rounded-xl border-t border-border lg:mb-16',
        className
      )}
      contentClassName='rounded-xl py-8 sm:py-8 md:px-8 md:py-12 lg:px-12 lg:py-12'
    >
      <div className='mx-auto w-full bg-transparent text-left lg:max-w-7xl'>
        <div className='mb-8 rounded-lg py-2 text-left shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)] sm:py-8'>
          <h2
            id='size-guide-cta-heading'
            className='text-left font-sans text-3xl leading-[1.05] font-extrabold text-inherit sm:text-5xl md:text-5xl lg:text-6xl'
          >
            Klar for å kjøpe din Utekos?
          </h2>
        </div>
        <LazyFeaturedProductCarousel />
      </div>
    </SizeGuideSectionShell>
  )
}
