import { ComfyrobeImageSection } from './ComfyrobeImageSection'
import { ComfyrobeContentColumn } from './ComfyrobeContentColumn'
import { comfyrobeMdxComponents } from './ComfyrobeMdxComponents'
import ComfyrobeStory from './ComfyrobeStory.mdx'
import type { ShopifyMediaImage } from 'types/media'
import { PageSection } from '@/components/layout/PageSection'
import { frontpageSectionStackClassName } from '@/components/frontpage/layout/frontpageSectionStack'
import { cn } from '@/lib/utils/className'
import comfyrobeProduct1200x1200 from '@/assets/images/comfyrobe/Comfyrobe-Product-1200x1200.webp'

const COMFYROBE_FALLBACK_IMAGE: ShopifyMediaImage = {
  id: 'comfyrobe-fallback',
  image: {
    id: 'comfyrobe-fallback',
    url: comfyrobeProduct1200x1200,
    altText: 'Comfyrobe™ - Vanntett og vindtett robe',
    width: 1200,
    height: 1200
  }
}

export function ComfyrobeSection() {
  const comfyrobeImage = COMFYROBE_FALLBACK_IMAGE

  return (
    <PageSection
      as='section'
      background='none'
      className={cn(
        frontpageSectionStackClassName,
        'bg-jungle text-foreground'
      )}
      contentClassName='max-w-none px-0 py-0 sm:px-0 sm:py-0 md:py-0 lg:px-0 lg:py-0'
    >
      <div className='relative isolate min-w-0 overflow-hidden'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,color-mix(in_oklch,var(--dark-teal)_80%,transparent),transparent_42%)]'
        />

        <div className='relative grid min-w-0 grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]'>
          <ComfyrobeImageSection image={comfyrobeImage} />

          <div className='flex min-w-0 items-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14 xl:px-16'>
            <ComfyrobeContentColumn>
              <ComfyrobeStory
                components={comfyrobeMdxComponents}
              />
            </ComfyrobeContentColumn>
          </div>
        </div>
      </div>
    </PageSection>
  )
}
