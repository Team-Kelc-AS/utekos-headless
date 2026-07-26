// Path: src/components/ProductCard/ProductCardSoldOut.tsx
'use client'

import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'
import UtekosLogo from '@public/icon.png'
import Image from 'next/image'
import { H3 } from '@/components/typography/TypographyH3'
import { InlineText } from '@/components/typography/TypographyInlineText'
import { P } from '@/components/typography/TypographyP'

export function ProductCardSoldOut() {
  return (
    <HoverCard>
      <HoverCardTrigger
        delay={200}
        closeDelay={100}
        className='size-full min-h-12 cursor-not-allowed'
      >
        <BrandBadge
          backgroundColor='var(--disabled)'
          textColor='var(--foreground)'
          className='border-disabled/10 size-full min-h-12 cursor-not-allowed border text-base font-medium opacity-90'
        >
          <InlineText>Utsolgt</InlineText>
        </BrandBadge>
      </HoverCardTrigger>
      <HoverCardContent
        className='border-disabled/10 bg-disabled w-64 border text-foreground shadow-xl'
        side='top'
        align='center'
      >
        <div className='flex items-start space-x-3'>
          <Image
            src={UtekosLogo}
            alt='Utekos logo'
            width={20}
            height={20}
            className='border-disabled/10 mt-1 rounded-full border'
          />
          <div className='space-y-1'>
            <H3 className='pb-0 font-utekos-text-medium text-sm text-foreground'>
              Utsolgt for denne kombinasjonen
            </H3>
            <P className='/75 text-sm text-foreground/75 not-first:mt-0'>
              Prøv en annen farge eller størrelse.
            </P>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
