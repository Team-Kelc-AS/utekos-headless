'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'
import { InvitingArrow } from '@/components/motion/InvitingArrow'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { reportCanonicalHeroInteract } from '@/lib/analytics/heroInteractReporter'

const HERO_CTA_ID = 'read_more_hero'
const HERO_DESTINATION = '/skreddersy-varmen'

export function HeroExploreButton() {
  return (
    <Button
      asChild
      variant='default'
      className='group mt-1 min-h-11 gap-2 rounded-full px-5 py-3 font-sans text-sm leading-none transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6 md:px-7 md:py-4 lg:text-base'
    >
      <Link
        href={HERO_DESTINATION as Route}
        aria-label='Utforsk'
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
        <InlineText>Utforsk</InlineText>
        <InvitingArrow />
      </Link>
    </Button>
  )
}
