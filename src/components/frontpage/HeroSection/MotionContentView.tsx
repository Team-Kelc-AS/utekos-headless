'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { ArrowRight } from 'lucide-react'
import { TypographyH2 } from '@/app/inspirasjon/components/typography/TypographyH2'
import { Button } from '@/components/ui/button'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { HeroImage } from '@/components/frontpage/components/HeroSection/HeroImage'
import { reportCanonicalHeroInteract } from '@/lib/analytics/heroInteractReporter'

const HERO_CTA_ID = 'read_more_hero'
const HERO_DESTINATION = '/skreddersy-varmen'

export function MotionContentView() {
  return (
    <div className='align-center relative mx-auto mb-7 flex w-full max-w-[95%] flex-col items-center justify-center overflow-hidden text-center sm:mb-10'>
      <h1 id='hero-h1' className='sr-only'>
        Skreddersy varmen
      </h1>
      <HeroImage />
      <TypographyH2 />

      <div
        data-nosnippet
        className='mt-7 flex justify-center sm:mt-9'
      >
        <Button
          asChild
          variant='checkout'
          className='group min-h-11 gap-2 rounded-full bg-primary px-5 py-3 font-utekos-text-medium text-sm leading-none text-foreground transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6 md:px-8 md:py-4 lg:px-10 lg:py-5 lg:text-lg'
        >
          <Link
            href={HERO_DESTINATION as Route}
            aria-label='Gå til skreddersy varmen'
            data-track='ReadMoreHeroClick'
            onClick={() => {
              reportCanonicalHeroInteract({
                customData: {
                  cta_id: HERO_CTA_ID,
                  destination_path: HERO_DESTINATION,
                  click_sequence: 1
                }
              })
            }}
          >
            <InlineText>Se mer</InlineText>
            <ArrowRight className='size-4 text-current transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none' />
          </Link>
        </Button>
      </div>
    </div>
  )
}
