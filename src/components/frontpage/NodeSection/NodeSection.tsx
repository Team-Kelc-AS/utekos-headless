import { CustomerNetwork } from '@/components/frontpage/components/CustomerNetwork'
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'
import { PageSection } from '@/components/layout/PageSection'
import { frontpageSectionStackClassName } from '@/components/frontpage/layout/frontpageSectionStack'
import { cn } from '@/lib/utils/className'

const nodeSectionClassName =
  'relative isolate overflow-hidden rounded-[1.5rem] border border-border bg-jungle p-4 ring-1 ring-foreground/8 sm:p-8'

export async function NodeSection() {
  return (
    <PageSection
      as='article'
      background='muted'
      className={cn(
        frontpageSectionStackClassName,
        'text-foreground'
      )}
      contentClassName='space-y-10 px-5 pt-10 pb-[calc(--spacing(20)+--spacing(5))] sm:space-y-8 sm:px-6 sm:pt-12 sm:pb-[calc(--spacing(24)+--spacing(5))] md:space-y-6 md:pt-14 md:pb-[calc(--spacing(28)+--spacing(5))] lg:px-8 lg:pt-16 lg:pb-[calc(--spacing(32)+--spacing(5))]'
    >
      <hgroup className='flex w-full flex-col gap-3 text-left text-foreground sm:gap-4 md:mx-auto md:max-w-4xl md:gap-3'>
        <H2
          ID='hello'
          className='w-full pb-0 font-sans! text-[clamp(1.25rem,5.6vw,2.5rem)] leading-tight font-extrabold tracking-tight whitespace-nowrap sm:text-4xl md:text-5xl md:leading-none lg:text-6xl'
        >
          Drevet av ekte opplevelser
        </H2>
        <P className='mt-0! max-w-3xl font-utekos-text-medium! text-base leading-relaxed text-foreground/80 sm:text-lg'>
          Våre beste produktutviklere er kundene våre. Vi lytter, lærer og designer for at du kan skape flere og bedre minner utendørs.
        </P>
      </hgroup>

      <div
        className={cn(
          nodeSectionClassName,
          'flex flex-col lg:justify-center'
        )}
      >
        <div
          className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent'
          aria-hidden='true'
        />
        <CustomerNetwork />
      </div>
    </PageSection>
  )
}
