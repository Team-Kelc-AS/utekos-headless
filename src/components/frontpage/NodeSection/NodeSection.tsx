import { CustomerNetwork } from '@/components/frontpage/components/CustomerNetwork'
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'
import { PageSection } from '@/components/layout/PageSection'
import { cn } from '@/lib/utils/className'

const nodeSectionClassName =
  'relative isolate overflow-hidden rounded-[1.5rem] border border-border bg-jungle p-4 ring-1 ring-foreground/8 sm:p-8'

export async function NodeSection() {
  return (
    <PageSection
      as='article'
      background='muted'
      className={cn(
        'relative mt-4 overflow-hidden rounded-xl text-foreground md:mt-0'
      )}
      contentClassName='space-y-8 py-8 sm:py-8 md:space-y-6 md:py-10 lg:py-12'
    >
      <hgroup className='mx-auto max-w-4xl text-left text-foreground md:space-y-1'>
        <H2
          Text='Drevet av ekte opplevelser'
          ID='hello'
          className='pb-0 font-sans! font-extrabold md:pb-1'
        />
        <P
          Text='Våre beste produktutviklere er kundene våre.'
          className='mt-3! font-utekos-text-medium! text-xl leading-relaxed text-foreground/80 md:mt-0! md:leading-normal'
        />
        <P
          Text='Vi lytter, lærer og designer for at du kan skape flere og bedre minner utendørs.'
          className='mt-2! font-utekos-text-medium! text-lg leading-relaxed text-foreground/80! md:mt-0! md:leading-normal'
        />
      </hgroup>

      <div
        className={cn(
          nodeSectionClassName,
          'flex flex-col lg:justify-center'
        )}
      >
        <div
          className='pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent dark:via-border'
          aria-hidden='true'
        />
        <CustomerNetwork />
      </div>
    </PageSection>
  )
}
