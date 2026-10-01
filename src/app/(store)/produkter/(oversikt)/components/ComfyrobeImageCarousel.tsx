// Path: src/app/(store)/produkter/(oversikt)/components/ComfyrobeImageCarousel.tsx

'use client'

import Image from 'next/image'
import { AnimatedBlock } from '@/components/AnimatedBlock'

export function ComfyrobeImageCarousel() {
  const comfyrobeImage = '/Flytende_marineblue_vinterparkas.webp'

  return (
    <AnimatedBlock className='will-animate-fade-in-left mx-auto flex w-full justify-center'>
      <div
        className='relative mx-auto w-full max-w-full overflow-hidden rounded-[1.35rem] bg-background/60 shadow-[0_24px_70px_-48px_color-mix(in_oklch,var(--background)_90%,transparent)]'
        style={{
          aspectRatio: '2 / 3'
        }}
      >
        <Image
          src={comfyrobeImage}
          alt='Mørkeblå Comfyrobe™ Fjellnatt, vist forfra.'
          fill
          quality={95}
          className='object-contain object-center'
          sizes='(max-width: 1024px) 92vw, 40vw'
        />
      </div>
    </AnimatedBlock>
  )
}
