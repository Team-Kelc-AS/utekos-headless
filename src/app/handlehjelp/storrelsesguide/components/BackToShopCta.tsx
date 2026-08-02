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
        'my-4 rounded-lg border-t border-border',
        className
      )}
      contentClassName='md:px-8 lg:px-12'
    >
      <div className='mx-auto w-full text-left lg:max-w-7xl'>
        <div className='mb-8 rounded-lg py-2 text-left shadow-[0_18px_46px_-38px_color-mix(in_oklab,var(--background)_90%,transparent)] sm:py-8'>
          <h2
            id='size-guide-cta-heading'
            className='text-left font-sans text-3xl leading-[1.05] font-extrabold text-inherit sm:text-5xl'
          >
            Klar for å kjøpe din Utekos?
          </h2>
        </div>
        <LazyFeaturedProductCarousel />
      </div>
    </SizeGuideSectionShell>
  )
}
