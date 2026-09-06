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
      contentClassName='space-y-10 px-5 py-10 sm:space-y-8 sm:px-6 sm:py-8 md:space-y-6 md:py-10 lg:px-8 lg:py-12'
    >
      <hgroup className='flex w-full flex-col gap-6 text-left text-foreground md:mx-auto md:max-w-4xl md:gap-2'>
        <H2
          ID='hello'
          className='w-full pb-1 font-sans! text-[clamp(2.35rem,10.2vw,2.5rem)] leading-[1.15] font-extrabold tracking-tight md:pb-1 md:text-5xl md:leading-none lg:text-6xl'
        >
          Drevet av ekte
          <br className='md:hidden' /> opplevelser
        </H2>
        <div className='flex w-full flex-col gap-4 md:gap-1'>
          <P
            Text='Våre beste produktutviklere er kundene våre.'
            className='mt-0! max-w-none font-utekos-text-medium! text-xl leading-relaxed text-foreground/85 md:leading-normal'
          />
          <P
            Text='Vi lytter, lærer og designer for at du kan skape flere og bedre minner utendørs.'
            className='mt-0! max-w-[36ch] font-utekos-text-medium! text-base leading-relaxed text-foreground/70 md:max-w-none md:text-lg md:leading-normal md:text-foreground/80!'
          />
        </div>
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
