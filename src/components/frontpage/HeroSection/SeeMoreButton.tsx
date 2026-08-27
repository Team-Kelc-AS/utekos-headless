'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { InvitingArrow } from '@/components/motion/InvitingArrow'
import { reportCanonicalHeroInteract } from '@/lib/analytics/heroInteractReporter'

const HERO_DESTINATION = '/skreddersy-varmen'
const HERO_CTA_ID = 'read_more_hero'

export function SeeMoreButton() {

    return (  

    <div>
    <Button
            asChild
            variant='alternate'
            className='group min-h-11 gap-2 rounded-full bg-primary px-5 py-4 font-sans text-sm leading-none transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:px-6 md:px-8 md:py-6 lg:px-10 lg:py-7 lg:text-lg'
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
    </div>
    )
}