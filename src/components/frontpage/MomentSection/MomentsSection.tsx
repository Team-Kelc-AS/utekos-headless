import { TypographyMomentsH3 } from './TypographyMomentsH3'
import { MomentCardsGrid } from '@/components/frontpage/MomentSection/MomentCardsGrid'
import { cn } from '@/lib/utils/className'
import { PageSection } from '@/components/layout/PageSection'
import { Lead } from '@/components/typography/Lead'

export function MomentsSection() {
  return (
    <PageSection
      as='section'
      background='muted'
      className={cn('mx-auto relative overflow-hidden rounded-xl')}
    >
      <article className={cn('relative w-full overflow-hidden')}>
        <TypographyMomentsH3 />
        <Lead
          Text='Uansett hvor du finner roen, er Utekos designet for å gjøre opplevelsen bedre.'
          className='md:-4 -mt-2 text-xl! md:text-2xl!'
        />
        <MomentCardsGrid />
      </article>
    </PageSection>
  )
}
