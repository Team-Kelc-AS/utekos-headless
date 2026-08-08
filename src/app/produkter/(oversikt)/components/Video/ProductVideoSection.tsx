import { Suspense } from 'react'
import { Layers, Sun } from 'lucide-react'
import { TensorPixVideoCacheWrapper } from './TensorPixVideoCacheWrapper'
import { TypographyVideoSectionH2 } from './TypographyVideoSectionH2'
import { TypographyVideoSectionLead } from './TypographyVideoSectionLead'
import { NavigationButton } from './NavigationButton'
import { PageSection } from '@/components/layout/PageSection'

export function ProductVideoSection() {
  return (
    <article className='relative left-[calc(-50vw+50%)] w-screen overflow-hidden bg-muted py-10 text-foreground sm:py-16'>
      <PageSection as='div' background='none' className='border-t-0'>
        <div className='grid grid-cols-1 items-center gap-x-16 gap-y-16 lg:grid-cols-2'>
          <div className='relative mx-auto w-full max-w-sm'>
            <div className='from-ancient-water/10 to-interstellar/30 absolute -inset-4 -z-10 rounded-[2.5rem] bg-linear-to-tr blur-3xl' />
            <div className='bg-interstellar/50 relative overflow-hidden rounded-4xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl'>
              <div className='pointer-events-none absolute inset-0 z-10 rounded-4xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]' />
              <Suspense
                fallback={
                  <div
                    className='bg-interstellar/30 aspect-9/16 w-full animate-pulse rounded-4xl'
                    aria-hidden
                  />
                }
              >
                <TensorPixVideoCacheWrapper />
              </Suspense>
            </div>
          </div>
          <div className='text-center lg:text-left'>
            <TypographyVideoSectionH2 />
            <TypographyVideoSectionLead />
            <div className='animate-header-item'>
              <div className='mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start'>
                <div className='group flex w-full min-w-0 items-center gap-4 rounded-lg bg-jungle px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 sm:flex-1'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-xl border border-foreground/40 bg-dark-teal text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-transform duration-500 group-hover:scale-110'>
                    <Sun className='size-5 stroke-[1.5]' aria-hidden='true' />
                  </div>
                  <div className='text-left'>
                    <p className='font-sans text-[1rem] leading-[1.1] tracking-[-0.01em] text-foreground'>
                      Garantert varm
                    </p>
                    <p className='mt-1 font-sans text-[0.875rem] tracking-[-0.01em] text-foreground'>
                      Regisser din egen komfort
                    </p>
                  </div>
                </div>

                <div className='group flex w-full min-w-0 items-center gap-4 rounded-lg bg-jungle px-4 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90 sm:flex-1'>
                  <div className='flex size-12 shrink-0 items-center justify-center rounded-xl border border-foreground/40 bg-dark-teal text-foreground shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] transition-transform duration-500 group-hover:scale-110'>
                    <Layers className='size-5 stroke-[1.5]' aria-hidden='true' />
                  </div>
                  <div className='text-left'>
                    <p className='rounded-lg font-sans text-[1rem] leading-[1.1] tracking-[-0.01em] text-foreground'>
                      3-i-1 funksjonalitet
                    </p>
                    <p className='mt-1 font-sans text-[0.875rem] tracking-[-0.01em] text-foreground'>
                      Veksle mellom moduser
                    </p>
                  </div>
                </div>
              </div>
              <NavigationButton />
            </div>
          </div>
        </div>
      </PageSection>
    </article>
  )
}
