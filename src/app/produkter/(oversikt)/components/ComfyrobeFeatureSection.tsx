// Path: src/app/produkter/(oversikt)/components/ComfyrobeFeatureSection.tsx

import Link from 'next/link'
import type { Route } from 'next'
import { AnimatedBlock } from '@/components/AnimatedBlock'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { Button } from '@/components/ui/button'
import { LazyComfyrobeImageCarousel } from '@/app/produkter/(oversikt)/components/LazyComfyrobeImageCarousel'
import { ArrowRight, Wind } from 'lucide-react'

export function ComfyrobeFeatureSection() {
  return (
    <article
      aria-labelledby='comfyrobe-feature-heading'
      className='w-full py-10 sm:py-16'
    >
      <div className='container mx-auto px-4'>
        <div className='border-coral-green relative overflow-hidden rounded-[1.75rem] border bg-background p-5 shadow-[0_28px_90px_-62px_color-mix(in_oklch,var(--background)_90%,transparent)] sm:p-8 lg:p-12'>
          <div className='pointer-events-none absolute inset-0 opacity-70'>
            <div
              className='size-136rounded-full absolute top-0 -left-24 blur-3xl'
              style={{
                background:
                  'radial-gradient(circle, color-mix(in oklch, var(--card) 42%, transparent) 0%, transparent 70%)'
              }}
            />
            <div
              className='absolute -right-24 bottom-0 size-136 rounded-full blur-3xl'
              style={{
                background:
                  'radial-gradient(circle, color-mix(in oklch, var(--card) 38%, transparent) 0%, transparent 72%)'
              }}
            />
            <div
              className='absolute top-1/2 left-1/2 size-120 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl'
              style={{
                background:
                  'radial-gradient(circle, color-mix(in oklch, var(--background) 28%, transparent) 0%, transparent 74%)'
              }}
            />
          </div>

          <div className='relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-12'>
            <LazyComfyrobeImageCarousel />

            <AnimatedBlock className='will-animate-fade-in-right'>
              <div className='flex flex-col justify-start'>
                <div>
                  <AnimatedBlock className='will-animate-fade-in-up'>
                    <BrandBadge
                      backgroundColor='var(--card)'
                      textColor='var(--foreground)'
                      className='border-pine mb-5 gap-2 border px-4 py-2 text-sm font-medium shadow-[0_16px_34px_-28px_color-mix(in_oklch,var(--jungle)_68%,transparent)]'
                    >
                      <Wind
                        className='text-coral-green size-4'
                        aria-hidden='true'
                      />
                      <span>Comfyrobe™</span>
                    </BrandBadge>
                  </AnimatedBlock>

                  <AnimatedBlock
                    className='will-animate-fade-in-up'
                    delay='0.05s'
                  >
                    <h2
                      id='comfyrobe-feature-heading'
                      className='font-google-sans max-w-2xl font-sans text-3xl leading-[0.95] font-bold text-balance text-foreground sm:text-4xl lg:text-5xl'
                    >
                      Forleng utekosen.
                      <br />
                      <span className='text-heading-secondary'>
                        Uansett vær.
                      </span>
                    </h2>
                  </AnimatedBlock>

                  <AnimatedBlock
                    className='will-animate-fade-in-up'
                    delay='0.1s'
                  >
                    <p className='leading-text-paragraph /88 mt-6 max-w-2xl text-lg text-foreground/88'>
                      Comfyrobe™ er den ultimate allværskåpen for
                      livsnyteren. Den kombinerer den urokkelige
                      beskyttelsen til en teknisk skalljakke med
                      den komfortable omfavnelsen av din mykeste
                      badekåpe.
                    </p>
                  </AnimatedBlock>

                  <AnimatedBlock
                    className='will-animate-fade-in-up'
                    delay='0.5s'
                  >
                    <div className='mt-8 flex w-full flex-col items-start gap-4 sm:flex-row sm:items-center'>
                      <p className='font-google-sans shrink-0 font-sans text-4xl leading-none font-bold whitespace-nowrap text-foreground'>
                        NOK 990,-
                      </p>

                      <Button
                        asChild
                        variant='seeProduct'
                        size='lg'
                        className='group min-h-12 w-full gap-2 rounded-full px-6 py-3 font-utekos-text-medium text-base leading-[1.35] whitespace-normal shadow-[0_18px_40px_-28px_color-mix(in_oklch,var(--sidebar-primary)_70%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto sm:whitespace-nowrap'
                      >
                        <Link
                          href={'/produkter/comfyrobe' as Route}
                          data-track='ComfyrobeExploreProductPageClick'
                        >
                          Utforsk Comfyrobe™
                          <ArrowRight className='ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none' />
                        </Link>
                      </Button>
                    </div>
                  </AnimatedBlock>
                </div>
              </div>
            </AnimatedBlock>
          </div>
        </div>
      </div>
    </article>
  )
}
