import { GalleryColumn } from '@/components/jsx/GalleryColumn'
import { OptionsColumn } from '@/components/jsx/OptionsColumn'
import { ProductPageGrid } from '@/components/jsx/ProductPageGrid'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductPageSkeleton() {
  return (
    <article className='relative isolate overflow-hidden bg-overcast py-10 md:py-14'>
      <div className='pointer-events-none absolute inset-0 -z-10'>
        <div className='absolute top-12 left-[8%] h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ancient-water)_62%,transparent)_0%,transparent_72%)] blur-3xl' />
        <div className='absolute right-[8%] bottom-[18%] h-96 w-96 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--very-peri)_20%,transparent)_0%,transparent_72%)] blur-3xl' />
      </div>

      <div className='container mx-auto px-4 md:px-8'>
        <div className='mb-8 flex items-center gap-2'>
          <Skeleton className='h-5 w-16 bg-foreground/70' />
          <Skeleton className='h-5 w-4 bg-foreground/70' />
          <Skeleton className='h-5 w-24 bg-foreground/70' />
          <Skeleton className='h-5 w-4 bg-foreground/70' />
          <Skeleton className='h-5 w-32 bg-foreground/70' />
        </div>

        <ProductPageGrid>
          <GalleryColumn>
            <div className='mx-auto h-fit w-full md:sticky md:top-24'>
              <div className='hidden rounded-2xl bg-jungle p-2 md:block'>
                <Skeleton className='aspect-[9/10] w-full rounded-lg bg-foreground/70' />
              </div>
              <Skeleton className='aspect-2/3 w-full rounded-none bg-foreground/70 md:hidden' />
            </div>
          </GalleryColumn>

          <OptionsColumn>
            <div className='hidden md:block'>
              <Skeleton className='h-10 w-full bg-foreground/70' />
              <Skeleton className='mt-3 h-6 w-2/3 bg-foreground/70' />
            </div>
            <Skeleton className='mt-6 hidden h-8 w-28 bg-foreground/70 md:block' />

            <div className='rounded-3xl border border-foreground/70 bg-foreground/72 p-6 md:mt-6'>
              <div className='mt-10 space-y-8'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-20 bg-overcast/80' />
                  <Skeleton className='h-10 w-full bg-overcast/80' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-20 bg-overcast/80' />
                  <Skeleton className='h-10 w-full bg-overcast/80' />
                </div>
              </div>
              <Skeleton className='mt-8 h-12 w-full bg-overcast/80' />
              <div className='mt-12 space-y-3'>
                <Skeleton className='h-4 w-full bg-overcast/80' />
                <Skeleton className='h-4 w-full bg-overcast/80' />
                <Skeleton className='h-4 w-5/6 bg-overcast/80' />
              </div>
            </div>
          </OptionsColumn>
        </ProductPageGrid>
      </div>
    </article>
  )
}
