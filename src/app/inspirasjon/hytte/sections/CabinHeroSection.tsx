import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect'
import { InspirationHeroBreadcrumb } from '@/app/inspirasjon/layout/InspirationHeroBreadcrumb'
import { Mountain } from 'lucide-react'
import { Lead } from '@/components/typography/Lead'
import { H1 } from '@/components/typography/TypographyH1'
import { UtekosFlipWord } from '../../components/cards/UtekosFlipWord'

export function CabinHeroSection({
  children
}: {
  children?: React.ReactNode
}) {
  return (
    <article className=' relative isolate overflow-hidden border-b border-border bg-background text-foreground'>
      <BackgroundRippleEffect
        rows={16}
        cols={42}
        cellSize={48}
        interactive={true}
        className='/40 z-0 text-foreground/40 opacity-10'
      />
      <div className='relative z-10 w-full px-4 py-8 sm:px-6 sm:py-10 md:px-8 xl:px-10'>
        <div className='flex max-w-7xl flex-col items-start gap-2 text-left md:gap-4'>
          <InspirationHeroBreadcrumb
            label='Hytteliv'
            icon={Mountain}
          />
          <H1
            Text='Hyttelivet med Utekos'
            ID='cabin-hero-h1'
            className='pt-4 md:pt-6 lg:pt-8'
          />
          <Lead Text='Fra morgenkaffen på terrassen til kveldene under stjernene.' />
          <Lead
            Text='Gjør hytten til et varmt fristed, uansett årstid.'
            className='-mt-4'
          />
          <UtekosFlipWord />
          {children}
        </div>
      </div>
    </article>
  )
}
