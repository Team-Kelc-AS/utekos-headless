import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'

import { SizeGuideSectionShell } from './SizeGuideSectionShell'

export function SizeGuideHero() {
  return (
    <SizeGuideSectionShell
      id='size-guide-hero'
      surface='muted'
      className='mb-4 rounded-xl border-b border-border'
    >
      <hgroup className='max-w-3xl'>
        <BrandBadge
          label=' Handlehjelp'
          bgColor='var(--card)'
          fgColor='var(--card-foreground)'
          className='mb-4 border border-border px-5 py-2.5 font-sans text-base tracking-wide sm:px-8 sm:py-3'
        />
        <h1 className='font-sans text-3xl leading-[1.05] font-extrabold text-foreground md:text-5xl lg:text-6xl'>
          Størrelsesguide
        </h1>
        <p className='/90 mt-5 max-w-2xl text-lg leading-relaxed text-foreground/90'>
          Riktig størrelse gir mer ro, bedre varme og en passform
          som følger deg ute. Bruk guiden til å velge trygt før
          du handler.
        </p>
      </hgroup>
    </SizeGuideSectionShell>
  )
}
