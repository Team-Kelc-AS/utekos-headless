import { ComfyrobeImageSection } from './ComfyrobeImageSection'
import { ComfyrobeContentColumn } from './ComfyrobeContentColumn'
import type { ShopifyMediaImage } from 'types/media'
import { PageSection } from '@/components/layout/PageSection'
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
      background='default'
      className={cn('mx-auto items-center')}
    >
      <div className='dark:border-dark-foreground/12 relative min-w-0 overflow-hidden rounded-2xl border border-foreground/12 bg-jungle px-6 py-8 text-foreground'>
        <div className='absolute inset-0 -z-10 overflow-hidden'>
          <div
            className='absolute top-1/4 left-1/4 size-150 opacity-15 blur-3xl'
            style={{
              background:
                'radial-gradient(circle, #00453E 0%, transparent 70%)'
            }}
          />
          <div
            className='absolute right-1/4 bottom-1/4 size-150 opacity-10 blur-3xl'
            style={{
              background:
                'radial-gradient(circle, #00453E 0%, transparent 70%)'
            }}
          />
        </div>
        <div className='relative grid min-w-0 grid-cols-1 items-stretch gap-12 rounded-2xl lg:grid-cols-2'>
          <ComfyrobeImageSection image={comfyrobeImage} />

          <ComfyrobeContentColumn />
        </div>
      </div>
    </PageSection>
  )
}
